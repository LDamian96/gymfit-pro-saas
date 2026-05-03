import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMuscleGroupDto } from './dto/create-muscle-group.dto';
import { UpdateMuscleGroupDto } from './dto/update-muscle-group.dto';

@Injectable()
export class MuscleGroupsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.muscleGroup.findMany({
      where: { tenantId },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  }

  async create(dto: CreateMuscleGroupDto, tenantId: string) {
    // Nombre único por tenant.
    const existing = await this.prisma.muscleGroup.findFirst({
      where: { tenantId, name: dto.name },
    });
    if (existing) throw new ConflictException('Ya existe un grupo muscular con ese nombre');

    return this.prisma.muscleGroup.create({
      data: { ...dto, tenantId },
    });
  }

  async update(id: string, dto: UpdateMuscleGroupDto, tenantId: string) {
    const mg = await this.prisma.muscleGroup.findFirst({ where: { id, tenantId } });
    if (!mg) throw new NotFoundException('Grupo muscular no encontrado');

    if (dto.name && dto.name !== mg.name) {
      const dup = await this.prisma.muscleGroup.findFirst({
        where: { tenantId, name: dto.name, NOT: { id } },
      });
      if (dup) throw new ConflictException('Ya existe un grupo muscular con ese nombre');
    }

    return this.prisma.muscleGroup.update({ where: { id }, data: dto });
  }

  async remove(id: string, tenantId: string) {
    const mg = await this.prisma.muscleGroup.findFirst({ where: { id, tenantId } });
    if (!mg) throw new NotFoundException('Grupo muscular no encontrado');
    await this.prisma.muscleGroup.delete({ where: { id } });
    return null;
  }
}
