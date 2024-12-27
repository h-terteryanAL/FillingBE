import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OwnerFormSchema, OwnerForm } from './schemas/owner-form.schema';
import { OwnerFormService } from './owner-form.service';
import { OwnerFormController } from './owner-form.controller';
import { CompanyModule } from '@/company/company.module';
import { GovernmentModule } from '@/government/government.module';
import { AzureModule } from '@/azure/azure.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OwnerForm.name, schema: OwnerFormSchema },
    ]),
    AzureModule,
    forwardRef(() => CompanyModule),
    forwardRef(() => GovernmentModule),
  ],
  providers: [OwnerFormService],
  controllers: [OwnerFormController],
  exports: [OwnerFormService],
})
export class OwnerFormModule {}
