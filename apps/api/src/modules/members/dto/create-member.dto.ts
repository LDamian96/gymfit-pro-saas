import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MembershipType {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
}

// Frecuencia de asistencia. DAILY=todos los días, INTERDAILY=día por medio (3/sem),
// CUSTOM=el admin define cuántos días por semana. null/UNLIMITED = sin límite.
export enum MembershipFrequency {
  UNLIMITED = 'UNLIMITED',
  DAILY = 'DAILY',
  INTERDAILY = 'INTERDAILY',
  CUSTOM = 'CUSTOM',
}

export class CreateMemberDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(MembershipType)
  membershipType: MembershipType;

  // Frecuencia de asistencia. Si CUSTOM, usar weeklyVisitLimit.
  @IsOptional()
  @IsEnum(MembershipFrequency)
  membershipFrequency?: MembershipFrequency;

  // Solo si membershipFrequency = CUSTOM: cuántos días por semana.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  weeklyVisitLimit?: number;

  @IsOptional()
  @IsString()
  branchId?: string;
}
