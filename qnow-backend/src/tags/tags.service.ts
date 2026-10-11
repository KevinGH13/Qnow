import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Tag catalog, with usage count for autocomplete ranking. */
  findAll(search?: string) {
    return this.prisma.tag.findMany({
      where: search ? { name: { contains: search.toLowerCase() } } : undefined,
      orderBy: { name: 'asc' },
      include: { _count: { select: { decisions: true } } },
    });
  }
}
