import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import type { CreateProductDto, UpdateProductDto } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Público — sin auth, usado por el landing
  @Get('public/:slug')
  findPublic(
    @Param('slug') slug: string,
    @Query('brand') brand?: string,
    @Query('category') category?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.findPublicBySlug(slug, {
      brand,
      category,
      q,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('category') category?: string,
    @Query('brand') brand?: string,
    @Query('onlyActive') onlyActive?: string,
  ) {
    return this.productsService.findAll(tenantId, {
      onlyActive: onlyActive === 'true',
      category,
      brand,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() body: CreateProductDto, @CurrentUser('tenantId') tenantId: string) {
    return this.productsService.create(body, tenantId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.productsService.update(id, body, tenantId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.productsService.remove(id, tenantId);
  }
}
