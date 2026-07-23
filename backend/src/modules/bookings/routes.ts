import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { quote } from './pricing.js';
import { assertTransition, IllegalTransitionError } from './stateMachine.js';
import { paypalGateway } from '../payments/paypal.js';
import { scheduleExpiry, scheduleTripLifecycle } from '../../jobs/index.js';

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
}
