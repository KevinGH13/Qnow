import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';

@Module({
  imports: [ProjectsModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
