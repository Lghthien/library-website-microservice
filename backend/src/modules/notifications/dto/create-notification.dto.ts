import { Types } from 'mongoose';

export class CreateNotificationDto {
  notificationType: 'QUA_HAN' | 'SAP_HET_HAN_THE' | 'CO_NO';
  readerId: Types.ObjectId;
  title: string;
  content: string;
}
