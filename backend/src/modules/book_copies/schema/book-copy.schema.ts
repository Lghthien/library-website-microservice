import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookCopyDocument = BookCopy & Document;

@Schema({ timestamps: true })
export class BookCopy {
  @Prop({ required: true })
  status: number; // 0 = Borrowed, 1 = Available, 2 = Lost

  @Prop({ type: Types.ObjectId, ref: 'Book', required: true })
  bookId: Types.ObjectId;
}

export const BookCopySchema = SchemaFactory.createForClass(BookCopy);
