import cors from 'cors';
import express, { type Express } from 'express';
import type { Container } from './container';
import { errorHandler, notFoundHandler } from './errors/errorHandler';
import { createRouter } from './routes';

export interface AppOptions {
  webOrigin: string;
}

// Crea la aplicación Express sin arrancar el servidor (testeable con Supertest).
export function createApp(container: Container, options: AppOptions): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: options.webOrigin }));
  app.use(express.json({ limit: '100kb' }));
  app.use(createRouter(container));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
