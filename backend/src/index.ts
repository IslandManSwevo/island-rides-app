import { buildApp } from './app.js';
import { env } from './config/env.js';
import { startJobWorker, stopJobWorker } from './jobs/index.js';
import { attachSocket } from './realtime/socket.js';

const app = await buildApp();

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  app.log.info(`KeyLo API listening on :${env.PORT}`);
  startJobWorker((msg) => app.log.info(msg));
  attachSocket(app.server, (msg) => app.log.info(msg));
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, async () => {
    app.log.info(`${signal} received — shutting down`);
    await stopJobWorker();
    await app.close();
    process.exit(0);
  });
}
