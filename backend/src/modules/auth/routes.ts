import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';

const ACCESS_TTL = '15m';
const REFRESH_TTL_DAYS = 30;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = credentialsSchema.extend({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

async function issueTokens(user: { id: string; role: string }) {
  const accessToken = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: ACCESS_TTL });
  const refreshToken = randomBytes(48).toString('base64url');
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return { accessToken, refreshToken };
}

const publicUser = (u: { id: string; email: string; firstName: string; lastName: string; role: string; verificationStatus: string }) => ({
  id: u.id,
  email: u.email,
  firstName: u.firstName,
  lastName: u.lastName,
  role: u.role,
  verificationStatus: u.verificationStatus,
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) {
      return reply.code(409).send({ error: { code: 'VALIDATION_ERROR', message: 'Email already registered' } });
    }
    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash: await argon2.hash(body.password, { type: argon2.argon2id }),
        firstName: body.firstName,
        lastName: body.lastName,
      },
    });
    const tokens = await issueTokens(user);
    return reply.code(201).send({ user: publicUser(user), ...tokens });
  });

  app.post('/login', async (request, reply) => {
    const body = credentialsSchema.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user || user.deletedAt) {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } });
    }
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      return reply.code(423).send({ error: { code: 'RATE_LIMITED', message: 'Account temporarily locked' } });
    }
    if (!(await argon2.verify(user.passwordHash, body.password))) {
      const failed = user.failedLoginAttempts + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failed,
          lockoutUntil:
            failed >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null,
        },
      });
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockoutUntil: null },
    });
    const tokens = await issueTokens(user);
    return { user: publicUser(user), ...tokens };
  });

  app.post('/refresh', async (request, reply) => {
    const body = z.object({ refreshToken: z.string() }).parse(request.body);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(body.refreshToken) } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      return reply.code(401).send({ error: { code: 'TOKEN_EXPIRED', message: 'Refresh token invalid' } });
    }
    // Rotation: single use — revoke the presented token, issue a new pair.
    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: stored.userId } });
    const tokens = await issueTokens(user);
    return { user: publicUser(user), ...tokens };
  });

  app.post('/logout', { preHandler: [app.requireAuth] }, async (request) => {
    const body = z.object({ refreshToken: z.string().optional() }).parse(request.body ?? {});
    if (body.refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(body.refreshToken), userId: request.auth!.sub },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true };
  });
}
