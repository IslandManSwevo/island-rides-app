import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

export async function conversationRoutes(app: FastifyInstance) {
  // 🔑 inbox list — flat summaries, not raw rows. Each row in the Inbox
  // (design/mockups/12-inbox.html) needs a counterparty name, a preview, an
  // unread flag, and the booking-scoped badge ("Toyota RAV4 · Aug 7–10").
  app.get('/', { preHandler: [app.requireAuth] }, async (request) => {
    const userId = request.auth!.sub;
    const host = await prisma.hostProfile.findUnique({ where: { userId } });

    const rows = await prisma.conversation.findMany({
      where: { OR: [{ guestId: userId }, ...(host ? [{ hostId: host.id }] : [])] },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: { firstName: true } } } },
        booking: { include: { vehicle: { select: { make: true, model: true, year: true } } } },
        _count: { select: { messages: { where: { readAt: null, senderId: { not: userId } } } } },
      },
    });

    // The counterparty is whichever side the viewer isn't. hostId points at a
    // HostProfile, not a User, so the host side needs a second lookup.
    const guestIds = rows.map((r) => r.guestId);
    const hostIds = rows.map((r) => r.hostId);
    const [guests, hosts] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: guestIds } },
        select: { id: true, firstName: true, lastName: true, avatarKey: true },
      }),
      prisma.hostProfile.findMany({
        where: { id: { in: hostIds } },
        select: {
          id: true,
          displayName: true,
          user: { select: { firstName: true, lastName: true, avatarKey: true } },
        },
      }),
    ]);
    const guestById = new Map(guests.map((g) => [g.id, g]));
    const hostById = new Map(hosts.map((h) => [h.id, h]));

    const conversations = rows
      .map((row) => {
        const viewerIsGuest = row.guestId === userId;
        const guest = guestById.get(row.guestId);
        const hostProfile = hostById.get(row.hostId);
        const counterparty = viewerIsGuest
          ? {
              name:
                hostProfile?.displayName ??
                [hostProfile?.user.firstName, hostProfile?.user.lastName].filter(Boolean).join(' '),
              avatarKey: hostProfile?.user.avatarKey ?? null,
            }
          : {
              name: [guest?.firstName, guest?.lastName].filter(Boolean).join(' '),
              avatarKey: guest?.avatarKey ?? null,
            };

        const last = row.messages[0];
        return {
          id: row.id,
          bookingId: row.bookingId,
          vehicleId: row.vehicleId,
          counterparty: { name: counterparty.name || 'KeyLo', avatarKey: counterparty.avatarKey },
          lastMessage: last ? { body: last.body, createdAt: last.createdAt, mine: last.senderId === userId } : null,
          unreadCount: row._count.messages,
          booking: row.booking
            ? {
                id: row.booking.id,
                status: row.booking.status,
                startAt: row.booking.startAt,
                endAt: row.booking.endAt,
                vehicleLabel: `${row.booking.vehicle.make} ${row.booking.vehicle.model}`,
              }
            : null,
        };
      })
      // Most recent conversation first; ones with no messages sink to the bottom.
      .sort((a, b) => (b.lastMessage?.createdAt.getTime() ?? 0) - (a.lastMessage?.createdAt.getTime() ?? 0));

    return { conversations };
  });

  // 🔑 mark a thread read — drives the unread dot on the Inbox row
  app.post('/:id/read', { preHandler: [app.requireAuth] }, async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const userId = request.auth!.sub;
    const { count } = await prisma.message.updateMany({
      where: { conversationId: id, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
    return { marked: count };
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
