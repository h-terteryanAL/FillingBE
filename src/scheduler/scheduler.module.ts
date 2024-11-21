import { CompanyModule } from '@/company/company.module';
import { MailModule } from '@/mail/mail.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [CompanyModule, MailModule],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule extends ScheduleModule {}
