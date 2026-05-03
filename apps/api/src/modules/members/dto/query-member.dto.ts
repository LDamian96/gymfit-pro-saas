import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMemberDto {
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
  search?: string;

  @IsOptional()
  @IsString()
  status?: 'active' | 'expiring' | 'inactive';

  // Solo admin: filtra por sucursal específica. Recep/Trainer es ignorado (forzado a la suya).
  @IsOptional()
  @IsString()
  branchId?: string;
}
