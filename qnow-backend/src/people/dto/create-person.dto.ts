import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class CreatePersonDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  /** Optional; blank is stored as NULL. */
  @IsOptional()
  @ValidateIf((_, v) => typeof v === 'string' && v.trim() !== '')
  @IsEmail()
  @MaxLength(320)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}
