import { Module } from '@nestjs/common';
import { MuscleGroupsController } from './muscle-groups.controller';
import { MuscleGroupsService } from './muscle-groups.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MuscleGroupsController],
  providers: [MuscleGroupsService],
})
export class MuscleGroupsModule {}
