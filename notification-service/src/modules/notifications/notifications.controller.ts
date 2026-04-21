import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Get all notifications for current reader (paginated)
  @Get()
  async getNotifications(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const readerId = req.user.readerId || req.user.id;
    return await this.notificationsService.getNotificationsByReader(
      readerId,
      parseInt(page),
      parseInt(limit),
    );
  }

  // Get unread notifications
  @Get('unread')
  async getUnreadNotifications(@Req() req: any) {
    const readerId = req.user.readerId || req.user.id;
    return await this.notificationsService.getUnreadNotifications(readerId);
  }

  // Get unread count
  @Get('unread/count')
  async getUnreadCount(@Req() req: any) {
    const readerId = req.user.readerId || req.user.id;
    const count = await this.notificationsService.getUnreadCount(readerId);
    return { unreadCount: count };
  }

  // Get notifications by type
  @Get('type/:notificationType')
  async getNotificationsByType(
    @Req() req: any,
    @Param('notificationType') notificationType: string,
  ) {
    const readerId = req.user.readerId || req.user.id;
    return await this.notificationsService.getNotificationsByType(
      readerId,
      notificationType,
    );
  }

  // Mark notification as read
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return await this.notificationsService.markAsRead(id);
  }

  // Mark all notifications as read
  @Patch('read-all')
  async markAllAsRead(@Req() req: any) {
    const readerId = req.user.readerId || req.user.id;
    return await this.notificationsService.markAllAsRead(readerId);
  }

  // Delete a notification
  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    return await this.notificationsService.delete(id);
  }

  // Delete all read notifications (cleanup)
  @Delete()
  async deleteReadNotifications(@Req() req: any) {
    const readerId = req.user.readerId || req.user.id;
    return await this.notificationsService.deleteReadNotifications(readerId);
  }
}
