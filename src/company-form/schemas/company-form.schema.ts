import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyFormDocument = CompanyForm & Document;

@Schema({ _id: false })
class LegalAndAltNames {
  @Prop({ required: true, maxlength: 150 })
  legalName: string;

  @Prop({ type: [String], maxlength: 150 })
  altName: string[];

  @Prop({})
  isVerified: boolean;
}

@Schema({ _id: false })
class TaxInformation {
  @Prop({ required: true })
  taxIdType: string;

  @Prop({ required: true })
  taxIdNumber: string;

  @Prop()
  countryOrJurisdiction: string;

  @Prop()
  isVerified: boolean;
}

@Schema({ _id: false })
class JurisdictionOfFormation {
  @Prop()
  countryOrJurisdictionOfFormation: string;

  @Prop({ required: false })
  stateOfFormation: string;

  @Prop({ required: false })
  tribalJurisdiction: string;

  @Prop({ required: false })
  nameOfOtherTribal: string;

  @Prop()
  isVerified: boolean;
}

@Schema({ _id: false })
class CompanyAddress {
  @Prop({ maxlength: 100 })
  address: string;

  @Prop({ maxlength: 50 })
  city: string;

  @Prop()
  usOrUsTerritory: string;

  @Prop()
  state: string;

  @Prop()
  zipCode: string;

  @Prop()
  isVerified: boolean;
}

@Schema({ timestamps: true })
export class CompanyForm {
  @Prop()
  names: LegalAndAltNames;

  @Prop()
  formationJurisdiction: JurisdictionOfFormation;

  @Prop()
  taxInfo: TaxInformation;

  @Prop()
  address: CompanyAddress;

  @Prop({ default: 0 })
  answerCount: number;
}

export const CompanyFormSchema = SchemaFactory.createForClass(CompanyForm);
CompanyFormSchema.index({ 'taxInfo.taxIdType': 1, 'taxInfo.taxIdNumber': 1 });
