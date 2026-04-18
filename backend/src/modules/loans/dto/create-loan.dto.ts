import { IsNotEmpty, IsMongoId, IsArray, ArrayMinSize } from 'class-validator';

export class CreateLoanDto {
  @IsNotEmpty()
  @IsMongoId()
  readerId: string;

  @IsArray()
  @IsMongoId({ each: true }) // Kiểm tra từng ID trong mảng
  @ArrayMinSize(1, { message: 'Phải mượn ít nhất 1 quyển sách' })
  bookIds: string[]; // Đảm bảo có trường này để Service sử dụng
}
