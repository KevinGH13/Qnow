import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateDecisionDto } from './dto/create-decision.dto.js';
import { UpdateDecisionDto } from './dto/update-decision.dto.js';

const withTags = { tags: { include: { tag: true } } } as const;

export interface FindDecisionsFilter {
  eventId?: string;
  projectId?: string;
  tag?: string;
}

@Injectable()
export class DecisionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll({ eventId, projectId, tag }: FindDecisionsFilter) {
    return this.prisma.decision.findMany({
      where: {
        eventId,
        ...(projectId ? { event: { projectId } } : {}),
        ...(tag ? { tags: { some: { tag: { name: tag } } } } : {}),
      },
      orderBy: { date: 'desc' },
      include: { ...withTags, event: { select: { id: true, title: true } } },
    });
  }

  async create({ tags = [], date, ...rest }: CreateDecisionDto) {
    const tagRecords = await this.upsertTags(tags);
    return this.prisma.decision.create({
      data: {
        ...rest,
        ...(date ? { date: new Date(date) } : {}),
        tags: { create: tagRecords.map((t) => ({ tagId: t.id })) },
      },
      include: withTags,
    });
  }

  async update(id: string, { tags, date, ...rest }: UpdateDecisionDto) {
    const tagRecords = tags ? await this.upsertTags(tags) : undefined;
    return this.prisma.decision.update({
      where: { id },
      data: {
        ...rest,
        ...(date ? { date: new Date(date) } : {}),
        ...(tagRecords
          ? { tags: { deleteMany: {}, create: tagRecords.map((t) => ({ tagId: t.id })) } }
          : {}),
      },
      include: withTags,
    });
  }

  remove(id: string) {
    return this.prisma.decision.delete({ where: { id } });
  }

  /** Get-or-create each tag by normalized name. */
  private upsertTags(names: string[]) {
    const unique = [...new Set(names.map((n) => n.trim().toLowerCase()).filter(Boolean))];
    return Promise.all(
      unique.map((name) =>
        this.prisma.tag.upsert({ where: { name }, create: { name }, update: {} }),
      ),
    );
  }
}
