import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TitleBookDocument = TitleBook & Document;

@Schema({ timestamps: true })
export class TitleBook {
  @Prop({ required: true })
  title: string;

  @Prop({ default: 0 })
  price: number;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop()
  publisher: string;

  @Prop()
  publishYear: number;

  @Prop()
  description: string;

  @Prop()
  isbn: string;

  @Prop()
  language: string;

  @Prop({ default: 0 })
  totalCopies: number;

  @Prop({ default: 0 })
  availableCopies: number;

  @Prop({ default: 0 })
  lostCopies: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;
}

export const TitleBookSchema = SchemaFactory.createForClass(TitleBook);

TitleBookSchema.virtual('authors', {
  ref: 'TitleAuthor',
  localField: '_id',
  foreignField: 'titleId',
});

TitleBookSchema.set('toObject', { virtuals: true });
TitleBookSchema.set('toJSON', { virtuals: true });
