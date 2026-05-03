import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BrandsService } from './brands.service';
import type { CreateBrandDto, UpdateBrandDto } from './brands.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  // Público — usado por el landing por slug del tenant
  @Get('public/:slug')
  findPublic(@Param('slug') slug: string) {
    return this.brandsService.findPublicBySlug(slug);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.brandsService.findAll(tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() body: CreateBrandDto, @CurrentUser('tenantId') tenantId: string) {
    return this.brandsService.create(body, tenantId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() body: UpdateBrandDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.brandsService.update(id, body, tenantId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.brandsService.remove(id, tenantId);
  }
}
