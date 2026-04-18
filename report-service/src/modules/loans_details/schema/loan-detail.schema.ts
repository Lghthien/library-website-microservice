import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LoanDetailDocument = LoanDetail & Document;
// đây là bảng chi tiết mượn sách, lưu trữ thông tin về từng bản sao sách được mượn trong một phiếu mượn
@Schema({ timestamps: true })
export class LoanDetail {
  @Prop({ type: Types.ObjectId, ref: 'Loan', required: true })
  loanId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'BookCopy', required: true })
  copyId: Types.ObjectId;

  @Prop()
  returnDate: Date;

  @Prop({ default: 0 })
  fineAmount: number;

  @Prop({ default: 0 }) // Số ngày quá hạn
  overdueDays: number;
}

export const LoanDetailSchema = SchemaFactory.createForClass(LoanDetail);

// Create compound index for composite primary key
LoanDetailSchema.index({ loanId: 1, copyId: 1 }, { unique: true });
