import { IsString, IsNotEmpty } from 'class-validator';

export class ScanStaffDto {
  @IsString()
  @IsNotEmpty()
  qrCode!: string;
}
