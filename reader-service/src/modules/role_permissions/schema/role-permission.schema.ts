import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RolePermissionDocument = RolePermission & Document;

@Schema({ collection: 'role_permissions', timestamps: true })
export class RolePermission {
  @Prop({ required: true, enum: ['ADMIN', 'LIBRARIAN'] })
  role: string; // Vai trò

  @Prop({ required: true })
  permissionId: string; // Tham chiếu đến Permission.permissionId
}

export const RolePermissionSchema =
  SchemaFactory.createForClass(RolePermission);
RolePermissionSchema.index({ role: 1, permissionId: 1 }, { unique: true });
