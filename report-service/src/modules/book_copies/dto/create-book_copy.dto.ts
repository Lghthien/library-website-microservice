import { IsNotEmpty, IsString, IsOptional, IsMongoId } from 'class-validator';

export class CreateBookCopyDto {
  @IsNotEmpty()
  @IsMongoId()
  bookId: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
