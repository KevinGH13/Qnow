import { ArrayMaxSize, IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDecisionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  text?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  /** Replaces the full tag set when provided. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  tags?: string[];
}
