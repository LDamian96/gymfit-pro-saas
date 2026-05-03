import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { CreateGamificationDto } from './dto/create-gamification.dto';
import { UpdateGamificationDto } from './dto/update-gamification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/gamification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get()
  @Roles('ADMIN')
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.gamificationService.findAll(tenantId);
  }

  @Post()
  @Roles('ADMIN')
  create(
    @Body() dto: CreateGamificationDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.gamificationService.create(dto, tenantId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGamificationDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.gamificationService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.gamificationService.remove(id, tenantId);
  }

  @Get('member/:memberId')
  getMemberAchievements(
    @Param('memberId') memberId: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.gamificationService.getMemberAchievements(memberId, tenantId);
  }
}
