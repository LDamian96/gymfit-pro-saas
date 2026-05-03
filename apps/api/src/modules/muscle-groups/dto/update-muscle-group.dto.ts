import { IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMuscleGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
