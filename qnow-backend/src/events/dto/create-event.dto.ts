import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { EventStatus } from '../../generated/prisma/enums.js';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  description?: string;

  /** ISO 8601 date string */
  @IsDateString()
  date: string;

  /** Defaults to scheduled. Use completed when logging an event as it happens. */
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
