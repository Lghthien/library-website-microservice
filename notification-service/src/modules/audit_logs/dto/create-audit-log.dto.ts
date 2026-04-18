import { Types } from 'mongoose';

export class CreateAuditLogDto {
  userId: Types.ObjectId;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  tableName: string;
  recordId?: string;
  description: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}
