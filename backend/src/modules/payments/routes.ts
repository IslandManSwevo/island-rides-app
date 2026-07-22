import type { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { paypalGateway } from './paypal.js';

/**
 * PayPal webhooks are the source of truth for payment state
 * (design/04-backend-architecture.md).
 */
export async function paymentRoutes(app: FastifyInstance) {
  app.post('/webhook', async (request, reply) => {
    const verified = await paypalGateway
      .verifyWebhookSignature(request.headers, request.body)
      .catch(() => false);
    if (!verified) {
      return reply.code(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid webhook signature' } });
    }

    const event = request.body as { event_type: string; resource?: { supplementary_data?: { related_ids?: { order_id?: string } }; id?: string } };
    const orderId = event.resource?.supplementary_data?.related_ids?.order_id ?? event.resource?.id;
    if (!orderId) return { received: true };

    const payment = await prisma.payment.findUnique({ where: { gatewayRef: orderId } });
    if (!payment) return { received: true };

    switch (event.event_type) {
      case 'PAYMENT.AUTHORIZATION.CREATED':
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'authorized' } });
        break;
      case 'PAYMENT.CAPTURE.COMPLETED':
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'captured' } });
        break;
      case 'PAYMENT.CAPTURE.REFUNDED':
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'refunded' } });
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'failed' } });
        break;
      default:
        break;
    }
    return { received: true };
  });

  // 🔑 receipt history
  app.get('/', { preHandler: [app.requireAuth] }, async (request) => {
    const payments = await prisma.payment.findMany({
      where: { booking: { guestId: request.auth!.sub } },
      include: { booking: { include: { vehicle: { select: { make: true, model: true, year: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return { payments };
  });
}
