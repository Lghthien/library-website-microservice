import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReaderTypeDocument = ReaderType & Document;

@Schema({ timestamps: true })
export class ReaderType {
  @Prop({ required: true, unique: true })
  readerTypeName: string;

  @Prop({ default: 5 })
  maxBorrowLimit: number;

  @Prop({ default: 6 })
  cardValidityMonths: number;
}

export const ReaderTypeSchema = SchemaFactory.createForClass(ReaderType);
