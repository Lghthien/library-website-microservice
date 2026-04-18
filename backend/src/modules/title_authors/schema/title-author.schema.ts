import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TitleAuthorDocument = TitleAuthor & Document;

@Schema({ timestamps: true })
export class TitleAuthor {
  @Prop({ type: Types.ObjectId, ref: 'TitleBook', required: true })
  titleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Author', required: true })
  authorId: Types.ObjectId;
}

export const TitleAuthorSchema = SchemaFactory.createForClass(TitleAuthor);

// Create compound index to ensure unique title-author pairs
TitleAuthorSchema.index({ titleId: 1, authorId: 1 }, { unique: true });
