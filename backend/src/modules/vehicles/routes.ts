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

  // 🚗 PUT /v1/vehicles/:id/photos — replace the ordered photo set (R2 keys)
  app.put('/:id/photos', { preHandler: [app.requireHost] }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z
      .object({
        photos: z
          .array(z.object({ key: z.string(), kind: z.string().default('exterior') }))
          .min(1)
          .max(20),
      })
      .parse(request.body);

    const host = await prisma.hostProfile.findUnique({ where: { userId: request.auth!.sub } });
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle || !host || vehicle.hostId !== host.id) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
    }

    // Replace the whole set so ordering + primary stay consistent.
    await prisma.vehiclePhoto.deleteMany({ where: { vehicleId: id } });
    await prisma.vehiclePhoto.createMany({
      data: body.photos.map((p, i) => ({
        vehicleId: id,
        key: p.key,
        kind: p.kind,
        position: i,
        isPrimary: i === 0,
      })),
    });
    const photos = await prisma.vehiclePhoto.findMany({ where: { vehicleId: id }, orderBy: { position: 'asc' } });
    return { photos };
  });

  // Shared owner-check helper for the write endpoints below.
  const ownVehicle = async (userId: string, id: string) => {
    const host = await prisma.hostProfile.findUnique({ where: { userId } });
    const vehicle = host ? await prisma.vehicle.findUnique({ where: { id } }) : null;
    return vehicle && host && vehicle.hostId === host.id ? vehicle : null;
  };

  // 🚗 PATCH /v1/vehicles/:id — update listing details (partial)
  app.patch('/:id', { preHandler: [app.requireHost] }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z
      .object({
        description: z.string().max(2000).optional(),
        features: z.array(z.string()).optional(),
        vehicleType: z.string().optional(),
        seats: z.number().int().min(1).max(15).optional(),
        transmission: z.string().optional(),
        fuelType: z.string().optional(),
        color: z.string().optional(),
        dailyRateCents: z.number().int().min(1000).optional(),
        weeklyDiscountBps: z.number().int().min(0).max(9000).optional(),
        monthlyDiscountBps: z.number().int().min(0).max(9000).optional(),
        securityDepositCents: z.number().int().min(0).optional(),
        youngDriverFeeCents: z.number().int().min(0).optional(),
        address: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        deliveryAvailable: z.boolean().optional(),
        deliveryFeeCents: z.number().int().min(0).optional(),
        deliveryRadiusKm: z.number().int().min(0).max(200).optional(),
        airportPickup: z.boolean().optional(),
        airportFeeCents: z.number().int().min(0).optional(),
      })
      .parse(request.body);

    if (!(await ownVehicle(request.auth!.sub, id))) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
    }
    const vehicle = await prisma.vehicle.update({ where: { id }, data: body });
    return { vehicle };
  });

  // 🚗 POST/DELETE /v1/vehicles/:id/extras — host add-ons
  app.post('/:id/extras', { preHandler: [app.requireHost] }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z
      .object({ name: z.string().min(1).max(80), priceCents: z.number().int().min(0), perTrip: z.boolean().default(true) })
      .parse(request.body);
    if (!(await ownVehicle(request.auth!.sub, id))) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
    }
    const extra = await prisma.extra.create({ data: { vehicleId: id, ...body } });
    return reply.code(201).send({ extra });
  });

  app.delete('/:id/extras/:extraId', { preHandler: [app.requireHost] }, async (request, reply) => {
    const { id, extraId } = z.object({ id: z.string(), extraId: z.string() }).parse(request.params);
    if (!(await ownVehicle(request.auth!.sub, id))) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
    }
    await prisma.extra.deleteMany({ where: { id: extraId, vehicleId: id } });
    return { success: true };
  });

  // 🚗 POST /v1/vehicles/:id/documents — registration / insurance / inspection (R2 keys)
  app.post('/:id/documents', { preHandler: [app.requireHost] }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z
      .object({
        kind: z.enum(['registration', 'insurance', 'inspection']),
        key: z.string(),
        expiresAt: z.coerce.date().optional(),
      })
      .parse(request.body);
    if (!(await ownVehicle(request.auth!.sub, id))) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
    }
    const document = await prisma.vehicleDocument.create({ data: { vehicleId: id, ...body } });
    return reply.code(201).send({ document });
  });

  // 🚗 POST /v1/vehicles/:id/submit — publish the listing (auto-list; needs ≥1 photo)
  app.post('/:id/submit', { preHandler: [app.requireHost] }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    if (!(await ownVehicle(request.auth!.sub, id))) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });
    }
    const photoCount = await prisma.vehiclePhoto.count({ where: { vehicleId: id } });
    if (photoCount === 0) {
      return reply.code(409).send({ error: { code: 'VALIDATION_ERROR', message: 'Add at least one photo before publishing' } });
    }
    // No admin reviewer in v1 → auto-verify + list so the car appears in search.
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { verificationStatus: 'verified', listedAt: new Date(), unlistedAt: null },
    });
    return { vehicle };
  });
}
