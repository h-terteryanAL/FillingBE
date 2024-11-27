import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
class FinCENID {
  @Prop({ maxlength: 12 })
  finCENID: string;
}

@Schema({ _id: false })
class BeneficialOwner {
  @Prop({ required: false })
  isParentOrGuard?: boolean;
}

@Schema({ _id: false })
class ExemptEntity {
  @Prop({ required: false })
  isExemptEntity?: boolean;
}

@Schema({ _id: false })
class PersonalInfo {
  @Prop({ required: false })
  lastOrLegalName?: string;

  @Prop({ required: false })
  firstName?: string;

  @Prop({ required: false })
  middleName?: string;

  @Prop({ required: false })
  suffix: string;

  @Prop({ required: false })
  dateOfBirth?: Date;
}

@Schema({ _id: false })
class Address {
  @Prop({ required: false })
  type?: string;

  @Prop({ required: false })
  address?: string;

  @Prop({ required: false })
  city?: string;

  @Prop({ required: false })
  countryOrJurisdiction?: string;

  @Prop({ required: false })
  state?: string;

  @Prop({ required: false })
  postalCode?: string;
}

@Schema({ _id: false })
class IdentificationDetails {
  @Prop({ required: false })
  docType?: string;

  @Prop({ required: false })
  docNumber?: string;

  @Prop({ required: false })
  countryOrJurisdiction?: string;

  @Prop({ required: false })
  state?: string;

  @Prop({ required: false })
  localOrTribal: string;

  @Prop({ required: false })
  otherLocalOrTribalDesc: string;

  @Prop({ required: false })
  docImg: string;
}

@Schema({ _id: false })
export class OwnerCSV {
  @Prop({ required: false, type: FinCENID })
  finCENID: FinCENID;

  @Prop({ required: false, type: BeneficialOwner })
  beneficialOwner?: BeneficialOwner;

  @Prop({ required: false, type: ExemptEntity })
  exemptEntity?: ExemptEntity;

  @Prop({ required: false, type: PersonalInfo })
  personalInfo?: PersonalInfo;

  @Prop({ required: false, type: Address })
  address?: Address;

  @Prop({ required: false, type: IdentificationDetails })
  identificationDetails?: IdentificationDetails;
}

@Schema({ _id: false })
export class ApplicantCSV {
  @Prop({ required: false, type: FinCENID })
  finCENID: FinCENID;

  @Prop({ required: false, type: PersonalInfo })
  personalInfo?: PersonalInfo;

  @Prop({ required: false, type: Address })
  address?: Address;

  @Prop({ required: false, type: IdentificationDetails })
  identificationDetails?: IdentificationDetails;
}
