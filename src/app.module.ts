import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { AzureController } from './azure/azure.controller';
import { AzureModule } from './azure/azure.module';
import { CompanyFormModule } from './company-form/company-form.module';
import { CompanyModule } from './company/company.module';
import configs from './config';
import { CsvDataController } from './csv-data/csv-data.controller';
import { CsvDataModule } from './csv-data/csv-data.module';
import { GovernmentModule } from './government/government.module';
import { MailModule } from './mail/mail.module';
import { ParticipantFormModule } from './participant-form/participant-form.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SchedulerService } from './scheduler/scheduler.service';
import { SeederService } from './seeders/admin/admin-seeder.service';
import { TransactionModule } from './transaction/transaction.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.local',
      load: [configs],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URL'),
      }),
      inject: [ConfigService],
    }),
    UserModule,
    CompanyFormModule,
    CompanyModule,
    ParticipantFormModule,
    AuthModule,
    MailModule,
    SchedulerModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 20 * 60_000,
        limit: 1000,
      },
    ]),
    GovernmentModule,
    TransactionModule,
    AzureModule,
    CsvDataModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    SeederService,
    SchedulerService,
  ],
  controllers: [AzureController, CsvDataController],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly seederService: SeederService) {}

  async onModuleInit() {
    await this.seederService.seed();
  }
}
