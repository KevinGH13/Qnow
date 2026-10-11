import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Most recently active first (last time something was recorded in it). */
  findAll() {
    return this.prisma.project.findMany({ orderBy: { updatedAt: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.project.findUniqueOrThrow({ where: { id }, include: { teams: true } });
  }

  create(dto: CreateProjectDto) {
    return this.prisma.project.create({ data: dto });
  }

  update(id: string, dto: UpdateProjectDto) {
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  /** Bumps updatedAt so the project becomes the "last active" one. */
  touch(id: string) {
    return this.prisma.project.update({ where: { id }, data: { updatedAt: new Date() } });
  }

  remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }
}
