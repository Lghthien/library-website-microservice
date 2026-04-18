import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schema/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  // Create a notification
  async create(
    readerId: string,
    notificationType: string,
    title: string,
    content: string,
  ) {
    const notification = new this.notificationModel({
      readerId,
      notificationType,
      title,
      content,
      isRead: false,
    });
    return await notification.save();
  }

  // Get all unread notifications for a reader
  async getUnreadNotifications(readerId: string) {
    return await this.notificationModel
      .find({ readerId: readerId as unknown as any, isRead: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  // Get all notifications for a reader (paginated)
  async getNotificationsByReader(
    readerId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const skip = (page - 1) * limit;
    const total = await this.notificationModel.countDocuments({
      readerId: readerId as unknown as any,
    });
    const notifications = await this.notificationModel
      .find({ readerId: readerId as unknown as any })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get unread count
  async getUnreadCount(readerId: string) {
    return await this.notificationModel.countDocuments({
      readerId: readerId as unknown as any,
      isRead: false,
    });
  }

  // Mark as read
  async markAsRead(notificationId: string) {
    return await this.notificationModel
      .findByIdAndUpdate(
        notificationId,
        { isRead: true, readAt: new Date() },
        { new: true },
      )
      .exec();
  }

  // Mark all as read for a reader
  async markAllAsRead(readerId: string) {
    return await this.notificationModel
      .updateMany(
        { readerId: readerId as unknown as any, isRead: false },
        { isRead: true, readAt: new Date() },
      )
      .exec();
  }

  // Delete a notification
  async delete(notificationId: string) {
    return await this.notificationModel
      .findByIdAndDelete(notificationId)
      .exec();
  }

  // Delete all read notifications for a reader (cleanup)
  async deleteReadNotifications(readerId: string) {
    return await this.notificationModel
      .deleteMany({ readerId: readerId as unknown as any, isRead: true })
      .exec();
  }

  // Create fine reminder notifications (called by system)
  async createFineNotifications(
    readerId: string,
    fineAmount: number,
    overdueDays: number,
  ) {
    const title = `⚠️ Thông báo phạt quá hạn`;
    const content = `Bạn có khoản phạt ${fineAmount.toLocaleString('vi-VN')} VND do trả sách trễ ${overdueDays} ngày.`;
    return await this.create(readerId, 'CO_NO', title, content);
  }

  // Create card expiry warning (called by system)
  async createCardExpiryNotification(
    readerId: string,
    daysUntilExpiry: number,
  ) {
    const title = `📌 Thẻ độc giả sắp hết hạn`;
    const content = `Thẻ độc giả của bạn sẽ hết hạn trong ${daysUntilExpiry} ngày. Vui lòng liên hệ thư viện để gia hạn.`;
    return await this.create(readerId, 'SAP_HET_HAN_THE', title, content);
  }

  // Create overdue book warning (called by system)
  async createOverdueBooksNotification(
    readerId: string,
    bookCount: number,
    overdueDays: number,
  ) {
    const title = `📚 Sách quá hạn`;
    const content = `Bạn đang có ${bookCount} quyển sách quá hạn trả ${overdueDays} ngày.`;
    return await this.create(readerId, 'QUA_HAN', title, content);
  }

  // Get notifications by type
  async getNotificationsByType(readerId: string, notificationType: string) {
    return await this.notificationModel
      .find({ readerId: readerId as unknown as any, notificationType })
      .sort({ createdAt: -1 })
      .exec();
  }
}
