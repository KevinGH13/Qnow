import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import type { EventStatus } from '../generated/prisma/enums.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';

export interface FindEventsFilter {
  projectId?: string;
  status?: EventStatus;
}

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
  ) {}

  /** Scheduled events (agenda) ascending by date; completed ones most recent first. */
  findAll({ projectId, status }: FindEventsFilter) {
    return this.prisma.event.findMany({
      where: { projectId, status },
      orderBy: { date: status === 'scheduled' ? 'asc' : 'desc' },
      include: {
        participants: { include: { person: true } },
        _count: { select: { decisions: true, tasks: true } },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.event.findUniqueOrThrow({
      where: { id },
      include: {
        decisions: { include: { tags: { include: { tag: true } } }, orderBy: { createdAt: 'asc' } },
        tasks: { orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }] },
        participants: { include: { person: true } },
      },
    });
  }

  async create(dto: CreateEventDto) {
    const event = await this.prisma.event.create({
      data: { ...dto, date: new Date(dto.date) },
    });
    await this.projects.touch(dto.projectId);
    return event;
  }

  update(id: string, { date, ...rest }: UpdateEventDto) {
    return this.prisma.event.update({
      where: { id },
      data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
    });
  }

  remove(id: string) {
    return this.prisma.event.delete({ where: { id } });
  }

  addParticipant(eventId: string, personId: string) {
    return this.prisma.eventParticipant.create({ data: { eventId, personId } });
  }

  removeParticipant(eventId: string, personId: string) {
    return this.prisma.eventParticipant.delete({
      where: { eventId_personId: { eventId, personId } },
    });
  }
}
