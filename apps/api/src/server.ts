import { createApp } from './app';
import { config } from './config';

const app = createApp();

app.listen(config.port, () => {
  console.info(`API de SaaS-O-Matic escuchando en http://localhost:${config.port}`);
});
