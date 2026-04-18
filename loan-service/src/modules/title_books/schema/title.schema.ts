import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TitleBookDocument = TitleBook & Document;

@Schema({ timestamps: true })
export class TitleBook {
  @Prop({ required: true })
  titleName: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;
}

export const TitleBookSchema = SchemaFactory.createForClass(TitleBook);

TitleBookSchema.virtual('authors', {
  ref: 'TitleAuthor',
  localField: '_id',
  foreignField: 'titleId',
});

TitleBookSchema.set('toObject', { virtuals: true });
TitleBookSchema.set('toJSON', { virtuals: true });
