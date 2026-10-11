import { Body, Controller, Delete, Get, Param, ParseEnumPipe, Patch, Post, Query } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { EventStatus } from '../generated/prisma/enums.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  findAll(@Query('projectId') projectId?: string, @Query('status', new ParseEnumPipe(EventStatus, { optional: true })) status?: EventStatus) {
    return this.events.findAll({ projectId, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.events.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.events.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.events.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.events.remove(id);
  }

  @Post(':id/participants/:personId')
  addParticipant(@Param('id') id: string, @Param('personId') personId: string) {
    return this.events.addParticipant(id, personId);
  }

  @Delete(':id/participants/:personId')
  removeParticipant(@Param('id') id: string, @Param('personId') personId: string) {
    return this.events.removeParticipant(id, personId);
  }
}
