import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post()
  @Roles('ADMIN', 'TRAINER', 'CLIENT')
  create(
    @Body() dto: CreateProgressDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.progressService.create(dto, tenantId, userId);
  }

  @Get(':memberId')
  @Roles('ADMIN', 'TRAINER', 'CLIENT')
  findByMember(
    @Param('memberId') memberId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.progressService.findByMember(memberId, tenantId);
  }

  @Delete(':id')
  @Roles('ADMIN', 'TRAINER')
  remove(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.progressService.remove(id, tenantId);
  }
}
