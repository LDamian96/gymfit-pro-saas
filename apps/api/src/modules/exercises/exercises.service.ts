import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, muscleGroup?: string) {
    const where: Record<string, unknown> = {
      OR: [{ tenantId }, { tenantId: null }],
    };
    if (muscleGroup) where.muscleGroup = muscleGroup;

    return this.prisma.exercise.findMany({
      where,
      orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
    });
  }

  async create(data: { name: string; muscleGroup?: string; equipment?: string; description?: string; imageUrl?: string; videoUrl?: string }, tenantId: string) {
    return this.prisma.exercise.create({
      data: { ...data, tenantId },
    });
  }

  async update(id: string, data: { name?: string; muscleGroup?: string; equipment?: string; description?: string; imageUrl?: string; videoUrl?: string }, tenantId: string) {
    const ex = await this.prisma.exercise.findFirst({ where: { id, OR: [{ tenantId }, { tenantId: null }] } });
    if (!ex) throw new NotFoundException('Ejercicio no encontrado');
    return this.prisma.exercise.update({ where: { id }, data });
  }

  async remove(id: string, tenantId: string) {
    const ex = await this.prisma.exercise.findFirst({ where: { id, tenantId } });
    if (!ex) throw new NotFoundException('Ejercicio no encontrado');
    await this.prisma.exercise.delete({ where: { id } });
    return null;
  }
}
