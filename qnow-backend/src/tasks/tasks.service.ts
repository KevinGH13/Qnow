import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import type { TaskStatus } from '../generated/prisma/enums.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

export interface FindTasksFilter {
  projectId?: string;
  status?: TaskStatus;
}

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
  ) {}

  /**
   * Ordering rule: priority (high → low), then oldest first within the same priority.
   * Postgres sorts enums by declaration order, so `priority: 'asc'` yields high, medium, low.
   */
  findAll({ projectId, status }: FindTasksFilter) {
    return this.prisma.task.findMany({
      where: { projectId, status },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      include: { event: { select: { id: true, title: true } } },
    });
  }

  async create(dto: CreateTaskDto) {
    const task = await this.prisma.task.create({ data: dto });
    await this.projects.touch(dto.projectId);
    return task;
  }

  update(id: string, dto: UpdateTaskDto) {
    return this.prisma.task.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }
}
