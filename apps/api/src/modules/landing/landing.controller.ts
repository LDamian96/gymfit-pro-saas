import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { LandingService } from './landing.service';
import { UpdateLandingDto } from './dto/update-landing.dto';
import { CreateLandingServiceDto } from './dto/create-service.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// ========================
// RUTAS PÚBLICAS (landing por slug)
// ========================
@Controller('api/v1/landing')
export class LandingPublicController {
  constructor(private readonly landingService: LandingService) {}

  @Get(':slug')
  getPublicLanding(@Param('slug') slug: string) {
    return this.landingService.getPublicLanding(slug);
  }
}

// ========================
// RUTAS ADMIN (gestión del landing)
// ========================
@Controller('api/v1/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class LandingAdminController {
  constructor(private readonly landingService: LandingService) {}

  // --- Landing Content ---
  @Get('landing')
  getLandingContent(@CurrentUser('tenantId') tenantId: string) {
    return this.landingService.getLandingContent(tenantId);
  }

  @Patch('landing')
  updateLandingContent(@Body() dto: UpdateLandingDto, @CurrentUser('tenantId') tenantId: string) {
    return this.landingService.updateLandingContent(tenantId, dto);
  }

  // --- Servicios ---
  @Get('services')
  getServices(@CurrentUser('tenantId') tenantId: string) {
    return this.landingService.getServices(tenantId);
  }

  @Post('services')
  createService(@Body() dto: CreateLandingServiceDto, @CurrentUser('tenantId') tenantId: string) {
    return this.landingService.createService(dto, tenantId);
  }

  @Patch('services/:id')
  updateService(@Param('id') id: string, @Body() dto: CreateLandingServiceDto, @CurrentUser('tenantId') tenantId: string) {
    return this.landingService.updateService(id, dto, tenantId);
  }

  @Delete('services/:id')
  deleteService(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.landingService.deleteService(id, tenantId);
  }

  // --- Planes ---
  @Get('plans')
  getPlans(@CurrentUser('tenantId') tenantId: string) {
    return this.landingService.getPlans(tenantId);
  }

  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto, @CurrentUser('tenantId') tenantId: string) {
    return this.landingService.createPlan(dto, tenantId);
  }

  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: CreatePlanDto, @CurrentUser('tenantId') tenantId: string) {
    return this.landingService.updatePlan(id, dto, tenantId);
  }

  @Delete('plans/:id')
  deletePlan(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.landingService.deletePlan(id, tenantId);
  }

  // --- Instalaciones ---
  @Get('facilities')
  getFacilities(@CurrentUser('tenantId') tenantId: string) {
    return this.landingService.getFacilities(tenantId);
  }

  @Post('facilities')
  createFacility(@Body() dto: CreateFacilityDto, @CurrentUser('tenantId') tenantId: string) {
    return this.landingService.createFacility(dto, tenantId);
  }

  @Patch('facilities/:id')
  updateFacility(@Param('id') id: string, @Body() dto: CreateFacilityDto, @CurrentUser('tenantId') tenantId: string) {
    return this.landingService.updateFacility(id, dto, tenantId);
  }

  @Delete('facilities/:id')
  deleteFacility(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.landingService.deleteFacility(id, tenantId);
  }
}
