import { CompanyService } from '@/company/company.service';
import { MailService } from '@/mail/mail.service';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScheduleTimeENUM } from './constants';

@Injectable()
export class SchedulerService {
  constructor(
    private readonly companyService: CompanyService,
    private readonly mailService: MailService,
  ) {}

  @Cron(ScheduleTimeENUM.EVERY_DAY)
  async handleCron() {
    const [
      companiesWithSevenDayExpTime,
      companiesWithOneDayExpTime,
      companiesWhichExpired,
    ] = await Promise.all([
      this.companyService.findExpiringCompanies(7),
      this.companyService.findExpiringCompanies(1),
      this.companyService.findExpiringCompanies(),
    ]);
    if (companiesWithOneDayExpTime.length) {
      await this.mailService.alertUserOfExpiringCompany(
        companiesWithOneDayExpTime as any,
        1,
      );
    } else if (companiesWithSevenDayExpTime.length) {
      await this.mailService.alertUserOfExpiringCompany(
        companiesWithSevenDayExpTime as any,
        7,
      );
    } else if (companiesWhichExpired.length) {
      await this.mailService.notifyAdminAboutExpiredCompanies(
        companiesWhichExpired as any,
      );
    }
  }

  @Cron(ScheduleTimeENUM.EVERY_YEAR)
  async changeCompanyStatus() {
    await this.companyService.resetCompaniesStatus();
  }
}
