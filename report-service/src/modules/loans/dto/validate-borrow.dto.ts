import { IsNotEmpty, IsArray, IsString } from 'class-validator';

export class ValidateBorrowDto {
  @IsNotEmpty()
  @IsString()
  readerId: string;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  copyIds: string[];
}
