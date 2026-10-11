import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';

const withMembers = { members: { include: { person: true } } } as const;

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(projectId?: string) {
    return this.prisma.team.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
      include: withMembers,
    });
  }

  findOne(id: string) {
    return this.prisma.team.findUniqueOrThrow({ where: { id }, include: withMembers });
  }

  create(dto: CreateTeamDto) {
    return this.prisma.team.create({ data: dto });
  }

  update(id: string, dto: UpdateTeamDto) {
    return this.prisma.team.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.team.delete({ where: { id } });
  }

  addMember(teamId: string, personId: string) {
    return this.prisma.personTeam.create({ data: { teamId, personId } });
  }

  removeMember(teamId: string, personId: string) {
    return this.prisma.personTeam.delete({
      where: { personId_teamId: { personId, teamId } },
    });
  }
}
