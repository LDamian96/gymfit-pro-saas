import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { MembershipType } from './create-member.dto';

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(MembershipType)
  membershipType?: MembershipType;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  branchId?: string;
}
