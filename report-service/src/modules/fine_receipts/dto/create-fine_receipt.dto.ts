import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateFineReceiptDto {
  @IsNotEmpty()
  @IsNumber()
  amountPaid: number;

  @IsNotEmpty()
  @IsString()
  readerId: string;
}
