import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  sub: string;
  role: 'user' | 'host' | 'admin';
}

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AccessTokenPayload;
  }
  interface FastifyInstance {
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireHost: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

/**
 * Bearer-token auth. Routes opt in via preHandler:
 *   { preHandler: [app.requireAuth] }        // 🔑 any signed-in user
 *   { preHandler: [app.requireHost] }        // 🚗 host (or admin)
 *   { preHandler: [app.requireAdmin] }       // 🛡 admin only
 * Public routes (🌐) attach nothing; request.auth stays undefined.
 */
export default fp(async (app) => {
  const verify = async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' } });
    }
    try {
      request.auth = jwt.verify(header.slice(7), env.JWT_SECRET) as AccessTokenPayload;
    } catch {
      return reply.code(401).send({ error: { code: 'TOKEN_EXPIRED', message: 'Invalid or expired token' } });
    }
  };

  app.decorate('requireAuth', verify);

  app.decorate('requireHost', async (request: FastifyRequest, reply: FastifyReply) => {
    await verify(request, reply);
    if (reply.sent) return;
    if (request.auth!.role !== 'host' && request.auth!.role !== 'admin') {
      return reply.code(403).send({ error: { code: 'UNAUTHORIZED', message: 'Host account required' } });
    }
  });

  app.decorate('requireAdmin', async (request: FastifyRequest, reply: FastifyReply) => {
    await verify(request, reply);
    if (reply.sent) return;
    if (request.auth!.role !== 'admin') {
      return reply.code(403).send({ error: { code: 'UNAUTHORIZED', message: 'Admin required' } });
    }
  });
});
