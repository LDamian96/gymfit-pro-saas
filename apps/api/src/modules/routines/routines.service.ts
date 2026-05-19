import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoutineDto } from './dto/create-routine.dto';

@Injectable()
export class RoutinesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRoutineDto, trainerId: string, tenantId: string) {
    // Verificar que el miembro pertenece al tenant
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, tenantId },
    });
    if (!member) throw new NotFoundException('Miembro no encontrado');

    // Crear rutina con días y ejercicios en transacción
    return this.prisma.$transaction(async (tx) => {
      const routine = await tx.routine.create({
        data: {
          name: dto.name,
          description: dto.description,
          trainerId,
          memberId: dto.memberId,
          tenantId,
        },
      });

      // Crear días con ejercicios
      for (const day of dto.days) {
        const routineDay = await tx.routineDay.create({
          data: {
            routineId: routine.id,
            dayOfWeek: day.dayOfWeek,
          },
        });

        // Crear ejercicios del día
        if (day.exercises.length > 0) {
          await tx.routineExercise.createMany({
            data: day.exercises.map((ex, idx) => ({
              routineDayId: routineDay.id,
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              weight: ex.weight,
              restSeconds: ex.restSeconds,
              order: ex.order ?? idx,
              trainerNotes: ex.trainerNotes,
            })),
          });
        }
      }

      // Retornar la rutina completa dentro de la transacción
      return tx.routine.findFirst({
        where: { id: routine.id, tenantId },
        include: {
          trainer: { select: { firstName: true, lastName: true } },
          days: {
            orderBy: { dayOfWeek: 'asc' },
            include: {
              exercises: {
                orderBy: { order: 'asc' },
                include: { exercise: true },
              },
            },
          },
        },
      });
    });
  }

  async findByMember(memberId: string | undefined, tenantId: string, userId: string, role: string) {
    // Seguridad: si rol incluye CLIENT (y no es staff), forzar a sus propias rutinas.
    // Esto previene que un CLIENT vea rutinas de otros llamando sin memberId o con uno ajeno.
    const userRoles = (role || '').split(',').map((r) => r.trim());
    const isStaff = userRoles.some((r) => ['ADMIN', 'TRAINER', 'RECEPTIONIST'].includes(r));
    let effectiveMemberId = memberId;
    if (!isStaff && userRoles.includes('CLIENT')) {
      const member = await this.prisma.member.findFirst({
        where: { userId, tenantId },
        select: { id: true },
      });
      // Si no es miembro de este tenant, retornar vacío (no leak data).
      if (!member) return [];
      effectiveMemberId = member.id;
    }
    // Staff sin memberId obtiene vacío — no exponer todas las rutinas del tenant.
    if (!effectiveMemberId) return [];

    return this.prisma.routine.findMany({
      where: { memberId: effectiveMemberId, tenantId, isActive: true },
      include: {
        trainer: { select: { firstName: true, lastName: true } },
        days: {
          orderBy: { dayOfWeek: 'asc' },
          include: {
            exercises: {
              orderBy: { order: 'asc' },
              include: { exercise: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const routine = await this.prisma.routine.findFirst({
      where: { id, tenantId },
      include: {
        trainer: { select: { firstName: true, lastName: true } },
        member: { include: { user: { select: { firstName: true, lastName: true } } } },
        days: {
          orderBy: { dayOfWeek: 'asc' },
          include: {
            exercises: {
              orderBy: { order: 'asc' },
              include: { exercise: true },
            },
          },
        },
      },
    });
    if (!routine) throw new NotFoundException('Rutina no encontrada');
    return routine;
  }

  async update(id: string, dto: Partial<CreateRoutineDto>, tenantId: string) {
    const routine = await this.prisma.routine.findFirst({ where: { id, tenantId } });
    if (!routine) throw new NotFoundException('Rutina no encontrada');

    // Actualizar datos básicos
    await this.prisma.routine.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    // Si se envían días, reemplazar todos
    if (dto.days) {
      // Eliminar días existentes (cascade elimina ejercicios)
      await this.prisma.routineDay.deleteMany({ where: { routineId: id } });

      // Crear nuevos días
      for (const day of dto.days) {
        const routineDay = await this.prisma.routineDay.create({
          data: { routineId: id, dayOfWeek: day.dayOfWeek },
        });

        if (day.exercises.length > 0) {
          await this.prisma.routineExercise.createMany({
            data: day.exercises.map((ex, idx) => ({
              routineDayId: routineDay.id,
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              reps: ex.reps,
              weight: ex.weight,
              restSeconds: ex.restSeconds,
              order: ex.order ?? idx,
              trainerNotes: ex.trainerNotes,
            })),
          });
        }
      }
    }

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    const routine = await this.prisma.routine.findFirst({ where: { id, tenantId } });
    if (!routine) throw new NotFoundException('Rutina no encontrada');
    await this.prisma.routine.update({ where: { id }, data: { isActive: false } });
    return null;
  }
}
