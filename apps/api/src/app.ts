import express, { type Express } from 'express';
import { healthRouter } from './routes/health.routes';

// Crea la aplicación Express sin arrancar el servidor (testeable con Supertest).
export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(healthRouter);
  return app;
}
