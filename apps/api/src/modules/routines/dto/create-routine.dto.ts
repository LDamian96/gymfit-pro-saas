import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsInt, Min, Max, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ExerciseInRoutineDto {
  @IsString()
  @IsNotEmpty()
  exerciseId: string;

  @IsInt()
  @Min(1)
  sets: number;

  @IsInt()
  @Min(1)
  reps: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  restSeconds?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsString()
  trainerNotes?: string;
}

export class RoutineDayDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseInRoutineDto)
  exercises: ExerciseInRoutineDto[];
}

export class CreateRoutineDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutineDayDto)
  days: RoutineDayDto[];
}
