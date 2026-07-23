import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { quote, SERVICE_FEE_BPS } from './pricing.js';
import { assertTransition, IllegalTransitionError } from './stateMachine.js';
import { paypalGateway } from '../payments/paypal.js';
import { scheduleExpiry, scheduleTripLifecycle, scheduleAutoComplete, scheduleReviewReveal } from '../../jobs/index.js';
import { sendToUser } from '../../lib/push.js';

const quoteSchema = z.object({
  vehicleId: z.string(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  pickupKind: z.enum(['host_location', 'airport', 'delivery']).default('host_location'),
  protectionPlanId: z.string().default('standard'),
  extraIds: z.array(z.string()).default([]),
});

const createSchema = quoteSchema.extend({
  pickupAddress: z.string().optional(),
  flightNumber: z.string().max(10).optional(), // airport pickups: host tracks the flight
  requestMessage: z.string().max(1000).optional(),
});

const nightsBetween = (start: Date, end: Date) =>
  Math.max(1, Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));

async function buildQuote(input: z.infer<typeof quoteSchema>) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: input.vehicleId },
    include: { host: true, extras: { where: { id: { in: input.extraIds }, active: true } } },
  });
  if (!vehicle) return null;
  const plan = await prisma.protectionPlan.findUnique({ where: { id: input.protectionPlanId } });
  if (!plan?.active) return null;

  const nights = nightsBetween(input.startAt, input.endAt);
  return {
    vehicle,
    plan,
    nights,
    breakdown: quote(
      { vehicle, plan, nights, pickupKind: input.pickupKind, extras: vehicle.extras },
      vehicle.host.earningsSplitBps
    ),
  };
}

export async function bookingRoutes(app: FastifyInstance) {
  // 🌐 POST /v1/bookings/quote — server-authoritative checkout math
  app.post('/quote', async (request, reply) => {
    const input = quoteSchema.parse(request.body);
    const result = await buildQuote(input);
    if (!result) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vehicle or plan not found' } });
    }
    return { quote: result.breakdown };
  });

  // 🔑 POST /v1/bookings — pending (request) or confirmed (Instant Book)
  app.post('/', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const input = createSchema.parse(request.body);
    const result = await buildQuote(input);
    if (!result) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vehicle or plan not found' } });
    }
    const { vehicle, plan, nights, breakdown } = result;

    if (input.flightNumber && input.pickupKind !== 'airport') {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'flightNumber requires airport pickup' } });
    }

    const guest = await prisma.user.findUniqueOrThrow({ where: { id: request.auth!.sub } });
    if (guest.verificationStatus !== 'verified') {
      return reply.code(403).send({
        error: { code: 'VALIDATION_ERROR', message: 'Driver verification required before booking' },
      });
    }

    const instant = vehicle.instantBook;
    const booking = await prisma.booking.create({
      data: {
        guestId: guest.id,
        vehicleId: vehicle.id,
        status: instant ? 'confirmed' : 'pending',
        startAt: input.startAt,
        endAt: input.endAt,
        pickupKind: input.pickupKind,
        pickupAddress: input.pickupAddress,
        flightNumber: input.flightNumber,
        requestMessage: input.requestMessage,
        approvalDeadline: instant
          ? null
          : new Date(Date.now() + vehicle.approvalWindowHrs * 60 * 60 * 1000),
        nightlyRateCents: breakdown.nightlyRateCents,
        nights,
        durationDiscountCents: breakdown.durationDiscountCents,
        extrasCents: breakdown.extrasCents,
        deliveryCents: breakdown.deliveryCents,
        youngDriverCents: breakdown.youngDriverCents,
        protectionPlanId: plan.id,
        protectionCents: breakdown.protectionCents,
        serviceFeeCents: breakdown.serviceFeeCents,
        totalCents: breakdown.totalCents,
        hostEarningsCents: breakdown.hostEarningsCents,
        extras: {
          create: vehicle.extras.map((extra) => ({ extraId: extra.id, priceCentsSnapshot: extra.priceCents })),
        },
      },
    });

    // Request-to-book authorizes; Instant Book captures immediately.
    const order = await paypalGateway.createOrder(
      breakdown.totalCents,
      instant ? 'CAPTURE' : 'AUTHORIZE',
      booking.id
    );
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amountCents: breakdown.totalCents,
        status: 'requires_payment',
        gatewayRef: order.gatewayRef,
      },
    });

    // Schedule the lifecycle jobs (no-op without Redis).
    if (instant) {
      await scheduleTripLifecycle(booking.id, booking.startAt, booking.endAt);
    } else if (booking.approvalDeadline) {
      await scheduleExpiry(booking.id, booking.approvalDeadline);
    }

    // Notify the host: a new request to approve, or an Instant Book confirmed.
    await sendToUser(vehicle.host.userId, {
      title: instant ? 'New booking confirmed' : 'New booking request',
      body: `${vehicle.make} ${vehicle.model} · ${nights} day${nights === 1 ? '' : 's'}`,
      data: { bookingId: booking.id },
    });

    return reply.code(201).send({ booking, approveUrl: order.approveUrl });
  });

  // 🔑 GET /v1/bookings — own bookings (guest or host side)
  app.get('/', { preHandler: [app.requireAuth] }, async (request) => {
    const q = z
      .object({ role: z.enum(['guest', 'host']).default('guest'), status: z.string().optional() })
      .parse(request.query);

    if (q.role === 'host') {
      const host = await prisma.hostProfile.findUnique({ where: { userId: request.auth!.sub } });
      if (!host) return { bookings: [] };
      const bookings = await prisma.booking.findMany({
        where: { vehicle: { hostId: host.id }, ...(q.status ? { status: q.status as never } : {}) },
        include: { vehicle: true, guest: { select: { firstName: true, lastName: true } } },
        orderBy: { startAt: 'desc' },
      });
      return { bookings };
    }

    const bookings = await prisma.booking.findMany({
      where: { guestId: request.auth!.sub, ...(q.status ? { status: q.status as never } : {}) },
      include: { vehicle: { include: { photos: { where: { isPrimary: true }, take: 1 } } } },
      orderBy: { startAt: 'desc' },
    });
    return { bookings };
  });

  // 🚗 POST /v1/bookings/:id/approve — capture payment, confirm
  app.post('/:id/approve', { preHandler: [app.requireHost] }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { vehicle: { include: { host: true } }, payments: true },
    });
    if (!booking || booking.vehicle.host.userId !== request.auth!.sub) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }
    try {
      assertTransition(booking.status, 'confirmed', 'host');
    } catch (e) {
      if (e instanceof IllegalTransitionError) {
        return reply.code(409).send({ error: { code: 'VALIDATION_ERROR', message: e.message } });
      }
      throw e;
    }
    const payment = booking.payments.find((p) => p.kind === 'trip');
    if (payment?.gatewayRef) await paypalGateway.captureOrder(payment.gatewayRef);
    const updated = await prisma.booking.update({ where: { id }, data: { status: 'confirmed' } });
    // Approval confirms the trip → schedule payout + auto-complete.
    await scheduleTripLifecycle(updated.id, updated.startAt, updated.endAt);
    await sendToUser(booking.guestId, {
      title: 'Booking confirmed 🎉',
      body: 'Your host approved the trip. You’ve got the keys.',
      data: { bookingId: id },
    });
    return { booking: updated };
  });

  // 🚗 POST /v1/bookings/:id/decline
  app.post('/:id/decline', { preHandler: [app.requireHost] }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({ reason: z.string().max(500).optional() }).parse(request.body ?? {});
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { vehicle: { include: { host: true } }, payments: true },
    });
    if (!booking || booking.vehicle.host.userId !== request.auth!.sub) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }
    try {
      assertTransition(booking.status, 'declined', 'host');
    } catch (e) {
      if (e instanceof IllegalTransitionError) {
        return reply.code(409).send({ error: { code: 'VALIDATION_ERROR', message: e.message } });
      }
      throw e;
    }
    const payment = booking.payments.find((p) => p.kind === 'trip');
    if (payment?.gatewayRef) await paypalGateway.voidAuthorization(payment.gatewayRef);
    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'declined', declineReason: body.reason },
    });
    await sendToUser(booking.guestId, {
      title: 'Booking not available',
      body: 'Your host couldn’t take this trip — your hold was released.',
      data: { bookingId: id },
    });
    return { booking: updated };
  });

  // 🔑 POST /v1/bookings/:id/check-in — offline-tolerant (photos may sync later)
  app.post('/:id/check-in', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z
      .object({
        odometer: z.number().int().optional(),
        fuelLevel: z.number().int().min(0).max(100).optional(),
        photoKeys: z.array(z.string()).default([]),
        notes: z.string().max(1000).optional(),
      })
      .parse(request.body);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { vehicle: { include: { host: true } }, inspections: true },
    });
    if (!booking) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Booking not found' } });

    const isGuest = booking.guestId === request.auth!.sub;
    const isHost = booking.vehicle.host.userId === request.auth!.sub;
    if (!isGuest && !isHost) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }
    if (booking.status !== 'confirmed') {
      return reply.code(409).send({ error: { code: 'VALIDATION_ERROR', message: 'Booking is not awaiting check-in' } });
    }

    const party = isGuest ? 'guest' : 'host';
    await prisma.tripInspection.upsert({
      where: { bookingId_phase_party: { bookingId: id, phase: 'check_in', party } },
      update: { ...body, syncedAt: body.photoKeys.length >= 6 ? new Date() : null },
      create: {
        bookingId: id,
        phase: 'check_in',
        party,
        partyUserId: request.auth!.sub,
        ...body,
        syncedAt: body.photoKeys.length >= 6 ? new Date() : null,
      },
    });

    // Both parties checked in → trip goes active (system transition).
    const parties = new Set(
      (await prisma.tripInspection.findMany({ where: { bookingId: id, phase: 'check_in' } })).map((i) => i.party)
    );
    if (parties.has('guest') && parties.has('host')) {
      assertTransition(booking.status, 'active', 'system');
      await prisma.booking.update({ where: { id }, data: { status: 'active' } });
    }

    return { success: true, tripActive: parties.has('guest') && parties.has('host') };
  });

  // 🔑 POST /v1/bookings/:id/check-out — mirror of check-in; active → completed
  app.post('/:id/check-out', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z
      .object({
        odometer: z.number().int().optional(),
        fuelLevel: z.number().int().min(0).max(100).optional(),
        photoKeys: z.array(z.string()).default([]),
        notes: z.string().max(1000).optional(),
      })
      .parse(request.body);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { vehicle: { include: { host: true } } },
    });
    if (!booking) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Booking not found' } });

    const isGuest = booking.guestId === request.auth!.sub;
    const isHost = booking.vehicle.host.userId === request.auth!.sub;
    if (!isGuest && !isHost) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }
    if (booking.status !== 'active') {
      return reply.code(409).send({ error: { code: 'VALIDATION_ERROR', message: 'Trip is not active' } });
    }

    const party = isGuest ? 'guest' : 'host';
    await prisma.tripInspection.upsert({
      where: { bookingId_phase_party: { bookingId: id, phase: 'check_out', party } },
      update: { ...body, syncedAt: body.photoKeys.length >= 6 ? new Date() : null },
      create: {
        bookingId: id,
        phase: 'check_out',
        party,
        partyUserId: request.auth!.sub,
        ...body,
        syncedAt: body.photoKeys.length >= 6 ? new Date() : null,
      },
    });

    const parties = new Set(
      (await prisma.tripInspection.findMany({ where: { bookingId: id, phase: 'check_out' } })).map((i) => i.party)
    );
    const complete = parties.has('guest') && parties.has('host');
    if (complete) {
      assertTransition(booking.status, 'completed', 'system');
      await prisma.booking.update({ where: { id }, data: { status: 'completed' } });
      await scheduleReviewReveal(id); // start the 14-day blind-review clock
    }

    return { success: true, tripCompleted: complete };
  });

  // 🔑 POST /v1/bookings/:id/cancel — policy-based refund (design/02-user-flows.md)
  app.post('/:id/cancel', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const { reason } = z.object({ reason: z.string().max(500).optional() }).parse(request.body ?? {});

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { vehicle: { include: { host: true } }, payments: true },
    });
    if (!booking) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Booking not found' } });

    const isGuest = booking.guestId === request.auth!.sub;
    const isHost = booking.vehicle.host.userId === request.auth!.sub;
    if (!isGuest && !isHost) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }

    const actor = isGuest ? 'guest' : 'host';
    try {
      assertTransition(booking.status, 'cancelled', actor);
    } catch (e) {
      if (e instanceof IllegalTransitionError) {
        return reply.code(409).send({ error: { code: 'VALIDATION_ERROR', message: 'This booking can no longer be cancelled' } });
      }
      throw e;
    }

    // Refund policy: host cancel → 100%; guest → 100% if ≥24h before start,
    // 50% inside 24h, 0% once the trip window has started.
    const hoursToStart = (booking.startAt.getTime() - Date.now()) / 3_600_000;
    let refundRatio = 0;
    if (isHost) refundRatio = 1;
    else if (hoursToStart >= 24) refundRatio = 1;
    else if (hoursToStart > 0) refundRatio = 0.5;

    const payment = booking.payments.find((p) => p.kind === 'trip');
    let refundCents = 0;
    if (payment?.gatewayRef) {
      if (payment.status === 'authorized' || booking.status === 'pending') {
        // Not captured yet — just release the hold.
        await paypalGateway.voidAuthorization(payment.gatewayRef).catch(() => undefined);
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
      } else if (payment.status === 'captured') {
        refundCents = Math.round(booking.totalCents * refundRatio);
        if (refundCents > 0) {
          await paypalGateway.refund(payment.gatewayRef, refundCents).catch(() => undefined);
        }
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: refundCents >= booking.totalCents ? 'refunded' : refundCents > 0 ? 'partially_refunded' : 'captured',
            refundedCents: refundCents,
          },
        });
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled', cancelledBy: actor, declineReason: reason, cancellationRefundCents: refundCents },
    });
    return { booking: updated, refundCents };
  });

  // 🔑 POST /v1/bookings/:id/extend — reprice added days, authorize the delta
  app.post('/:id/extend', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const { newEndAt } = z.object({ newEndAt: z.coerce.date() }).parse(request.body);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { vehicle: true, protectionPlan: true },
    });
    if (!booking || booking.guestId !== request.auth!.sub) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }
    if (!['confirmed', 'active'].includes(booking.status)) {
      return reply.code(409).send({ error: { code: 'VALIDATION_ERROR', message: 'Only an upcoming or active trip can be extended' } });
    }
    if (newEndAt.getTime() <= booking.endAt.getTime()) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'New end must be after the current end' } });
    }

    // No overlapping booking on the vehicle for the added window.
    const conflict = await prisma.booking.findFirst({
      where: {
        vehicleId: booking.vehicleId,
        id: { not: booking.id },
        status: { in: ['confirmed', 'active'] },
        startAt: { lt: newEndAt },
        endAt: { gt: booking.endAt },
      },
    });
    if (conflict) {
      return reply.code(409).send({ error: { code: 'VALIDATION_ERROR', message: 'The car is booked for those extra days' } });
    }

    const extraDays = Math.ceil((newEndAt.getTime() - booking.endAt.getTime()) / (24 * 60 * 60 * 1000));
    const baseCents = booking.nightlyRateCents * extraDays;
    const protectionCents = Math.round((baseCents * booking.protectionPlan.feeBps) / 10_000);
    const serviceFeeCents = Math.round((baseCents * SERVICE_FEE_BPS) / 10_000);
    const deltaCents = baseCents + protectionCents + serviceFeeCents;

    const order = await paypalGateway.createOrder(deltaCents, 'AUTHORIZE', `${booking.id}-ext`);
    const modification = await prisma.bookingModification.create({
      data: { bookingId: id, newEndAt, deltaCents, status: 'approved' },
    });
    await prisma.payment.create({
      data: { bookingId: id, amountCents: deltaCents, status: 'requires_payment', gatewayRef: order.gatewayRef, kind: 'extension' },
    });
    // Apply the new end and re-arm auto-complete for the later date.
    const updated = await prisma.booking.update({
      where: { id },
      data: { endAt: newEndAt, nights: booking.nights + extraDays, totalCents: booking.totalCents + deltaCents },
    });
    await scheduleAutoComplete(id, newEndAt);

    return reply.code(201).send({ booking: updated, modification, deltaCents, approveUrl: order.approveUrl });
  });

  // 🔑 POST /v1/bookings/:id/review — two-sided blind review
  app.post('/:id/review', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const input = z.object({ rating: z.number().int().min(1).max(5), body: z.string().max(2000).optional() }).parse(request.body);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { vehicle: { include: { host: true } }, reviews: true },
    });
    if (!booking) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Booking not found' } });

    const isGuest = booking.guestId === request.auth!.sub;
    const isHost = booking.vehicle.host.userId === request.auth!.sub;
    if (!isGuest && !isHost) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Booking not found' } });
    }
    if (!['completed', 'reviewed'].includes(booking.status)) {
      return reply.code(409).send({ error: { code: 'VALIDATION_ERROR', message: 'You can review after the trip is complete' } });
    }
    if (booking.reviews.some((r) => r.authorId === request.auth!.sub)) {
      return reply.code(409).send({ error: { code: 'VALIDATION_ERROR', message: 'You already reviewed this trip' } });
    }

    // Guest reviews the vehicle; host reviews the guest.
    const review = await prisma.review.create({
      data: {
        bookingId: id,
        authorId: request.auth!.sub,
        targetKind: isGuest ? 'vehicle' : 'guest',
        rating: input.rating,
        body: input.body,
      },
    });

    // Blind reveal: once both sides have submitted, publish both immediately.
    const total = booking.reviews.length + 1;
    if (total >= 2) {
      await prisma.review.updateMany({ where: { bookingId: id, publishedAt: null }, data: { publishedAt: new Date() } });
      if (booking.status === 'completed') {
        await prisma.booking.update({ where: { id }, data: { status: 'reviewed' } });
      }
    }

    return reply.code(201).send({ review: { ...review, publishedAt: total >= 2 ? new Date() : null } });
  });
}
