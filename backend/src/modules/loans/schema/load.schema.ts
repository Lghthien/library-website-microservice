import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LoadDocument = Load & Document;

@Schema({ timestamps: true })
export class Load {
  @Prop({ required: true })
  loadDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop()
  supplier: string;

  @Prop({ default: 0 })
  totalBooks: number;

  @Prop({ default: 0 })
  totalAmount: number;

  @Prop()
  notes: string;
}

export const LoadSchema = SchemaFactory.createForClass(Load);
