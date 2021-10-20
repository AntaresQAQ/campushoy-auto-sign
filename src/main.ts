import 'reflect-metadata'; // package class-transformer need it

import { App } from '@/app';
import { Logger } from '@/logger';

async function bootstrap() {
  const app = new App();
  await app.start();
}

bootstrap().catch(reason => {
  Logger.error(reason);
});
