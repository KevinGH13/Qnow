import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { createRemoteJWKSet, errors, jwtVerify, type JWTPayload } from 'jose';
import { loadAuthConfig, type AuthConfig } from './auth.config.js';
import { IS_PUBLIC } from './public.decorator.js';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  emailVerified: boolean;
}

export type AuthedRequest = Request & { user?: AuthUser };

interface NeonClaims extends JWTPayload {
  email?: string;
  name?: string;
  emailVerified?: boolean;
}

/**
 * Global guard: every route needs a valid Neon Auth JWT (Authorization: Bearer <token>)
 * from an allowed account, unless marked @Public().
 *
 * Tokens are EdDSA-signed by Neon Auth; keys come from the project's JWKS endpoint and are
 * cached by jose. Allowed = user id in ALLOWED_USER_IDS, or email in ALLOWED_EMAILS and verified.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  private readonly config: AuthConfig;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly reflector: Reflector) {
    this.config = loadAuthConfig();
    this.jwks = createRemoteJWKSet(this.config.jwksUrl);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = this.bearer(req);
    if (!token) throw new UnauthorizedException('Sign in to use qnow.');

    const claims = await this.verify(token);
    const user: AuthUser = {
      id: String(claims.sub ?? ''),
      email: claims.email?.toLowerCase() ?? null,
      name: claims.name ?? null,
      emailVerified: claims.emailVerified === true,
    };

    if (!this.isAllowed(user)) {
      this.logger.warn(`Rejected account ${user.id} (${user.email ?? 'no email'})`);
      throw new ForbiddenException({
        message: user.email && this.config.allowedEmails.has(user.email) && !user.emailVerified
          ? 'Verify your email to use qnow.'
          : 'This account is not allowed to use qnow.',
        userId: user.id,
      });
    }

    req.user = user;
    return true;
  }

  private bearer(req: Request) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return null;
    return header.slice('Bearer '.length).trim() || null;
  }

  private async verify(token: string): Promise<NeonClaims> {
    try {
      const { payload } = await jwtVerify<NeonClaims>(token, this.jwks, {
        issuer: this.config.issuer,
        algorithms: ['EdDSA'],
      });
      if (!payload.sub) throw new UnauthorizedException('Invalid session.');
      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      if (error instanceof errors.JWTExpired) throw new UnauthorizedException('Session expired.');
      if (error instanceof errors.JOSEError) throw new UnauthorizedException('Invalid session.');
      // JWKS unreachable or similar: not the user's fault, but still no access.
      this.logger.error(`Could not verify token: ${(error as Error).message}`);
      throw new UnauthorizedException('Could not verify your session. Try again.');
    }
  }

  private isAllowed(user: AuthUser) {
    const { allowedUserIds, allowedEmails } = this.config;
    if (allowedUserIds.has(user.id.toLowerCase())) return true;
    return !!user.email && allowedEmails.has(user.email) && user.emailVerified;
  }
}
