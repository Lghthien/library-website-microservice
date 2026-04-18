import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LoanDocument = Loan & Document;

@Schema({ timestamps: true })
export class Loan {
  @Prop({ required: true })
  borrowDate: Date;

  @Prop({ type: Types.ObjectId, ref: 'Reader', required: true })
  readerId: Types.ObjectId;
}

export const LoanSchema = SchemaFactory.createForClass(Loan);

// Virtual populate for loan details
LoanSchema.virtual('loanDetails', {
  ref: 'LoanDetail',
  localField: '_id',
  foreignField: 'loanId',
});

// Ensure virtuals are included when converting to JSON
LoanSchema.set('toJSON', { virtuals: true });
LoanSchema.set('toObject', { virtuals: true });
