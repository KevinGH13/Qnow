import { ValidationPipe, type INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { PrismaExceptionFilter } from './prisma/prisma-exception.filter.js';

/** Global app configuration, shared by local dev and Vercel. */
export function configureApp(app: INestApplication) {
  const express = app as NestExpressApplication;
  express.disable('x-powered-by');
  // Behind Vercel's proxy: trust X-Forwarded-* for client IP and protocol.
  express.set('trust proxy', true);

  // Every response is private, per-user data: never let a CDN or browser cache it.
  // (Vercel caches external-rewrite responses that carry cache headers.)
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'private, no-store');
    next();
  });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // drop properties without validation decorators
      forbidNonWhitelisted: true, // …and reject requests that send them
      transform: true,
    }),
  );
  return app;
}
