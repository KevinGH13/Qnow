import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TeamsService } from './teams.service.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    return this.teams.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teams.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTeamDto) {
    return this.teams.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teams.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teams.remove(id);
  }

  @Post(':id/members/:personId')
  addMember(@Param('id') id: string, @Param('personId') personId: string) {
    return this.teams.addMember(id, personId);
  }

  @Delete(':id/members/:personId')
  removeMember(@Param('id') id: string, @Param('personId') personId: string) {
    return this.teams.removeMember(id, personId);
  }
}
