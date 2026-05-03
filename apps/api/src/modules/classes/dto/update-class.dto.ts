import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  Matches,
  IsBoolean,
} from 'class-validator';

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime debe tener formato HH:mm' })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime debe tener formato HH:mm' })
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxCapacity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  instructorId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}
