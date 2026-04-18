import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ParameterDocument = Parameter & Document;

@Schema({ collection: 'parameters', timestamps: true })
export class Parameter {
  @Prop({ required: true, unique: true })
  paramName: string;

  @Prop({ required: true })
  paramValue: string;

  @Prop()
  description: string;

  @Prop()
  dataType: string; // 'string', 'number', 'boolean'
}

export const ParameterSchema = SchemaFactory.createForClass(Parameter);

// Các tham số mặc định:
// QD1_MIN_AGE: 15 - Tuổi tối thiểu
// QD1_MAX_AGE: 70 - Tuổi tối đa
// QD8_CARD_VALIDITY_MONTHS: 12 - Thời hạn thẻ (tháng)
// QD8_CATEGORY_LIMIT: 3 - Số lượng thể loại
// QD8_PUBLICATION_YEAR_GAP: 50 - Khoảng cách năm xuất bản
// QD8_MAX_BOOKS_PER_LOAN: 5 - Số sách mượn tối đa
// QD8_MAX_BORROW_DAYS: 30 - Số ngày mượn tối đa
// QD8_FINE_PER_DAY: 5000 - Tiền phạt mỗi ngày (VND)
