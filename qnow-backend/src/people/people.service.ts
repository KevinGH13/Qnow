import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePersonDto } from './dto/create-person.dto.js';
import { UpdatePersonDto } from './dto/update-person.dto.js';

@Injectable()
export class PeopleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * All people (they're global). With a projectId, each person also carries `project`:
   * their teams and meeting stats in that project, or null if they have no link to it yet.
   */
  async findAll(search?: string, projectId?: string) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    if (!projectId) {
      return this.prisma.person.findMany({ where, orderBy: { name: 'asc' } });
    }

    const people = await this.prisma.person.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        teams: { where: { team: { projectId } }, select: { team: { select: { id: true, name: true } } } },
        events: { where: { event: { projectId } }, select: { event: { select: { date: true } } } },
      },
    });

    const now = Date.now();
    return people.map(({ teams, events, ...person }) => {
      const dates = events.map((e) => e.event.date.getTime());
      const past = dates.filter((d) => d <= now);
      const future = dates.filter((d) => d > now);
      const linked = teams.length > 0 || dates.length > 0;
      return {
        ...person,
        project: linked
          ? {
              teams: teams.map((t) => t.team),
              meetingCount: past.length,
              lastMeetingAt: past.length ? new Date(Math.max(...past)) : null,
              nextMeetingAt: future.length ? new Date(Math.min(...future)) : null,
            }
          : null,
      };
    });
  }

  /** Person profile; with a projectId, includes their teams, meetings and decisions in that project. */
  async findOne(id: string, projectId?: string) {
    const person = await this.prisma.person.findUniqueOrThrow({ where: { id } });
    if (!projectId) return person;

    const [teams, meetings, decisions] = await Promise.all([
      this.prisma.team.findMany({
        where: { projectId, members: { some: { personId: id } } },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.event.findMany({
        where: { projectId, participants: { some: { personId: id } } },
        select: { id: true, title: true, date: true, status: true },
        orderBy: { date: 'desc' },
      }),
      this.prisma.decision.findMany({
        where: { event: { projectId, participants: { some: { personId: id } } } },
        include: { tags: { include: { tag: true } }, event: { select: { id: true, title: true } } },
        orderBy: { date: 'desc' },
      }),
    ]);

    return { ...person, teams, meetings, decisions };
  }

  create(dto: CreatePersonDto) {
    return this.prisma.person.create({ data: { ...dto, email: normalizeEmail(dto.email) } });
  }

  update(id: string, dto: UpdatePersonDto) {
    const data = 'email' in dto ? { ...dto, email: normalizeEmail(dto.email) } : dto;
    return this.prisma.person.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.person.delete({ where: { id } });
  }
}

/** Blank emails are stored as NULL so they don't collide on the unique index. */
function normalizeEmail(email?: string | null) {
  const trimmed = email?.trim().toLowerCase();
  return trimmed ? trimmed : null;
}
