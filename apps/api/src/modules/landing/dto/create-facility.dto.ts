import { IsString, IsNotEmpty, IsOptional, IsArray, IsInt, Min } from 'class-validator';

export class CreateFacilityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
