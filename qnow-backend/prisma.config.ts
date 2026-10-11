import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI config (generate, migrate). The app itself connects through the pg adapter
 * (see src/prisma/prisma.service.ts) using DATABASE_URL.
 *
 * Migrations use DIRECT_URL when set: Neon's pooled URL (host with "-pooler") goes through
 * PgBouncer, which doesn't support everything Prisma Migrate needs.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '' },
});
