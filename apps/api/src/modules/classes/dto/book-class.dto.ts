import { IsDateString } from 'class-validator';

export class BookClassDto {
  @IsDateString({}, { message: 'date debe ser una fecha ISO válida' })
  date: string;
}
