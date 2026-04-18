import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ collection: 'audit_logs', timestamps: true })
export class AuditLog {
  @Prop({ required: true })
  userId: MongooseSchema.Types.ObjectId; // Tham chiếu đến User

  @Prop({ required: true, enum: ['INSERT', 'UPDATE', 'DELETE'] })
  action: string; // Hành động

  @Prop({ required: true })
  tableName: string; // Tên bảng/collection bị ảnh hưởng

  @Prop()
  recordId?: string; // ID của bản ghi bị ảnh hưởng

  @Prop()
  description: string; // Mô tả thay đổi

  @Prop({ type: Object })
  oldValues?: Record<string, any>; // Giá trị cũ (cho UPDATE)

  @Prop({ type: Object })
  newValues?: Record<string, any>; // Giá trị mới (cho INSERT/UPDATE)

  @Prop({ required: true, default: () => new Date() })
  timestamp: Date; // Thời gian hành động
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ tableName: 1, timestamp: -1 });
