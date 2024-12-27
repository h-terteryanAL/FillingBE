export interface IRepCompanyInfo {
  requestToReceiveFID?: boolean;
  foreignPooled?: boolean;
}

export interface ILegalAndAltNames {
  legalName?: string;
  altName?: string[];
}

export interface ITaxInformation {
  taxIdType: string;
  taxIdNumber: string;
  countryOrJurisdiction?: string;
}

export interface IJurisdictionOfFormation {
  countryOrJurisdictionOfFormation?: string;
}

export interface ICompanyAddress {
  address?: string;
  city?: string;
  usOrUsTerritory?: string;
  state?: string;
  zipCode?: string;
}

export interface ICompanyForm {
  repCompanyInfo?: IRepCompanyInfo;
  names?: ILegalAndAltNames;
  formationJurisdiction?: IJurisdictionOfFormation;
  taxInfo: ITaxInformation;
  address?: ICompanyAddress;
}

export interface IChangeCompanyForm {
  repCompanyInfo?: IRepCompanyInfo;
  names?: ILegalAndAltNames;
  formationJurisdiction?: IJurisdictionOfFormation;
  taxInfo?: ITaxInformation;
  address?: ICompanyAddress;
}
