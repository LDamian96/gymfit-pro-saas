import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { BookClassDto } from './dto/book-class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/classes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  /** Listar clases con filtro opcional por día de la semana */
  @Get()
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('dayOfWeek') dayOfWeek?: string,
  ) {
    const day = dayOfWeek !== undefined ? parseInt(dayOfWeek, 10) : undefined;
    return this.classesService.findAll(tenantId, day);
  }

  /** Crear una clase (solo ADMIN) */
  @Post()
  @Roles('ADMIN')
  create(
    @Body() dto: CreateClassDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.classesService.create(dto, tenantId);
  }

  /** Actualizar una clase (solo ADMIN) */
  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.classesService.update(id, dto, tenantId);
  }

  /** Eliminar una clase (solo ADMIN) */
  @Delete(':id')
  @Roles('ADMIN')
  remove(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.classesService.remove(id, tenantId);
  }

  /** Reservar un lugar en una clase (solo CLIENT) */
  @Post(':id/book')
  @Roles('CLIENT')
  book(
    @Param('id') classId: string,
    @Body() dto: BookClassDto,
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.classesService.bookClass(classId, userId, tenantId, dto.date);
  }

  /** Cancelar una reserva (solo CLIENT) */
  @Delete(':id/book/:bookingId')
  @Roles('CLIENT')
  cancelBooking(
    @Param('id') classId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.classesService.cancelBooking(classId, bookingId, userId, tenantId);
  }
}
