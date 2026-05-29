import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'TRAINER', 'RECEPTIONIST', 'CLIENT')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Query('unread') unread?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll(
      tenantId,
      userId,
      role,
      unread === 'true',
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('unread-count')
  unreadCount(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.unreadCount(tenantId, userId, role);
  }

  @Patch('read-all')
  markAllAsRead(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.markAllAsRead(tenantId, userId, role);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.markAsRead(id, tenantId);
  }
}
