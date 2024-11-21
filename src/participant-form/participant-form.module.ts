import { ApplicantFormController } from './applicant-form.controller';
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ApplicantForm,
  ApplicantFormSchema,
  OwnerFormSchema,
  OwnerForm,
} from './schemas/participant-form.schema';
import { ParticipantFormService } from './participant-form.service';
import { OwnerFormController } from './owner-form.controller';
import { CompanyModule } from '@/company/company.module';
import { GovernmentModule } from '@/government/government.module';
import { AzureModule } from '@/azure/azure.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OwnerForm.name, schema: OwnerFormSchema },
    ]),
    MongooseModule.forFeature([
      { name: ApplicantForm.name, schema: ApplicantFormSchema },
    ]),
    AzureModule,
    forwardRef(() => CompanyModule),
    forwardRef(() => GovernmentModule),
  ],
  providers: [ParticipantFormService],
  controllers: [OwnerFormController, ApplicantFormController],
  exports: [ParticipantFormService],
})
export class ParticipantFormModule {}
