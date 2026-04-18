import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type LoginHistoryDocument = LoginHistory & Document;

@Schema({ collection: 'login_histories', timestamps: true })
export class LoginHistory {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: false })
  userId: MongooseSchema.Types.ObjectId; // Tham chiếu đến User (có thể null nếu user không tồn tại)

  @Prop()
  email?: string; // Email đăng nhập (lưu lại nếu user không tồn tại hoặc để tra cứu nhanh)

  @Prop({ required: true, default: () => new Date() })
  loginTime: Date; // Thời gian đăng nhập

  @Prop()
  logoutTime?: Date; // Thời gian đăng xuất

  @Prop()
  ipAddress: string; // Địa chỉ IP

  @Prop({ required: true, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' })
  status: string; // Trạng thái đăng nhập

  @Prop()
  failureReason?: string; // Lý do thất bại (nếu có)
}

export const LoginHistorySchema = SchemaFactory.createForClass(LoginHistory);
LoginHistorySchema.index({ userId: 1, loginTime: -1 });
