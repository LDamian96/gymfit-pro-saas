import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/exercises')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get()
  @Roles('ADMIN', 'TRAINER')
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('muscleGroup') muscleGroup?: string,
  ) {
    return this.exercisesService.findAll(tenantId, muscleGroup);
  }

  @Post()
  @Roles('ADMIN', 'TRAINER')
  create(
    @Body() body: { name: string; muscleGroup?: string; equipment?: string; description?: string; imageUrl?: string; videoUrl?: string },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.exercisesService.create(body, tenantId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'TRAINER')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; muscleGroup?: string; equipment?: string; description?: string; imageUrl?: string; videoUrl?: string },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.exercisesService.update(id, body, tenantId);
  }

  @Delete(':id')
  @Roles('ADMIN', 'TRAINER')
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.exercisesService.remove(id, tenantId);
  }
}
