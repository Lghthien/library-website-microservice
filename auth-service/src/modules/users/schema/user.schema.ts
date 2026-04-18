import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  phoneNumber: string;

  @Prop({ required: true, enum: ['ADMIN', 'LIBRARIAN'], default: 'LIBRARIAN' })
  role: string;

  @Prop({ default: 'locked', enum: ['active', 'locked', 'pending'] })
  status: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ type: String })
  verificationToken: string | null;

  @Prop({ type: Date })
  verificationTokenExpires: Date | null;

  @Prop({ default: false })
  createdByAdmin: boolean;

  @Prop({ type: Date })
  lastLogin: Date;

  @Prop({ type: String })
  otp: string | null;

  @Prop({ type: Date })
  otpExpires: Date | null;

  @Prop({ type: String, default: null })
  avatar: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
