import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/** Marks a route as reachable without signing in (e.g. the health check). */
export const Public = () => SetMetadata(IS_PUBLIC, true);
