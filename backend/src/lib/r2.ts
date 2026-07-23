import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';

/**
 * Cloudflare R2 (S3-compatible) object storage — design/04-backend-architecture.md.
 * Uploads go client → R2 via presigned PUT URLs, so file bytes never transit
 * the API. Reads use a public bucket URL when configured (R2_PUBLIC_BASE),
 * otherwise a short-lived presigned GET.
 */
export const r2Configured =
  !!(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET);

const client = r2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

/** Presigned PUT URL for a client to upload `key` directly to R2 (5-min TTL). */
export async function presignPut(key: string, contentType: string): Promise<string> {
  if (!client) throw new Error('R2 not configured');
  return getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, ContentType: contentType }),
    { expiresIn: 300 }
  );
}

/** Public (or presigned) URL to read `key`. */
export async function resolveUrl(key: string): Promise<string> {
  if (env.R2_PUBLIC_BASE) return `${env.R2_PUBLIC_BASE.replace(/\/$/, '')}/${key}`;
  if (!client) return '';
  return getSignedUrl(client, new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: key }), { expiresIn: 3600 });
}
