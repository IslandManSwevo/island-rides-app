import { Queue, Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';

/**
 * BullMQ job system (design/04-backend-architecture.md).
 * Degrades gracefully: with no REDIS_URL (local dev without Redis) the queue
 * is disabled — enqueue calls no-op and the API still boots. Production on
 * Railway always has the Redis plugin, so jobs run there.
 */
export const QUEUE_NAME = 'keylo-jobs';

export type JobName =
  | 'expire-booking' // release the auth hold on an un-answered request
  | 'schedule-payout' // pay the host ~3 days after trip start
  | 'auto-complete-trip' // close a trip 24h after end if no check-out
  | 'reveal-reviews'; // publish blind reviews at 14 days

export interface JobData {
  'expire-booking': { bookingId: string };
  'schedule-payout': { bookingId: string };
  'auto-complete-trip': { bookingId: string };
  'reveal-reviews': { bookingId: string };
}

const connection = env.REDIS_URL
  ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null }) // BullMQ requires null
  : null;

const queue: Queue | null = connection ? new Queue(QUEUE_NAME, { connection }) : null;

export const jobsEnabled = queue !== null;

/** Schedule a job to run after `delayMs` (clamped to >= 0). Silent no-op without Redis. */
export async function enqueue<N extends JobName>(
  name: N,
  data: JobData[N],
  delayMs: number,
  opts?: { jobId?: string }
): Promise<void> {
  if (!queue) return;
  await queue.add(name, data, {
    delay: Math.max(0, Math.round(delayMs)),
    jobId: opts?.jobId, // idempotency: same id won't double-schedule
    removeOnComplete: 1000,
    removeOnFail: 5000,
    attempts: 3,
    backoff: { type: 'exponential', delay: 30_000 },
  });
}

/** Start the worker that processes every job type. Returns null without Redis. */
export function startWorker(
  processor: (job: Job) => Promise<void>
): Worker | null {
  if (!connection) return null;
  return new Worker(QUEUE_NAME, processor, { connection, concurrency: 5 });
}

export async function closeJobs(): Promise<void> {
  await queue?.close();
  await connection?.quit();
}
