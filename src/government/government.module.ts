import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GovernmentController } from './government.controller';
import { GovernmentService } from './government.service';
import { CompanyModule } from '@/company/company.module';
import { HttpModule } from '@nestjs/axios';
import { AzureModule } from '@/azure/azure.module';
import { MailModule } from '@/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    forwardRef(() => CompanyModule),
    HttpModule,
    AzureModule,
    MailModule
  ],
  providers: [GovernmentService],
  exports: [GovernmentService],
  controllers: [GovernmentController],
})
export class GovernmentModule {}
