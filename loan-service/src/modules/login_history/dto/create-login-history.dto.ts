import { Types } from 'mongoose';

export class CreateLoginHistoryDto {
  userId: Types.ObjectId;
  ipAddress: string;
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string;
}
