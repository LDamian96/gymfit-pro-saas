import { IsString, IsOptional, IsInt, IsEnum, IsObject } from 'class-validator';
import { GamificationType } from '@prisma/client';

export class UpdateGamificationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(GamificationType)
  type?: GamificationType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  @IsInt()
  points?: number;

  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;
}
