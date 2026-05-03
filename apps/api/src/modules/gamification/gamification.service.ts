import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGamificationDto } from './dto/create-gamification.dto';
import { UpdateGamificationDto } from './dto/update-gamification.dto';

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista todas las gamificaciones activas de un tenant.
   */
  async findAll(tenantId: string) {
    const gamifications = await this.prisma.gamification.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: gamifications };
  }

  /**
   * Crea una nueva gamificación para el tenant.
   */
  async create(dto: CreateGamificationDto, tenantId: string) {
    const gamification = await this.prisma.gamification.create({
      data: {
        name: dto.name,
        type: dto.type,
        description: dto.description,
        iconUrl: dto.iconUrl,
        points: dto.points,
        condition: dto.condition ? JSON.parse(JSON.stringify(dto.condition)) : undefined,
        tenantId,
      },
    });

    return { success: true, data: gamification, message: 'Gamificación creada exitosamente' };
  }

  /**
   * Busca una gamificación por ID y tenant. Lanza excepción si no existe.
   */
  async findOne(id: string, tenantId: string) {
    const gamification = await this.prisma.gamification.findFirst({
      where: { id, tenantId, isActive: true },
    });

    if (!gamification) {
      throw new NotFoundException('Gamificación no encontrada');
    }

    return gamification;
  }

  /**
   * Actualiza una gamificación existente.
   */
  async update(id: string, dto: UpdateGamificationDto, tenantId: string) {
    await this.findOne(id, tenantId);

    const gamification = await this.prisma.gamification.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        description: dto.description,
        iconUrl: dto.iconUrl,
        points: dto.points,
        condition: dto.condition ? JSON.parse(JSON.stringify(dto.condition)) : undefined,
      },
    });

    return { success: true, data: gamification, message: 'Gamificación actualizada exitosamente' };
  }

  /**
   * Soft delete: desactiva la gamificación (isActive = false).
   */
  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    await this.prisma.gamification.update({
      where: { id },
      data: { isActive: false },
    });

    return { success: true, data: null, message: 'Gamificación eliminada exitosamente' };
  }

  /**
   * Obtiene todos los logros (achievements) de un miembro en un tenant.
   */
  async getMemberAchievements(memberId: string, tenantId: string) {
    // Verificar que el miembro pertenece al tenant
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!member) {
      throw new NotFoundException('Miembro no encontrado en este gimnasio');
    }

    const achievements = await this.prisma.memberAchievement.findMany({
      where: { memberId, tenantId },
      include: {
        gamification: {
          select: { id: true, name: true, type: true, description: true, iconUrl: true, points: true },
        },
      },
      orderBy: { achievedAt: 'desc' },
    });

    return { success: true, data: achievements };
  }
}
