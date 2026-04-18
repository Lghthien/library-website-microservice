import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsMongoId,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class CreateBookDto {
  @IsNotEmpty({ message: 'Đầu sách (titleId) không được để trống' })
  @IsMongoId({ message: 'Mã đầu sách không hợp lệ' })
  titleId: string;

  @IsNotEmpty({ message: 'Năm xuất bản không được để trống' })
  @IsNumber({}, { message: 'Năm xuất bản phải là một con số' })
  @Min(1900)
  @Max(new Date().getFullYear())
  publishYear: number;

  @IsNotEmpty({ message: 'Giá tiền không được để trống' })
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsNotEmpty({ message: 'Ngày nhập sách không được để trống' })
  @IsDateString()
  importDate?: string;
}
