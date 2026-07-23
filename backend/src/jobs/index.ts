import { startWorker, jobsEnabled } from './queue.js';
import { processJob } from './bookingJobs.js';

export { scheduleExpiry, scheduleTripLifecycle, scheduleAutoComplete, scheduleReviewReveal } from './bookingJobs.js';
export { jobsEnabled, closeJobs as stopJobWorker } from './queue.js';

/**
 * Boot the job worker. Call once at startup. No-ops without Redis so local
 * dev runs without it (jobs just don't fire; the API is otherwise identical).
 */
export function startJobWorker(log: (msg: string) => void): void {
  if (!jobsEnabled) {
    log('Job worker disabled (no REDIS_URL) — scheduled jobs will not run');
    return;
  }
  const worker = startWorker(processJob);
  worker?.on('failed', (job, err) => log(`Job ${job?.name} failed: ${err.message}`));
  log('Job worker started (expire / payout / auto-complete / review-reveal)');
}
