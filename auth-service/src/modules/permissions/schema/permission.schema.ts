import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({ collection: 'permissions', timestamps: true })
export class Permission {
  @Prop({ required: true, unique: true })
  permissionId: string; // Q001, Q002, etc.

  @Prop({ required: true })
  permissionName: string; // Lập thẻ độc giả, Sửa thông tin độc giả, etc.

  @Prop()
  description: string; // Mô tả chi tiết quyền

  @Prop({
    required: true,
    enum: ['READER', 'BOOK', 'TRANSACTION', 'REPORT', 'SYSTEM'],
  })
  functionGroup: string; // Nhóm chức năng
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
