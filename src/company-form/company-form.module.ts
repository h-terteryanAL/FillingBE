import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyForm, CompanyFormSchema } from './schemas/company-form.schema';
import { CompanyFormService } from './company-form.service';
import { CompanyFormController } from './company-form.controller';
import { CompanyModule } from '@/company/company.module';
import { ParticipantFormModule } from '@/participant-form/participant-form.module';
@Module({
  imports: [
    forwardRef(() => CompanyModule),
    forwardRef(() => ParticipantFormModule),
    MongooseModule.forFeature([
      { name: CompanyForm.name, schema: CompanyFormSchema },
    ]),
  ],
  providers: [CompanyFormService],
  controllers: [CompanyFormController],
  exports: [CompanyFormService],
})
export class CompanyFormModule {}
