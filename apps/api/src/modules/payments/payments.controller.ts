import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles('ADMIN', 'RECEPTIONIST')
  create(
    @Body() dto: CreatePaymentDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.paymentsService.create(dto, tenantId, userId);
  }

  @Get()
  @Roles('ADMIN', 'RECEPTIONIST')
  findAll(
    @Query() query: QueryPaymentDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.paymentsService.findAll(tenantId, query);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'RECEPTIONIST')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.paymentsService.updateStatus(id, dto, tenantId);
  }
}
