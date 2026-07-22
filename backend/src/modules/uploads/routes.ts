import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { env } from '../../config/env.js';

const KINDS = ['vehicle_photo', 'document', 'avatar', 'checkin_photo', 'banner'] as const;

/**
 * Presigned R2 uploads (design/05-api-spec.md): the API hands out a presigned
 * PUT URL and the final key; file bytes never transit the API.
 *
 * Scaffold note: real presigning needs @aws-sdk/client-s3 +
 * @aws-sdk/s3-request-presigner against the R2 endpoint. Until R2 creds are
 * configured this returns 501 so the client contract is visible and typed.
 */
export async function uploadRoutes(app: FastifyInstance) {
  app.post('/presign', { preHandler: [app.requireAuth] }, async (request, reply) => {
    const body = z
      .object({ kind: z.enum(KINDS), contentType: z.string().regex(/^(image|application)\//) })
      .parse(request.body);

    const key = `${body.kind}/${request.auth!.sub}/${Date.now()}-${randomBytes(8).toString('hex')}`;

    if (!env.R2_BUCKET || !env.R2_ACCESS_KEY_ID) {
      return reply.code(501).send({
        error: { code: 'SERVER_ERROR', message: 'Object storage not configured (R2_* env vars)' },
        key,
      });
    }

    // TODO(R2): return presigned PUT URL for `key` with body.contentType
    return reply.code(501).send({
      error: { code: 'SERVER_ERROR', message: 'Presigning not yet implemented' },
      key,
    });
  });
}
