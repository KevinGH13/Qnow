import { ArrayMaxSize, IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDecisionDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  text: string;

  /** ISO 8601 date string; defaults to now */
  @IsOptional()
  @IsDateString()
  date?: string;

  /** Tag names. Unknown names are created on the fly (dynamic catalog). */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  tags?: string[];
}
