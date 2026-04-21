import { IsString, IsEmail, IsDateString } from 'class-validator';

export class BulkCreateReaderDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  phoneNumber: string;

  @IsDateString()
  dateOfBirth: string;

  @IsString()
  address: string;

  @IsString()
  readerType: string; // TÃªn loáº¡i Ä‘á»™c giáº£ (e.g. "Sinh viÃªn", "Giáº£ng viÃªn")
}
