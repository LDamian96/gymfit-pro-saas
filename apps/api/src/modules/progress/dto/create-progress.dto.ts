import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateProgressDto {
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  waist?: number;

  @IsOptional()
  @IsNumber()
  chest?: number;

  @IsOptional()
  @IsNumber()
  arms?: number;

  @IsOptional()
  @IsNumber()
  legs?: number;

  @IsOptional()
  @IsNumber()
  hips?: number;

  @IsOptional()
  @IsNumber()
  bodyFat?: number;

  @IsOptional()
  @IsNumber()
  muscleMass?: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
