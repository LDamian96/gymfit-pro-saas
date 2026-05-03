import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';

export enum MembershipType {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
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

  @IsOptional()
  @IsString()
  branchId?: string;
}
