import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RoutinesService } from './routines.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/routines')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  @Roles('ADMIN', 'TRAINER')
  create(
    @Body() dto: CreateRoutineDto,
    @CurrentUser('userId') trainerId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.routinesService.create(dto, trainerId, tenantId);
  }

  @Get()
  @Roles('ADMIN', 'TRAINER', 'CLIENT')
  findByMember(
    @Query('memberId') memberId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.routinesService.findByMember(memberId, tenantId);
  }

  @Get(':id')
  @Roles('ADMIN', 'TRAINER', 'CLIENT')
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.routinesService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'TRAINER')
  update(
    @Param('id') id: string,
    @Body() dto: CreateRoutineDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.routinesService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles('ADMIN', 'TRAINER')
  remove(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.routinesService.remove(id, tenantId);
  }
}
