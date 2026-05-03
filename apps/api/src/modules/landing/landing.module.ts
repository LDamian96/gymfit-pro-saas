import { Module } from '@nestjs/common';
import { LandingPublicController, LandingAdminController } from './landing.controller';
import { LandingService } from './landing.service';

@Module({
  controllers: [LandingPublicController, LandingAdminController],
  providers: [LandingService],
  exports: [LandingService],
})
export class LandingModule {}
