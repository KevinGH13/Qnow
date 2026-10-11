import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

/**
 * Entry point for local dev and for Vercel, which detects this file and runs the app as a
 * single Vercel Function (it handles `listen`).
 */
async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  // Locally the frontend runs on Vite (another port). On Vercel the frontend proxies /api,
  // so both share one origin and CORS isn't needed.
  if (!process.env.VERCEL) {
    app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' });
  }
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
