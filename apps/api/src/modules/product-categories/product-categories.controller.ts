import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProductCategoriesService } from './product-categories.service';
import type {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from './product-categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/product-categories')
export class ProductCategoriesController {
  constructor(private readonly categoriesService: ProductCategoriesService) {}

  // Público — usado por el landing por slug del tenant
  @Get('public/:slug')
  findPublic(@Param('slug') slug: string) {
    return this.categoriesService.findPublicBySlug(slug);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.categoriesService.findAll(tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() body: CreateProductCategoryDto, @CurrentUser('tenantId') tenantId: string) {
    return this.categoriesService.create(body, tenantId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() body: UpdateProductCategoryDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.categoriesService.update(id, body, tenantId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.categoriesService.remove(id, tenantId);
  }
}
