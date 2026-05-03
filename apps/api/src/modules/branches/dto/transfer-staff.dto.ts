import { IsString, IsNotEmpty } from 'class-validator';

export class TransferStaffDto {
  @IsString()
  @IsNotEmpty()
  staffId: string;

  @IsString()
  @IsNotEmpty()
  toBranchId: string;
}
