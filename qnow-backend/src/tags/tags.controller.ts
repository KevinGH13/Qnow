import { Controller, Get, Query } from '@nestjs/common';
import { TagsService } from './tags.service.js';

@Controller('tags')
export class TagsController {
  constructor(private readonly tags: TagsService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.tags.findAll(search);
  }
}
