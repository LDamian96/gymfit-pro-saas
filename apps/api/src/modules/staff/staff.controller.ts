import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @Roles('ADMIN')
  create(
    @Body() dto: CreateStaffDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.staffService.create(dto, tenantId);
  }

  @Get()
  @Roles('ADMIN')
  findAll(
    @Query() query: QueryStaffDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.staffService.findAll(tenantId, query);
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.staffService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.staffService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.staffService.remove(id, tenantId);
  }
}
