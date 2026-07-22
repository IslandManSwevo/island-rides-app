import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const searchSchema = z.object({
  island: z.string().optional(),
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
  type: z.string().optional(),
  seats: z.coerce.number().int().optional(),
  priceMinCents: z.coerce.number().int().optional(),
  priceMaxCents: z.coerce.number().int().optional(),
  instantBook: z.coerce.boolean().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function vehicleRoutes(app: FastifyInstance) {
  // 🌐 GET /v1/vehicles — search; only verified, listed, date-available vehicles
  app.get('/', async (request) => {
    const q = searchSchema.parse(request.query);

    const vehicles = await prisma.vehicle.findMany({
      where: {
        verificationStatus: 'verified',
        listedAt: { not: null },
        unlistedAt: null,
        ...(q.island ? { islandId: q.island } : {}),
        ...(q.type ? { vehicleType: q.type } : {}),
        ...(q.seats ? { seats: { gte: q.seats } } : {}),
        ...(q.instantBook !== undefined ? { instantBook: q.instantBook } : {}),
        ...(q.priceMinCents || q.priceMaxCents
          ? { dailyRateCents: { gte: q.priceMinCents ?? 0, lte: q.priceMaxCents ?? 100_000_00 } }
          : {}),
        // Date availability: no overlapping confirmed/active booking, no block.
        ...(q.start && q.end
          ? {
              bookings: {
                none: {
                  status: { in: ['confirmed', 'active'] },
                  startAt: { lt: q.end },
                  endAt: { gt: q.start },
                },
              },
              availability: {
                none: {
                  kind: 'blocked',
                  startDate: { lt: q.end },
                  endDate: { gt: q.start },
                },
              },
            }
          : {}),
      },
      include: {
        photos: { where: { isPrimary: true }, take: 1 },
        host: { select: { id: true, displayName: true, handle: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
    });

    const nextCursor = vehicles.length > q.limit ? vehicles.pop()!.id : null;
    return { vehicles, nextCursor };
  });

  // 🌐 GET /v1/vehicles/:id — full detail
  app.get('/:id', async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { position: 'asc' } },
        extras: { where: { active: true } },
        host: {
          select: {
            id: true,
            displayName: true,
            handle: true,
            bio: true,
            responseTimeMins: true,
            user: { select: { firstName: true, avatarKey: true, createdAt: true } },
          },
        },
      },
    });
    if (!vehicle) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
    }
    return { vehicle };
  });

  // 🚗 POST /v1/vehicles — create listing (wizard step 1)
  app.post('/', { preHandler: [app.requireHost] }, async (request, reply) => {
    const body = z
      .object({
        islandId: z.string(),
        make: z.string().min(1),
        model: z.string().min(1),
        year: z.number().int().min(1990),
        vehicleType: z.string(),
        driveSide: z.enum(['LHD', 'RHD']),
        seats: z.number().int().min(1).max(15),
        dailyRateCents: z.number().int().min(1000),
        description: z.string().optional(),
      })
      .parse(request.body);

    const host = await prisma.hostProfile.findUnique({ where: { userId: request.auth!.sub } });
    if (!host) {
      return reply.code(403).send({ error: { code: 'UNAUTHORIZED', message: 'Host profile required' } });
    }
    const vehicle = await prisma.vehicle.create({ data: { ...body, hostId: host.id } });
    return reply.code(201).send({ vehicle });
  });

  // 🚗 PUT /v1/vehicles/:id/settings — Instant Book, notice, trip length
  app.put('/:id/settings', { preHandler: [app.requireHost] }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z
      .object({
        instantBook: z.boolean().optional(),
        advanceNoticeHrs: z.number().int().min(0).max(72).optional(),
        minTripDays: z.number().int().min(1).optional(),
        maxTripDays: z.number().int().max(90).optional(),
        approvalWindowHrs: z.number().int().min(8).max(24).optional(),
      })
      .parse(request.body);

    const host = await prisma.hostProfile.findUnique({ where: { userId: request.auth!.sub } });
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle || !host || vehicle.hostId !== host.id) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
    }
    const updated = await prisma.vehicle.update({ where: { id }, data: body });
    return { vehicle: updated };
  });
}
