import { IsString, IsNotEmpty, IsNumber, IsInt, IsArray, IsBoolean, IsOptional, IsIn, Min, Max } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(1)
  duration: number;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;

  // Frecuencia del plan: DAILY=7, INTERDAILY=3, CUSTOM=weeklyVisitLimit, UNLIMITED=sin tope.
  @IsOptional()
  @IsIn(['DAILY', 'INTERDAILY', 'CUSTOM', 'UNLIMITED'])
  frequency?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  weeklyVisitLimit?: number;
}
