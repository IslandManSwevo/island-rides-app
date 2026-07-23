import type { Job } from 'bullmq';
import { prisma } from '../lib/prisma.js';
import { paypalGateway } from '../modules/payments/paypal.js';
import { canTransition } from '../modules/bookings/stateMachine.js';
import { enqueue, type JobName } from './queue.js';

const DAY = 24 * 60 * 60 * 1000;
const PAYOUT_DELAY_AFTER_START = 3 * DAY; // host paid ~3 days into the trip
const AUTO_COMPLETE_GRACE = DAY; // close a trip 24h after end if no check-out
const REVIEW_REVEAL = 14 * DAY; // blind reviews publish at 14 days

// ---- Scheduling helpers (called from booking routes) ----

export async function scheduleExpiry(bookingId: string, deadline: Date): Promise<void> {
  await enqueue('expire-booking', { bookingId }, deadline.getTime() - Date.now(), {
    jobId: `expire:${bookingId}`,
  });
}

/** Confirmed bookings (Instant Book or on approval) schedule payout + auto-complete. */
export async function scheduleTripLifecycle(bookingId: string, startAt: Date, endAt: Date): Promise<void> {
  await enqueue('schedule-payout', { bookingId }, startAt.getTime() + PAYOUT_DELAY_AFTER_START - Date.now(), {
    jobId: `payout:${bookingId}`,
  });
  await enqueue('auto-complete-trip', { bookingId }, endAt.getTime() + AUTO_COMPLETE_GRACE - Date.now(), {
    jobId: `autocomplete:${bookingId}`,
  });
}

// ---- Processors ----

async function expireBooking(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { payments: true } });
  if (!booking || booking.status !== 'pending') return; // already answered — nothing to do
  if (!canTransition(booking.status, 'expired', 'system')) return;

  const payment = booking.payments.find((p) => p.kind === 'trip');
  if (payment?.gatewayRef) {
    await paypalGateway.voidAuthorization(payment.gatewayRef).catch(() => undefined);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
  }
  await prisma.booking.update({ where: { id: bookingId }, data: { status: 'expired' } });
}

async function schedulePayout(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vehicle: { include: { host: true } } },
  });
  // Only pay out trips that actually ran (or are running) and confirmed.
  if (!booking || !['confirmed', 'active', 'completed', 'reviewed'].includes(booking.status)) return;

  const host = booking.vehicle.host;
  const existing = await prisma.payout.findFirst({ where: { bookingId, status: { not: 'failed' } } });
  if (existing) return; // idempotent

  const payout = await prisma.payout.create({
    data: {
      hostId: host.id,
      bookingId,
      amountCents: booking.hostEarningsCents,
      status: 'scheduled',
      scheduledFor: new Date(),
    },
  });

  if (host.payoutEnabled && host.paypalPayerEmail) {
    try {
      const batchRef = await paypalGateway.payout(
        host.paypalPayerEmail,
        booking.hostEarningsCents,
        `KeyLo trip ${bookingId}`
      );
      await prisma.payout.update({ where: { id: payout.id }, data: { status: 'paid', gatewayBatchRef: batchRef } });
    } catch {
      await prisma.payout.update({ where: { id: payout.id }, data: { status: 'failed' } });
      throw new Error(`Payout failed for booking ${bookingId}`); // let BullMQ retry
    }
  }
  // No PayPal email yet: the payout stays 'scheduled' until the host connects one.
}

async function autoCompleteTrip(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.status !== 'active') return; // never picked up, or already completed
  if (!canTransition(booking.status, 'completed', 'system')) return;

  await prisma.booking.update({ where: { id: bookingId }, data: { status: 'completed' } });
  // Start the blind-review reveal clock.
  await enqueue('reveal-reviews', { bookingId }, REVIEW_REVEAL, { jobId: `reveal:${bookingId}` });
}

async function revealReviews(bookingId: string): Promise<void> {
  // Publish any reviews still blind after the window (both-submitted reveals
  // happen inline at submit time; this is the 14-day backstop).
  await prisma.review.updateMany({
    where: { bookingId, publishedAt: null },
    data: { publishedAt: new Date() },
  });
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (booking?.status === 'completed' && canTransition('completed', 'reviewed', 'system')) {
    await prisma.booking.update({ where: { id: bookingId }, data: { status: 'reviewed' } });
  }
}

const PROCESSORS: Record<JobName, (bookingId: string) => Promise<void>> = {
  'expire-booking': expireBooking,
  'schedule-payout': schedulePayout,
  'auto-complete-trip': autoCompleteTrip,
  'reveal-reviews': revealReviews,
};

export async function processJob(job: Job): Promise<void> {
  const processor = PROCESSORS[job.name as JobName];
  if (!processor) return;
  await processor((job.data as { bookingId: string }).bookingId);
}
