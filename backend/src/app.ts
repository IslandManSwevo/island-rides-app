import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { env, isProd } from './config/env.js';
import authPlugin from './plugins/auth.js';
import { authRoutes } from './modules/auth/routes.js';
import { userRoutes } from './modules/users/routes.js';
import { islandRoutes, protectionPlanRoutes } from './modules/islands/routes.js';
import { vehicleRoutes } from './modules/vehicles/routes.js';
import { bookingRoutes } from './modules/bookings/routes.js';
import { paymentRoutes } from './modules/payments/routes.js';
import { hostRoutes } from './modules/hosts/routes.js';
import { conversationRoutes } from './modules/conversations/routes.js';
import { uploadRoutes } from './modules/uploads/routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: isProd
      ? true
      : { transport: undefined, level: 'info' },
  });

  await app.register(cors, { origin: env.APP_ORIGIN, credentials: true });
  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
    // Redis store is wired when REDIS_URL is present (multi-instance safety);
    // the in-memory default is fine for a single Railway instance.
  });
  await app.register(authPlugin);

  // Uniform error envelope matching the app's ApiErrorCode union.
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.flatten() },
      });
    }
    request.log.error(error);
    const err = error as { statusCode?: number; message: string };
    const status = typeof err.statusCode === 'number' ? err.statusCode : 500;
    return reply.code(status).send({
      error: { code: status >= 500 ? 'SERVER_ERROR' : 'VALIDATION_ERROR', message: err.message },
    });
  });

  app.get('/health', async () => ({ ok: true, service: 'keylo-api' }));

  await app.register(authRoutes, { prefix: '/v1/auth' });
  await app.register(userRoutes, { prefix: '/v1/users' });
  await app.register(islandRoutes, { prefix: '/v1/islands' });
  await app.register(protectionPlanRoutes, { prefix: '/v1/protection-plans' });
  await app.register(vehicleRoutes, { prefix: '/v1/vehicles' });
  await app.register(bookingRoutes, { prefix: '/v1/bookings' });
  await app.register(paymentRoutes, { prefix: '/v1/payments' });
  await app.register(hostRoutes, { prefix: '/v1/hosts' });
  await app.register(conversationRoutes, { prefix: '/v1/conversations' });
  await app.register(uploadRoutes, { prefix: '/v1/uploads' });

  return app;
}
