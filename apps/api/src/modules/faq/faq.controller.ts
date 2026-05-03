import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/admin/faq')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Get()
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.faqService.findAll(tenantId);
  }

  @Post()
  create(@Body() dto: CreateFaqDto, @CurrentUser('tenantId') tenantId: string) {
    return this.faqService.create(dto, tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: CreateFaqDto, @CurrentUser('tenantId') tenantId: string) {
    return this.faqService.update(id, dto, tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.faqService.remove(id, tenantId);
  }
}
