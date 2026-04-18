import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class ReturnBookDto {
  @IsNotEmpty()
  @IsString()
  copyId: string;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsOptional()
  @IsBoolean()
  isLost?: boolean;
}
