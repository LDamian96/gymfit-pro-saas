import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateFaqDto {
  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsNotEmpty()
  answer: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
