import { buildApp } from './app.js';
import { env } from './config/env.js';

const app = await buildApp();

try {
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  app.log.info(`KeyLo API listening on :${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
