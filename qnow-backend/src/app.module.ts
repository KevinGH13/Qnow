import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { EventsModule } from './events/events.module.js';
import { DecisionsModule } from './decisions/decisions.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { PeopleModule } from './people/people.module.js';
import { TeamsModule } from './teams/teams.module.js';
import { TagsModule } from './tags/tags.module.js';

@Module({
  imports: [
    PrismaModule,
    ProjectsModule,
    EventsModule,
    DecisionsModule,
    TasksModule,
    PeopleModule,
    TeamsModule,
    TagsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
