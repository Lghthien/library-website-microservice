import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FineReceiptDocument = FineReceipt & Document;

@Schema({ timestamps: true })
export class FineReceipt {
  @Prop({ required: true })
  paymentDate: Date;

  @Prop({ required: true })
  amountPaid: number;

  @Prop({ default: 'paid' })
  status: string;

  @Prop()
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'Reader', required: true })
  readerId: Types.ObjectId;
}

export const FineReceiptSchema = SchemaFactory.createForClass(FineReceipt);
