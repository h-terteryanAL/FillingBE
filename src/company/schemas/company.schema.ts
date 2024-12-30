import { CompanyForm } from '@/company-form/schemas/company-form.schema';
import { GovernmentApiStatusEnum } from '@/government/constants';
import { OwnerForm } from '@/owner-form/schemas/owner-form.schema';
import { Transaction } from '@/transaction/schemas/transaction.schema';
import { User } from '@/user/schema/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongoSchema } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ _id: false })
class Forms {
  @Prop({ type: MongoSchema.Types.ObjectId, ref: 'CompanyForm' })
  company: CompanyForm;

  @Prop({
    type: [MongoSchema.Types.ObjectId],
    ref: 'OwnerForm',
    default: [],
  })
  owners: OwnerForm[];
}

@Schema({ timestamps: true })
export class Company {
  @Prop()
  name: string;

  @Prop({ default: 0 })
  answersCount: number;

  @Prop({ default: 0 })
  reqFieldsCount: number;

  @Prop({ default: '' })
  processId: string;

  @Prop({ default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
  expTime: Date;

  @Prop({ type: Forms })
  forms: Forms;

  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: 'User',
    required: false,
  })
  user: User;

  @Prop({ default: false })
  isSubmitted: boolean;

  @Prop({ default: false })
  isPaid: boolean;

  @Prop({ default: [] })
  transactions: Transaction[];

  @Prop({ default: true })
  isExistingCompany: boolean;

  @Prop({ default: GovernmentApiStatusEnum.not_presented })
  boirSubmissionStatus: GovernmentApiStatusEnum;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
