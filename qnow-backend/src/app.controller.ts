import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Public } from './auth/public.decorator.js';
import { CurrentUser } from './auth/current-user.decorator.js';
import type { AuthUser } from './auth/auth.guard.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Health check, reachable without signing in. */
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** Who is signed in; the frontend uses it to confirm the account is allowed. */
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
