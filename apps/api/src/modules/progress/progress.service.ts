import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProgressDto } from './dto/create-progress.dto';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo registro de progreso para un miembro.
   * Verifica que el miembro pertenezca al tenant.
   */
  async create(dto: CreateProgressDto, tenantId: string, createdById?: string) {
    // Verificar que el miembro pertenece al tenant
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, tenantId },
    });

    if (!member) {
      throw new NotFoundException('Miembro no encontrado en este gimnasio');
    }

    const progress = await this.prisma.progress.create({
      data: {
        memberId: dto.memberId,
        tenantId,
        date: dto.date ? new Date(dto.date) : new Date(),
        weight: dto.weight,
        waist: dto.waist,
        chest: dto.chest,
        arms: dto.arms,
        legs: dto.legs,
        hips: dto.hips,
        bodyFat: dto.bodyFat,
        muscleMass: dto.muscleMass,
        photoUrl: dto.photoUrl,
        notes: dto.notes,
        createdById,
      },
      include: {
        member: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    return { success: true, data: progress, message: 'Progreso registrado exitosamente' };
  }

  /**
   * Obtiene todos los registros de progreso de un miembro, ordenados por fecha descendente.
   */
  async findByMember(memberId: string, tenantId: string) {
    // Verificar que el miembro pertenece al tenant
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId },
    });

    if (!member) {
      throw new NotFoundException('Miembro no encontrado en este gimnasio');
    }

    const records = await this.prisma.progress.findMany({
      where: { memberId, tenantId },
      orderBy: { date: 'desc' },
    });

    return { success: true, data: records };
  }

  async remove(id: string, tenantId: string) {
    const record = await this.prisma.progress.findFirst({
      where: { id, tenantId },
    });
    if (!record) throw new NotFoundException('Registro no encontrado');
    await this.prisma.progress.delete({ where: { id } });
    return { success: true, message: 'Registro eliminado' };
  }
}
