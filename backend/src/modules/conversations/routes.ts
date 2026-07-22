import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

export async function conversationRoutes(app: FastifyInstance) {
  // 🔑 inbox list
  app.get('/', { preHandler: [app.requireAuth] }, async (request) => {
    const userId = request.auth!.sub;
    const host = await prisma.hostProfile.findUnique({ where: { userId } });
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ guestId: userId }, ...(host ? [{ hostId: host.id }] : [])] },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    return { conversations };
  });

  // 🔑 message history (REST fallback; live delivery via Socket.IO /chat)
  app.get('/:id/messages', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
    }
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
    return { messages };
  });

  // 🔑 send (also emitted on the socket namespace by the realtime layer)
  app.post('/:id/messages', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({ body: z.string().min(1).max(4000) }).parse(request.body);
    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) {
      return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
    }
    const message = await prisma.message.create({
      data: { conversationId: id, senderId: request.auth!.sub, body: body.body },
    });
    return reply.code(201).send({ message });
  });
}
