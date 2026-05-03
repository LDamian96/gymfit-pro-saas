import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateLandingServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  iconName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
