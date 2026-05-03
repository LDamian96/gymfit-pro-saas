import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Lista las notificaciones del tenant. Por defecto últimas 50, ordenadas
  // por creación descendente. El admin las consume para enterarse de eventos
  // como cross-branch check-ins.
  async findAll(tenantId: string, onlyUnread = false, limit = 50) {
    const where: Record<string, unknown> = { tenantId };
    if (onlyUnread) where.readAt = null;
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, Math.max(1, limit)),
    });
  }

  async unreadCount(tenantId: string) {
    const count = await this.prisma.notification.count({
      where: { tenantId, readAt: null },
    });
    return { count };
  }

  async markAsRead(id: string, tenantId: string) {
    const notif = await this.prisma.notification.findFirst({ where: { id, tenantId } });
    if (!notif) throw new NotFoundException('Notificación no encontrada');
    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(tenantId: string) {
    await this.prisma.notification.updateMany({
      where: { tenantId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }
}
