import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DecisionsService } from './decisions.service.js';
import { CreateDecisionDto } from './dto/create-decision.dto.js';
import { UpdateDecisionDto } from './dto/update-decision.dto.js';

@Controller('decisions')
export class DecisionsController {
  constructor(private readonly decisions: DecisionsService) {}

  @Get()
  findAll(
    @Query('eventId') eventId?: string,
    @Query('projectId') projectId?: string,
    @Query('tag') tag?: string,
  ) {
    return this.decisions.findAll({ eventId, projectId, tag });
  }

  @Post()
  create(@Body() dto: CreateDecisionDto) {
    return this.decisions.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDecisionDto) {
    return this.decisions.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.decisions.remove(id);
  }
}
