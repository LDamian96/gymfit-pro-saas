import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MembersModule } from './modules/members/members.module';
import { StaffModule } from './modules/staff/staff.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { BranchesModule } from './modules/branches/branches.module';
import { RoutinesModule } from './modules/routines/routines.module';
import { ClassesModule } from './modules/classes/classes.module';
import { CheckinModule } from './modules/checkin/checkin.module';
import { ProgressModule } from './modules/progress/progress.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { LandingModule } from './modules/landing/landing.module';
import { FaqModule } from './modules/faq/faq.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UploadModule } from './modules/upload/upload.module';
import { MercadoPagoModule } from './modules/mercadopago/mercadopago.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { MuscleGroupsModule } from './modules/muscle-groups/muscle-groups.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProductsModule } from './modules/products/products.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ProductCategoriesModule } from './modules/product-categories/product-categories.module';
import { SalesModule } from './modules/sales/sales.module';
import { TenantSettingsModule } from './modules/tenant-settings/tenant-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    AuthModule,
    MembersModule,
    StaffModule,
    PaymentsModule,
    BranchesModule,
    RoutinesModule,
    ClassesModule,
    CheckinModule,
    ProgressModule,
    GamificationModule,
    LandingModule,
    FaqModule,
    DashboardModule,
    UploadModule,
    MercadoPagoModule,
    ExercisesModule,
    MuscleGroupsModule,
    NotificationsModule,
    ProductsModule,
    BrandsModule,
    ProductCategoriesModule,
    SalesModule,
    TenantSettingsModule,
  ],
})
export class AppModule {}
