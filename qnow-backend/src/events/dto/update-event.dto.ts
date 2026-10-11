import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { EventStatus } from '../../generated/prisma/enums.js';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  description?: string;

  /** ISO 8601 date string */
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
