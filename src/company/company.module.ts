import { AuthModule } from '@/auth/auth.module';
import { AuthService } from '@/auth/auth.service';
import { CompanyFormModule } from '@/company-form/company-form.module';
import { CsvDataModule } from '@/csv-data/csv-data.module';
import { MailModule } from '@/mail/mail.module';
import { ParticipantFormModule } from '@/participant-form/participant-form.module';
import { TransactionModule } from '@/transaction/transaction.module';
import { UserModule } from '@/user/user.module';
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { Company, CompanySchema } from './schemas/company.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
    forwardRef(() => CompanyFormModule),
    ParticipantFormModule,
    MailModule,
    forwardRef(() => UserModule),
    forwardRef(() => AuthModule),
    forwardRef(() => TransactionModule),
    forwardRef(() => CsvDataModule),
  ],
  providers: [AuthService, CompanyService],
  controllers: [CompanyController],
  exports: [CompanyService],
})
export class CompanyModule {}
