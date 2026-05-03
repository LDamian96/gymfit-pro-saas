import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MuscleGroupsService } from './muscle-groups.service';
import { CreateMuscleGroupDto } from './dto/create-muscle-group.dto';
import { UpdateMuscleGroupDto } from './dto/update-muscle-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/muscle-groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MuscleGroupsController {
  constructor(private readonly service: MuscleGroupsService) {}

  // Lectura abierta a quien pueda crear/editar ejercicios.
  @Get()
  @Roles('ADMIN', 'TRAINER')
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.service.findAll(tenantId);
  }

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateMuscleGroupDto, @CurrentUser('tenantId') tenantId: string) {
    return this.service.create(dto, tenantId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMuscleGroupDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.service.remove(id, tenantId);
  }
}
