import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsObject } from 'class-validator';
import { GamificationType } from '@prisma/client';

export class CreateGamificationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(GamificationType)
  type: GamificationType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsInt()
  points: number;

  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;
}
