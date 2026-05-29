import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Construye el filtro segun rol:
  // - ADMIN ve TODAS las notificaciones del tenant (las dirigidas a el por userId + las tenant-wide).
  // - TRAINER/RECEP/CLIENT solo ven las dirigidas a su userId.
  private buildScope(tenantId: string, userId: string, role: string): Record<string, unknown> {
    if (role === 'ADMIN') {
      return {
        tenantId,
        OR: [{ userId: null }, { userId }],
      };
    }
    return { tenantId, userId };
  }

  // Lista las notificaciones del usuario (segun su rol).
  async findAll(tenantId: string, userId: string, role: string, onlyUnread = false, limit = 50) {
    const where: Record<string, unknown> = this.buildScope(tenantId, userId, role);
    if (onlyUnread) where.readAt = null;
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, Math.max(1, limit)),
    });
  }

  async unreadCount(tenantId: string, userId: string, role: string) {
    const where: Record<string, unknown> = { ...this.buildScope(tenantId, userId, role), readAt: null };
    const count = await this.prisma.notification.count({ where });
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

  async markAllAsRead(tenantId: string, userId: string, role: string) {
    await this.prisma.notification.updateMany({
      where: { ...this.buildScope(tenantId, userId, role), readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }
}
