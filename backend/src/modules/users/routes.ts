import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

export async function userRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: [app.requireAuth] }, async (request) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: request.auth!.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phoneNumber: true,
        avatarKey: true,
        preferredIslandId: true,
        verificationStatus: true,
        createdAt: true,
      },
    });
    return { user };
  });

  app.patch('/me', { preHandler: [app.requireAuth] }, async (request) => {
    const body = z
      .object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        phoneNumber: z.string().optional(),
        avatarKey: z.string().optional(),
        preferredIslandId: z.string().optional(),
      })
      .parse(request.body);
    const user = await prisma.user.update({ where: { id: request.auth!.sub }, data: body });
    return { user: { id: user.id, firstName: user.firstName, lastName: user.lastName } };
  });

  // Favorites
  app.get('/me/favorites', { preHandler: [app.requireAuth] }, async (request) => {
    const favorites = await prisma.favorite.findMany({ where: { userId: request.auth!.sub } });
    return { vehicleIds: favorites.map((f) => f.vehicleId) };
  });

  app.put('/me/favorites/:vehicleId', { preHandler: [app.requireAuth] }, async (request) => {
    const { vehicleId } = z.object({ vehicleId: z.string() }).parse(request.params);
    await prisma.favorite.upsert({
      where: { userId_vehicleId: { userId: request.auth!.sub, vehicleId } },
      update: {},
      create: { userId: request.auth!.sub, vehicleId },
    });
    return { success: true };
  });

  app.delete('/me/favorites/:vehicleId', { preHandler: [app.requireAuth] }, async (request) => {
    const { vehicleId } = z.object({ vehicleId: z.string() }).parse(request.params);
    await prisma.favorite.deleteMany({ where: { userId: request.auth!.sub, vehicleId } });
    return { success: true };
  });

  // Push tokens
  app.post('/me/push-tokens', { preHandler: [app.requireAuth] }, async (request) => {
    const body = z
      .object({ token: z.string(), platform: z.enum(['ios', 'android', 'web']) })
      .parse(request.body);
    await prisma.pushToken.upsert({
      where: { token: body.token },
      update: { userId: request.auth!.sub, platform: body.platform },
      create: { userId: request.auth!.sub, ...body },
    });
    return { success: true };
  });

  // Verification: license + selfie keys (R2) + date of birth, reviewed by admin.
  // The Bahamas requires renters to be 21+ — dateOfBirth is what booking checks.
  app.post('/me/verification', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const body = z
      .object({ licenseKey: z.string(), selfieKey: z.string(), dateOfBirth: z.coerce.date() })
      .parse(request.body);

    const MIN_RENTAL_AGE = 21;
    const ageYears = (Date.now() - body.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (ageYears < MIN_RENTAL_AGE) {
      return reply.code(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'You must be 21 or older to rent a vehicle in the Bahamas.' },
      });
    }

    await prisma.user.update({
      where: { id: request.auth!.sub },
      data: { ...body, verificationStatus: 'pending' },
    });
    return { status: 'pending' };
  });
}
