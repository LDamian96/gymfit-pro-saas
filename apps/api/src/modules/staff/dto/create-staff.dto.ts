import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';

export enum StaffRole {
  RECEPTIONIST = 'RECEPTIONIST',
  TRAINER = 'TRAINER',
}

export class CreateStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
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

  @IsEnum(StaffRole)
  role: StaffRole;

  @IsOptional()
  @IsString()
  branchId?: string;
}
