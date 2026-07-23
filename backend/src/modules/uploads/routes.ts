import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { presignPut, resolveUrl, r2Configured } from '../../lib/r2.js';

const KINDS = ['vehicle_photo', 'document', 'avatar', 'checkin_photo', 'banner'] as const;

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
};

/**
 * Presigned R2 uploads (design/05-api-spec.md): the API hands out a presigned
 * PUT URL and the final key; file bytes never transit the API. The client PUTs
 * the bytes straight to R2, then sends the key back on the relevant resource.
 */
export async function uploadRoutes(app: FastifyInstance) {
  app.post('/presign', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const body = z
      .object({ kind: z.enum(KINDS), contentType: z.string().regex(/^(image|application)\//) })
      .parse(request.body);

    const ext = EXT[body.contentType] ?? 'bin';
    const key = `${body.kind}/${request.auth!.sub}/${Date.now()}-${randomBytes(8).toString('hex')}.${ext}`;

    if (!r2Configured) {
      return reply.code(501).send({
        error: { code: 'SERVER_ERROR', message: 'Object storage not configured (R2_* env vars)' },
        key,
      });
    }

    const uploadUrl = await presignPut(key, body.contentType);
    const publicUrl = await resolveUrl(key);
    return { key, uploadUrl, publicUrl };
  });
}
