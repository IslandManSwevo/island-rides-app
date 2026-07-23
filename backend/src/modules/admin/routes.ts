import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { resolveUrl } from '../../lib/r2.js';
import { sendToUser } from '../../lib/push.js';

/**
 * Admin insurance vetting (design/02 — enforced insurance, human-reviewed).
 * A person with an admin account works this queue: they open each uploaded
 * insurance document and approve or reject it. A car only goes live once its
 * insurance is approved — this is the check that a fake/absent doc can't slip
 * a listing into search. 🛡 admin only.
 */
export async function adminRoutes(app: FastifyInstance) {
  // 🛡 GET /v1/admin/verifications — vehicles awaiting insurance review
  app.get('/verifications', { preHandler: [app.requireAdmin] }, async () => {
    const vehicles = await prisma.vehicle.findMany({
      where: { verificationStatus: 'pending' },
      include: {
        host: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        documents: { where: { kind: 'insurance' }, orderBy: { id: 'desc' } },
        photos: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { updatedAt: 'asc' },
    });

    // Presign the insurance doc so the reviewer can actually open and inspect it.
    const queue = await Promise.all(
      vehicles.map(async (v) => {
        const doc = v.documents[0];
        return {
          vehicleId: v.id,
          make: v.make,
          model: v.model,
          year: v.year,
          hostName: `${v.host.user.firstName} ${v.host.user.lastName}`,
          hostEmail: v.host.user.email,
          submittedAt: v.updatedAt,
          insurance: doc
            ? { id: doc.id, status: doc.status, expiresAt: doc.expiresAt, url: await resolveUrl(doc.key) }
            : null,
        };
      })
    );
    return { queue };
  });

  // 🛡 POST /v1/admin/vehicles/:id/insurance — approve or reject
  app.post('/vehicles/:id/insurance', { preHandler: [app.requireAdmin] }, async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const { decision, note } = z
      .object({ decision: z.enum(['approve', 'reject']), note: z.string().max(500).optional() })
      .parse(request.body);

    const vehicle = await prisma.vehicle.findUnique({ where: { id }, include: { host: true } });
    if (!vehicle) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } });

    if (decision === 'approve') {
      await prisma.vehicleDocument.updateMany({
        where: { vehicleId: id, kind: 'insurance' },
        data: { status: 'verified' },
      });
      await prisma.vehicle.update({
        where: { id },
        data: { verificationStatus: 'verified', listedAt: new Date(), unlistedAt: null },
      });
      await sendToUser(vehicle.host.userId, {
        title: 'Your car is approved 🎉',
        body: `${vehicle.make} ${vehicle.model} is live on KeyLo.`,
        data: { vehicleId: id },
      });
      return { vehicle: { id, verificationStatus: 'verified' } };
    }

    // Reject: keep the car unlisted, mark the doc rejected, tell the host why.
    await prisma.vehicleDocument.updateMany({
      where: { vehicleId: id, kind: 'insurance' },
      data: { status: 'rejected' },
    });
    await prisma.vehicle.update({ where: { id }, data: { verificationStatus: 'rejected' } });
    await sendToUser(vehicle.host.userId, {
      title: 'Insurance needs another look',
      body: note?.trim() || 'Please re-upload a clear, valid proof of insurance.',
      data: { vehicleId: id },
    });
    return { vehicle: { id, verificationStatus: 'rejected' }, note };
  });
}
