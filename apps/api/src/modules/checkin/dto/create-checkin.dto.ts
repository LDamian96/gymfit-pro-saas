import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCheckinDto {
  @IsString()
  @IsNotEmpty()
  qrCode: string;

  @IsString()
  @IsNotEmpty()
  branchId: string;
}
