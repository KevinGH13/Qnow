import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdatePersonDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  /** Send null or an empty string to clear it. */
  @IsOptional()
  @ValidateIf((_, v) => typeof v === 'string' && v.trim() !== '')
  @IsEmail()
  @MaxLength(320)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  role?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;
}
