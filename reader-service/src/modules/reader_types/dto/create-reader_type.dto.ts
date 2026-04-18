import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateReaderTypeDto {
  @IsString()
  @IsNotEmpty()
  readerTypeName: string;

  @IsNumber()
  @Min(1)
  maxBorrowLimit: number;

  @IsNumber()
  @Min(1)
  cardValidityMonths: number;
}
