import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { StaffRole } from './create-staff.dto';

export class UpdateStaffDto {
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
  @IsEnum(StaffRole)
  role?: StaffRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  branchId?: string;
}
