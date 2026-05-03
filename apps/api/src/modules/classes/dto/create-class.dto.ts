import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime debe tener formato HH:mm' })
  startTime: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime debe tener formato HH:mm' })
  endTime: string;

  @IsInt()
  @Min(1)
  maxCapacity: number;

  @IsString()
  @IsNotEmpty()
  instructorId: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}
