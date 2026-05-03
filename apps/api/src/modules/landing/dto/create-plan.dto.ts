import { IsString, IsNotEmpty, IsNumber, IsInt, IsArray, IsBoolean, IsOptional, Min } from 'class-validator';

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
}
