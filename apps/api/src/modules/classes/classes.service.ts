import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  /** Crear una clase */
  async create(dto: CreateClassDto, tenantId: string) {
    // Verificar que el instructor existe y pertenece al tenant
    const instructor = await this.prisma.user.findFirst({
      where: { id: dto.instructorId, tenantId, deletedAt: null },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor no encontrado en este gimnasio');
    }

    const gymClass = await this.prisma.class.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        maxCapacity: dto.maxCapacity,
        instructorId: dto.instructorId,
        branchId: dto.branchId,
        tenantId,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        branch: {
          select: { id: true, name: true },
        },
        _count: { select: { bookings: true } },
      },
    });

    return this.formatClass(gymClass);
  }

  /** Listar clases del tenant con filtro opcional por día */
  async findAll(tenantId: string, dayOfWeek?: number, branchId?: string) {
    const where: Record<string, unknown> = {
      tenantId,
      isActive: true,
    };

    if (dayOfWeek !== undefined) {
      where.dayOfWeek = dayOfWeek;
    }
    if (branchId) {
      where.branchId = branchId;
    }

    const classes = await this.prisma.class.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        branch: {
          select: { id: true, name: true },
        },
        _count: { select: { bookings: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    return classes.map((c) => this.formatClass(c));
  }

  /** Obtener una clase por ID */
  async findOne(id: string, tenantId: string) {
    const gymClass = await this.prisma.class.findFirst({
      where: { id, tenantId },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        branch: {
          select: { id: true, name: true },
        },
        _count: { select: { bookings: true } },
      },
    });

    if (!gymClass) {
      throw new NotFoundException('Clase no encontrada');
    }

    return this.formatClass(gymClass);
  }

  /** Actualizar una clase */
  async update(id: string, dto: UpdateClassDto, tenantId: string) {
    const existing = await this.prisma.class.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Clase no encontrada');
    }

    // Si se cambia el instructor, verificar que existe en el tenant
    if (dto.instructorId) {
      const instructor = await this.prisma.user.findFirst({
        where: { id: dto.instructorId, tenantId, deletedAt: null },
      });
      if (!instructor) {
        throw new NotFoundException('Instructor no encontrado en este gimnasio');
      }
    }

    const updated = await this.prisma.class.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.dayOfWeek !== undefined && { dayOfWeek: dto.dayOfWeek }),
        ...(dto.startTime !== undefined && { startTime: dto.startTime }),
        ...(dto.endTime !== undefined && { endTime: dto.endTime }),
        ...(dto.maxCapacity !== undefined && { maxCapacity: dto.maxCapacity }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.instructorId !== undefined && { instructorId: dto.instructorId }),
        ...(dto.branchId !== undefined && { branchId: dto.branchId }),
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        branch: {
          select: { id: true, name: true },
        },
        _count: { select: { bookings: true } },
      },
    });

    return this.formatClass(updated);
  }

  /** Eliminar (soft delete) una clase */
  async remove(id: string, tenantId: string) {
    const existing = await this.prisma.class.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Clase no encontrada');
    }

    await this.prisma.class.update({
      where: { id },
      data: { isActive: false },
    });

    return null;
  }

  /** Reservar un lugar en una clase */
  async bookClass(classId: string, userId: string, tenantId: string, date: string) {
    // Verificar que la clase existe y está activa
    const gymClass = await this.prisma.class.findFirst({
      where: { id: classId, tenantId, isActive: true },
      include: { _count: { select: { bookings: true } } },
    });

    if (!gymClass) {
      throw new NotFoundException('Clase no encontrada o no está activa');
    }

    // Obtener el miembro asociado al usuario
    const member = await this.prisma.member.findFirst({
      where: { userId, tenantId, isActive: true },
    });

    if (!member) {
      throw new NotFoundException('No se encontró un miembro activo para este usuario');
    }

    // Verificar capacidad disponible contando solo reservas activas para esa fecha
    const bookingDate = new Date(date);
    const activeBookings = await this.prisma.classBooking.count({
      where: {
        classId,
        date: bookingDate,
        status: 'BOOKED',
      },
    });

    if (activeBookings >= gymClass.maxCapacity) {
      throw new BadRequestException('La clase está llena para esta fecha');
    }

    // Verificar que el miembro no tenga ya una reserva activa para esta clase y fecha
    const existingBooking = await this.prisma.classBooking.findFirst({
      where: {
        classId,
        memberId: member.id,
        date: bookingDate,
        status: 'BOOKED',
      },
    });

    if (existingBooking) {
      throw new BadRequestException('Ya tienes una reserva activa para esta clase en esta fecha');
    }

    const booking = await this.prisma.classBooking.create({
      data: {
        classId,
        memberId: member.id,
        date: bookingDate,
        status: 'BOOKED',
      },
      include: {
        class: {
          select: { id: true, name: true, startTime: true, endTime: true },
        },
      },
    });

    return {
      id: booking.id,
      date: booking.date,
      status: booking.status,
      createdAt: booking.createdAt,
      class: booking.class,
    };
  }

  /** Cancelar una reserva */
  async cancelBooking(classId: string, bookingId: string, userId: string, tenantId: string) {
    // Verificar que la clase pertenece al tenant
    const gymClass = await this.prisma.class.findFirst({
      where: { id: classId, tenantId },
    });

    if (!gymClass) {
      throw new NotFoundException('Clase no encontrada');
    }

    // Obtener el miembro
    const member = await this.prisma.member.findFirst({
      where: { userId, tenantId },
    });

    if (!member) {
      throw new NotFoundException('Miembro no encontrado');
    }

    // Verificar que la reserva existe y pertenece al miembro
    const booking = await this.prisma.classBooking.findFirst({
      where: {
        id: bookingId,
        classId,
        memberId: member.id,
        status: 'BOOKED',
      },
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada o ya fue cancelada');
    }

    await this.prisma.classBooking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    return null;
  }

  /** Formato estándar de respuesta para una clase */
  private formatClass(gymClass: Record<string, unknown>) {
    const count = gymClass._count as { bookings: number };
    const instructor = gymClass.instructor as Record<string, unknown> | null;
    const branch = gymClass.branch as Record<string, unknown> | null;

    return {
      id: gymClass.id,
      name: gymClass.name,
      description: gymClass.description,
      imageUrl: gymClass.imageUrl,
      dayOfWeek: gymClass.dayOfWeek,
      startTime: gymClass.startTime,
      endTime: gymClass.endTime,
      maxCapacity: gymClass.maxCapacity,
      isActive: gymClass.isActive,
      currentBookings: count.bookings,
      instructor: instructor
        ? {
            id: instructor.id,
            firstName: instructor.firstName,
            lastName: instructor.lastName,
            avatar: instructor.avatar,
          }
        : null,
      branch: branch
        ? {
            id: branch.id,
            name: branch.name,
          }
        : null,
      createdAt: gymClass.createdAt,
      updatedAt: gymClass.updatedAt,
    };
  }
}
