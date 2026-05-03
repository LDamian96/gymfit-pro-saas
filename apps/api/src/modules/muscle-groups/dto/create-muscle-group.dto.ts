import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMuscleGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}
