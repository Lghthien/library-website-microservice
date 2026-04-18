import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookDocument = Book & Document;

@Schema({ timestamps: true })
export class Book {
  @Prop()
  publisher: string;

  @Prop()
  publishYear: number;

  @Prop({ required: true })
  importDate: Date;

  @Prop({ required: true })
  price: number;

  @Prop({ type: Types.ObjectId, ref: 'TitleBook', required: true })
  titleId: Types.ObjectId;
}

export const BookSchema = SchemaFactory.createForClass(Book);
