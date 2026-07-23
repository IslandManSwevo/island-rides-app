import type { Server as HttpServer } from 'node:http';
import { Server as SocketServer, type Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { sendToUser } from '../lib/push.js';
import type { AccessTokenPayload } from '../plugins/auth.js';

/**
 * Realtime chat (design/04-backend-architecture.md). Socket.IO attached to the
 * Fastify HTTP server. JWT auth on the handshake; clients join per-conversation
 * rooms they're a participant of; messages persist to the DB and broadcast live.
 * With Redis present a pub/sub adapter is attached so multiple API instances
 * share rooms — without it, a single instance still works.
 */

interface SocketUser {
  userId: string;
  hostId: string | null;
}

const room = (conversationId: string) => `conversation:${conversationId}`;

async function isParticipant(user: SocketUser, conversationId: string): Promise<boolean> {
  const convo = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!convo) return false;
  return convo.guestId === user.userId || (user.hostId !== null && convo.hostId === user.hostId);
}

export function attachSocket(httpServer: HttpServer, log: (msg: string) => void): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: { origin: env.APP_ORIGIN, credentials: true },
    path: '/socket.io',
  });

  if (env.REDIS_URL) {
    const pub = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
    const sub = pub.duplicate();
    io.adapter(createAdapter(pub, sub));
    log('Socket.IO Redis adapter attached (multi-instance ready)');
  }

  // Handshake auth: client passes { auth: { token } }.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) return next(new Error('unauthorized'));
      const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
      const host = await prisma.hostProfile.findUnique({ where: { userId: payload.sub }, select: { id: true } });
      (socket.data as SocketUser) = { userId: payload.sub, hostId: host?.id ?? null };
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data as SocketUser;

    socket.on('conversation:join', async (conversationId: string) => {
      if (await isParticipant(user, conversationId)) socket.join(room(conversationId));
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(room(conversationId));
    });

    socket.on('message:send', async (payload: { conversationId: string; body: string }, ack?: (res: unknown) => void) => {
      try {
        const body = String(payload?.body ?? '').trim();
        if (!body || body.length > 4000) return ack?.({ error: 'invalid message' });
        if (!(await isParticipant(user, payload.conversationId))) return ack?.({ error: 'forbidden' });

        const message = await prisma.message.create({
          data: { conversationId: payload.conversationId, senderId: user.userId, body },
        });
        // Broadcast to everyone in the room, including the sender (single source of truth).
        io.to(room(payload.conversationId)).emit('message:new', message);
        ack?.({ ok: true, message });

        // Push the other participant (resolve the host's user id from their profile).
        const convo = await prisma.conversation.findUnique({ where: { id: payload.conversationId } });
        if (convo) {
          const hostUser = await prisma.hostProfile.findUnique({ where: { id: convo.hostId }, select: { userId: true } });
          const recipient = convo.guestId === user.userId ? hostUser?.userId : convo.guestId;
          if (recipient && recipient !== user.userId) {
            await sendToUser(recipient, { title: 'New message', body, data: { conversationId: convo.id } });
          }
        }
      } catch {
        ack?.({ error: 'send failed' });
      }
    });

    socket.on('typing', (conversationId: string) => {
      socket.to(room(conversationId)).emit('typing', { conversationId, userId: user.userId });
    });

    socket.on('message:read', async (conversationId: string) => {
      if (!(await isParticipant(user, conversationId))) return;
      await prisma.message.updateMany({
        where: { conversationId, senderId: { not: user.userId }, readAt: null },
        data: { readAt: new Date() },
      });
      socket.to(room(conversationId)).emit('message:read', { conversationId, by: user.userId });
    });
  });

  log('Socket.IO realtime chat attached at /socket.io');
  return io;
}
