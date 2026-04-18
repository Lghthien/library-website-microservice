import { IsString, IsEmail, IsOptional, IsDateString } from 'class-validator';

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
  readerType: string; // Tên loại độc giả (e.g. "Sinh viên", "Giảng viên")
}
