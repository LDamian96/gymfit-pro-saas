import { IsString, IsOptional, IsObject } from 'class-validator';

export class UpdateLandingDto {
  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsObject()
  content?: Record<string, unknown>;
}
