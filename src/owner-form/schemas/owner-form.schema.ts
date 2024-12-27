import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OwnerFormDocument = OwnerForm & Document;

@Schema({ _id: false })
class BeneficialOwner {
  @Prop({ default: true })
  isParentOrGuard: boolean;

  @Prop()
  isVerified: boolean;
}

@Schema({ _id: false })
class PersonalInformation {
  @Prop({ maxLength: 150 })
  lastOrLegalName: string;

  @Prop({ maxlength: 50 })
  firstName: string;

  @Prop({ maxlength: 50 })
  middleName: string;

  @Prop({ maxlength: 50 })
  suffix: string;

  @Prop()
  dateOfBirth: Date;

  @Prop()
  isVerified: boolean;
}

@Schema({ _id: false })
class OwnerAddress {
  @Prop({ maxlength: 100 })
  address: string;

  @Prop({ maxlength: 50 })
  city: string;

  @Prop()
  countryOrJurisdiction: string;

  @Prop()
  state: string;

  @Prop()
  postalCode: string;

  @Prop()
  isVerified: boolean;
}

@Schema({ _id: false })
class IdentificationAndJurisdiction {
  @Prop()
  docType: string;

  @Prop({ maxlength: 25 })
  docNumber: string;

  @Prop()
  countryOrJurisdiction: string;

  @Prop()
  state: string;

  @Prop()
  localOrTribal: string;

  @Prop({ maxlength: 150 })
  otherLocalOrTribalDesc: string;

  @Prop()
  docImg: string;

  @Prop()
  isVerified: boolean;
}

@Schema({ timestamps: true })
export class OwnerForm {
  @Prop()
  beneficialOwner: BeneficialOwner;

  @Prop()
  personalInfo: PersonalInformation;

  @Prop()
  address: OwnerAddress;

  @Prop()
  identificationDetails: IdentificationAndJurisdiction;

  @Prop()
  answerCount: number;
}

export const OwnerFormSchema = SchemaFactory.createForClass(OwnerForm);

OwnerFormSchema.index({
  'identificationDetails.docType': 1,
  'identificationDetails.docNumber': 1,
});
