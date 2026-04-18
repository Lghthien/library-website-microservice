import {
  IsDateString,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateReaderDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^0\d{9}$/, {
    message: 'Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0',
  })
  phoneNumber?: string;

  @IsNotEmpty()
  @IsMongoId()
  readerTypeId: string;
}
