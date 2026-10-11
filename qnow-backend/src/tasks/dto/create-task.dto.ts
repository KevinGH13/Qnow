import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Priority } from '../../generated/prisma/enums.js';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  /** Optional: tasks can exist without an event. */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  eventId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;
}
