import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReaderDocument = Reader & Document;

@Schema({ timestamps: true })
export class Reader {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop()
  address: string;

  @Prop()
  email: string;

  @Prop()
  phoneNumber: string;

  @Prop({ required: true })
  createdDate: Date;

  @Prop({ required: true })
  expiryDate: Date;

  @Prop({ default: 0 })
  totalDebt: number;

  @Prop({ type: Types.ObjectId, ref: 'ReaderType', required: true })
  readerTypeId: Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;
}

export const ReaderSchema = SchemaFactory.createForClass(Reader);
