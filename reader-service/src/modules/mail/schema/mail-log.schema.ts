import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MailLogDocument = MailLog & Document;

@Schema({ timestamps: true })
export class MailLog {
  @Prop({ required: true })
  recipient: string; // Người nhận

  @Prop({ required: true })
  type: string; // Loại mail (VD: VERIFICATION)

  @Prop({ default: 'SUCCESS' })
  status: string; // Trạng thái gửi (SUCCESS/FAILED)
}

export const MailLogSchema = SchemaFactory.createForClass(MailLog);
