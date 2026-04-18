import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LoadDetailDocument = LoadDetail & Document;

@Schema({ timestamps: true })
export class LoadDetail {
  @Prop({ type: Types.ObjectId, ref: 'Load', required: true })
  loadId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TitleBook', required: true })
  titleBookId: Types.ObjectId;

  @Prop({ required: true })
  quantity: number;

  @Prop({ default: 0 })
  unitPrice: number;

  @Prop({ default: 0 })
  totalPrice: number;
}

export const LoadDetailSchema = SchemaFactory.createForClass(LoadDetail);
