import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PeopleService } from './people.service.js';
import { CreatePersonDto } from './dto/create-person.dto.js';
import { UpdatePersonDto } from './dto/update-person.dto.js';

@Controller('people')
export class PeopleController {
  constructor(private readonly people: PeopleService) {}

  @Get()
  findAll(@Query('search') search?: string, @Query('projectId') projectId?: string) {
    return this.people.findAll(search, projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('projectId') projectId?: string) {
    return this.people.findOne(id, projectId);
  }

  @Post()
  create(@Body() dto: CreatePersonDto) {
    return this.people.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePersonDto) {
    return this.people.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.people.remove(id);
  }
}
