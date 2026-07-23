import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const HANDLE_RE = /^[a-z0-9][a-z0-9-]{2,29}$/;

export async function hostRoutes(app: FastifyInstance) {
  // 🔑 POST /v1/hosts — become a host
  app.post('/', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const body = z
      .object({ displayName: z.string().min(1), bio: z.string().optional(), paypalPayerEmail: z.string().email().optional() })
      .parse(request.body);
    const existing = await prisma.hostProfile.findUnique({ where: { userId: request.auth!.sub } });
    if (existing) {
      return reply.code(409).send({ error: { code: 'VALIDATION_ERROR', message: 'Already a host' } });
    }
    const profile = await prisma.hostProfile.create({ data: { userId: request.auth!.sub, ...body } });
    await prisma.user.update({ where: { id: request.auth!.sub }, data: { role: 'host' } });
    return reply.code(201).send({ hostProfile: profile });
  });

  // 🌐 GET /v1/hosts/@:handle — public storefront (old handles redirect)
  app.get('/@:handle', async (request, reply) => {
    const { handle } = z.object({ handle: z.string() }).parse(request.params);
    let host = await prisma.hostProfile.findUnique({ where: { handle } });
    if (!host) {
      const redirect = await prisma.handleRedirect.findUnique({ where: { oldHandle: handle } });
      if (redirect) host = await prisma.hostProfile.findUnique({ where: { id: redirect.hostId } });
    }
    if (!host || host.suspendedAt) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Storefront not found' } });
    }

    const source = z.object({ source: z.string().optional() }).parse(request.query).source;
    await prisma.storefrontVisit.create({ data: { hostId: host.id, source } });

    const vehicles = await prisma.vehicle.findMany({
      where: { hostId: host.id, verificationStatus: 'verified', listedAt: { not: null }, unlistedAt: null },
      include: { photos: { where: { isPrimary: true }, take: 1 } },
    });
    // Fleet display order is host-curated.
    const order = new Map(host.fleetOrder.map((id, i) => [id, i]));
    vehicles.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));

    return {
      storefront: {
        handle: host.handle,
        displayName: host.displayName,
        tagline: host.tagline,
        bannerKey: host.bannerKey,
        bio: host.bio,
        responseTimeMins: host.responseTimeMins,
        vehicles,
      },
    };
  });

  // 🚗 GET/PATCH /v1/hosts/me/storefront — editor
  app.get('/me/storefront', { preHandler: [app.requireHost] }, async (request, reply) => {
    const host = await prisma.hostProfile.findUnique({ where: { userId: request.auth!.sub } });
    if (!host) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'No host profile' } });
    return { storefront: host };
  });

  app.patch('/me/storefront', { preHandler: [app.requireHost] }, async (request, reply) => {
    const body = z
      .object({
        handle: z.string().regex(HANDLE_RE, 'Lowercase letters, numbers, hyphens; 3-30 chars').optional(),
        displayName: z.string().min(1).optional(),
        tagline: z.string().max(140).optional(),
        bannerKey: z.string().optional(),
        featuredVehicleId: z.string().optional(),
        fleetOrder: z.array(z.string()).optional(),
        bio: z.string().max(1000).optional(),
      })
      .parse(request.body);

    const host = await prisma.hostProfile.findUnique({ where: { userId: request.auth!.sub } });
    if (!host) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'No host profile' } });

    if (body.handle && body.handle !== host.handle) {
      const taken = await prisma.hostProfile.findUnique({ where: { handle: body.handle } });
      if (taken) return reply.code(409).send({ error: { code: 'VALIDATION_ERROR', message: 'Handle taken' } });
      if (host.handle) {
        await prisma.handleRedirect.upsert({
          where: { oldHandle: host.handle },
          update: { hostId: host.id },
          create: { oldHandle: host.handle, hostId: host.id },
        });
      }
    }

    const updated = await prisma.hostProfile.update({ where: { id: host.id }, data: body });
    return { storefront: updated };
  });

  // 🚗 GET /v1/hosts/me/dashboard — the Today feed (mockup 06)
  app.get('/me/dashboard', { preHandler: [app.requireHost] }, async (request, reply) => {
    const host = await prisma.hostProfile.findUnique({ where: { userId: request.auth!.sub } });
    if (!host) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'No host profile' } });

    const now = new Date();
    const dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now); dayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const guestSelect = { select: { firstName: true, lastName: true, verificationStatus: true } };
    const vehicleFilter = { hostId: host.id };

    const [pendingRequests, todayPickups, todayReturns, monthBookings, activeCount, vehicleCount] =
      await Promise.all([
        prisma.booking.findMany({
          where: { vehicle: vehicleFilter, status: 'pending' },
          include: { guest: guestSelect, vehicle: { select: { make: true, model: true } } },
          orderBy: { approvalDeadline: 'asc' },
        }),
        prisma.booking.findMany({
          where: { vehicle: vehicleFilter, status: 'confirmed', startAt: { gte: dayStart, lte: dayEnd } },
          include: { guest: guestSelect, vehicle: { select: { make: true, model: true } } },
          orderBy: { startAt: 'asc' },
        }),
        prisma.booking.findMany({
          where: { vehicle: vehicleFilter, status: 'active', endAt: { gte: dayStart, lte: dayEnd } },
          include: { guest: guestSelect, vehicle: { select: { make: true, model: true } } },
          orderBy: { endAt: 'asc' },
        }),
        prisma.booking.aggregate({
          where: {
            vehicle: vehicleFilter,
            status: { in: ['confirmed', 'active', 'completed', 'reviewed'] },
            startAt: { gte: monthStart },
          },
          _sum: { hostEarningsCents: true },
        }),
        prisma.booking.count({ where: { vehicle: vehicleFilter, status: 'active' } }),
        prisma.vehicle.count({ where: { ...vehicleFilter, unlistedAt: null } }),
      ]);

    return {
      dashboard: {
        pendingRequests,
        todayPickups,
        todayReturns,
        monthEarningsCents: monthBookings._sum.hostEarningsCents ?? 0,
        activeTrips: activeCount,
        fleetSize: vehicleCount,
      },
    };
  });

  // 🚗 GET /v1/hosts/me/vehicles — Fleet tab
  app.get('/me/vehicles', { preHandler: [app.requireHost] }, async (request, reply) => {
    const host = await prisma.hostProfile.findUnique({ where: { userId: request.auth!.sub } });
    if (!host) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'No host profile' } });
    const vehicles = await prisma.vehicle.findMany({
      where: { hostId: host.id },
      include: {
        photos: { where: { isPrimary: true }, take: 1 },
        _count: { select: { bookings: { where: { status: { in: ['confirmed', 'active'] } } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { vehicles };
  });

  // 🚗 GET /v1/hosts/me/reviews — published reviews across the host's cars
  app.get('/me/reviews', { preHandler: [app.requireHost] }, async (request, reply) => {
    const host = await prisma.hostProfile.findUnique({ where: { userId: request.auth!.sub } });
    if (!host) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'No host profile' } });
    const reviews = await prisma.review.findMany({
      where: { targetKind: 'vehicle', publishedAt: { not: null }, booking: { vehicle: { hostId: host.id } } },
      include: {
        author: { select: { firstName: true } },
        booking: { select: { vehicle: { select: { make: true, model: true } } } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });
    const count = reviews.length;
    const average = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : null;
    return {
      average,
      count,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        body: r.body,
        authorName: r.author.firstName,
        vehicle: `${r.booking.vehicle.make} ${r.booking.vehicle.model}`,
        publishedAt: r.publishedAt,
      })),
    };
  });

  // 🚗 GET /v1/hosts/me/earnings — Earnings tab
  app.get('/me/earnings', { preHandler: [app.requireHost] }, async (request, reply) => {
    const host = await prisma.hostProfile.findUnique({ where: { userId: request.auth!.sub } });
    if (!host) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'No host profile' } });

    const [byVehicle, payouts] = await Promise.all([
      prisma.booking.groupBy({
        by: ['vehicleId'],
        where: { vehicle: { hostId: host.id }, status: { in: ['completed', 'reviewed', 'active', 'confirmed'] } },
        _sum: { hostEarningsCents: true },
        _count: true,
      }),
      prisma.payout.findMany({ where: { hostId: host.id }, orderBy: { scheduledFor: 'desc' }, take: 20 }),
    ]);

    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: byVehicle.map((v) => v.vehicleId) } },
      select: { id: true, make: true, model: true, year: true },
    });
    const vehicleName = new Map(vehicles.map((v) => [v.id, `${v.make} ${v.model} ${v.year}`]));

    return {
      earnings: {
        perVehicle: byVehicle.map((v) => ({
          vehicleId: v.vehicleId,
          name: vehicleName.get(v.vehicleId) ?? 'Vehicle',
          trips: v._count,
          earningsCents: v._sum.hostEarningsCents ?? 0,
        })),
        payouts,
        splitBps: host.earningsSplitBps,
        payoutEnabled: host.payoutEnabled,
      },
    };
  });

  // 🚗 storefront stats: share attribution
  app.get('/me/storefront/stats', { preHandler: [app.requireHost] }, async (request, reply) => {
    const host = await prisma.hostProfile.findUnique({ where: { userId: request.auth!.sub } });
    if (!host) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'No host profile' } });
    const visits = await prisma.storefrontVisit.groupBy({
      by: ['source'],
      where: { hostId: host.id },
      _count: true,
    });
    return { visits };
  });
}
