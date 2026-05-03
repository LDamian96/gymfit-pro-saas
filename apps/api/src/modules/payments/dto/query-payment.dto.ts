import { IsOptional, IsString, IsInt, Min, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from './create-payment.dto';
import { PaymentStatus } from './update-payment-status.dto';

export class QueryPaymentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
