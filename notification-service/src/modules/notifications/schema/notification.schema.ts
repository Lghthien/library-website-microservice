import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ collection: 'notifications', timestamps: true })
export class Notification {
  @Prop({ required: true, enum: ['QUA_HAN', 'SAP_HET_HAN_THE', 'CO_NO'] })
  notificationType: string; // Loại thông báo

  @Prop({ required: true })
  readerId: MongooseSchema.Types.ObjectId; // Tham chiếu đến Reader

  @Prop({ required: true })
  title: string; // Tiêu đề thông báo

  @Prop({ required: true })
  content: string; // Nội dung thông báo

  @Prop({ required: true, default: () => new Date() })
  createdAt: Date; // Thời gian tạo

  @Prop({ default: false })
  isRead: boolean; // Đã đọc hay chưa

  @Prop()
  readAt?: Date; // Thời gian đọc
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ readerId: 1, isRead: 1 });
NotificationSchema.index({ readerId: 1, createdAt: -1 });
