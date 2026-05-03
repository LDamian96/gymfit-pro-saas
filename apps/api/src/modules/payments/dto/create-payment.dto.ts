import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';

export enum PaymentMethod {
  YAPE = 'YAPE',
  BCP = 'BCP',
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
}

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  proofUrl?: string;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}
