import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLoansDetailDto {
  @IsNotEmpty()
  @IsString()
  loanId: string;

  @IsNotEmpty()
  @IsString()
  copyId: string;
}
