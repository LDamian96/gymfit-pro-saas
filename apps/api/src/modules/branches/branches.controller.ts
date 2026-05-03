import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { TransferStaffDto } from './dto/transfer-staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/branches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  create(@Body() dto: CreateBranchDto, @CurrentUser('tenantId') tenantId: string) {
    return this.branchesService.create(dto, tenantId);
  }

  @Get()
  findAll(@CurrentUser('tenantId') tenantId: string) {
    return this.branchesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.branchesService.findOne(id, tenantId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto, @CurrentUser('tenantId') tenantId: string) {
    return this.branchesService.update(id, dto, tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
    return this.branchesService.remove(id, tenantId);
  }

  @Post('transfer')
  transferStaff(@Body() dto: TransferStaffDto, @CurrentUser('tenantId') tenantId: string) {
    return this.branchesService.transferStaff(dto, tenantId);
  }
}
