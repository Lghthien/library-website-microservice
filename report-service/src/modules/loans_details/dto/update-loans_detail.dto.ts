import { PartialType } from '@nestjs/mapped-types';
import { CreateLoansDetailDto } from './create-loans_detail.dto';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLoansDetailDto extends PartialType(CreateLoansDetailDto) {
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Ngày trả phải đúng định dạng ngày tháng' })
  returnDate?: Date; //

  @IsOptional()
  @IsNumber({}, { message: 'Tiền phạt phải là con số' })
  fineAmount?: number; //

  @IsOptional()
  @IsNumber()
  overdueDays?: number; // Thêm để ghi nhận số ngày trễ cho Biểu mẫu 5

  @IsOptional()
  @IsString()
  status?: string; // Ví dụ: 'returned', 'lost', 'damaged'
}
