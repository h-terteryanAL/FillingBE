import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
class Names {
  @Prop({ required: false })
  legalName?: string;

  @Prop({ required: false })
  altName?: string[];
}

@Schema({ _id: false })
class TaxInfo {
  @Prop({ required: false })
  taxIdType?: string;

  @Prop({ required: false })
  taxIdNumber?: string;

  @Prop({ required: false })
  countryOrJurisdiction?: string;
}

@Schema({ _id: false })
class FormationJurisdiction {
  @Prop({ required: false })
  countryOrJurisdictionOfFormation?: string;

  @Prop({ required: false })
  stateOfFormation?: string;
}

@Schema({ _id: false })
class Address {
  @Prop({ required: false })
  address?: string;

  @Prop({ required: false })
  city?: string;

  @Prop({ required: false })
  usOrUsTerritory?: string;

  @Prop({ required: false })
  state?: string;

  @Prop({ required: false })
  zipCode?: string;
}

@Schema({ _id: false })
class RepCompanyInfo {
  @Prop({ required: false })
  requestToReceiveFID?: boolean;

  @Prop({ required: false })
  foreignPooled?: boolean;
}

@Schema({ _id: false })
class CurrentCompany {
  @Prop({ required: false })
  isExistingCompany?: boolean;
}

@Schema({ _id: false })
export class CompanyCSVData {
  @Prop({ required: false, type: CurrentCompany })
  currentCompany?: CurrentCompany;

  @Prop({ required: false, type: RepCompanyInfo })
  repCompanyInfo?: RepCompanyInfo;

  @Prop({ required: false, type: Names })
  names?: Names;

  @Prop({ required: false, type: TaxInfo })
  taxInfo?: TaxInfo;

  @Prop({ required: false, type: FormationJurisdiction })
  formationJurisdiction?: FormationJurisdiction;

  @Prop({ required: false, type: Address })
  address?: Address;
}
