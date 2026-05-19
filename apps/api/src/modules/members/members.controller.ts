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
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMemberDto } from './dto/query-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @Roles('ADMIN', 'RECEPTIONIST', 'TRAINER')
  create(
    @Body() dto: CreateMemberDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.membersService.create(dto, tenantId, userId, role);
  }

  // Matricular / renovar plan al miembro. Vincula fechas + frecuencia del plan.
  @Post(':id/activate-plan')
  @Roles('ADMIN', 'RECEPTIONIST', 'TRAINER')
  activatePlan(
    @Param('id') id: string,
    @Body() body: { planId: string },
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.membersService.activatePlan(id, body.planId, tenantId);
  }

  @Get()
  @Roles('ADMIN', 'RECEPTIONIST', 'TRAINER')
  findAll(
    @Query() query: QueryMemberDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.membersService.findAll(tenantId, query, userId, role);
  }

  @Get(':id')
  @Roles('ADMIN', 'RECEPTIONIST', 'TRAINER', 'CLIENT')
  findOne(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.membersService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.membersService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(
    @Param('id') id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.membersService.remove(id, tenantId);
  }
}
