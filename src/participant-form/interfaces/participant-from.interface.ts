import { AllCountryEnum, StatesEnum } from '@/company/constants';

export interface IChangeParticipantForm {
  applicant?: {
    isExistingCompany?: boolean;
  };
  beneficialOwner?: {
    isParentOrGuard?: boolean;
  };
  finCENID?: {
    finCENID?: string;
  };
  exemptEntity?: {
    isExemptEntity?: boolean;
  };
  personalInfo?: {
    lastOrLegalName?: string;
    firstName?: string;
    middleName?: string;
    suffix?: string;
    dateOfBirth?: Date;
  };
  address?: {
    type?: 'business' | 'residential';
    address?: string;
    city?: string;
    countryOrJurisdiction?: AllCountryEnum;
    state?: StatesEnum;
    postalCode?: string;
  };
  identificationDetails?: {
    docType?: string;
    docNumber?: string;
    countryOrJurisdiction?: string;
    state?: StatesEnum;
    localOrTribal?: string;
    otherLocalOrTribalDesc?: string;
  };
}

export interface ICreateParticipantForm {
  isApplicant: boolean;
  applicant?: {
    isExistingCompany?: boolean;
  };
  beneficialOwner?: {
    isParentOrGuard?: boolean;
  };
  finCENID?: {
    finCENID?: string;
  };
  exemptEntity?: {
    isExemptEntity?: boolean;
  };
  personalInfo?: {
    lastOrLegalName?: string;
    firstName?: string;
    middleName?: string;
    suffix?: string;
    dateOfBirth?: Date;
  };
  address?: {
    type?: 'business' | 'residential';
    address?: string;
    city?: string;
    countryOrJurisdiction?: AllCountryEnum;
    state?: StatesEnum;
    postalCode?: string;
  };
  identificationDetails: {
    docType: string;
    docNumber: string;
    countryOrJurisdiction?: string;
    state?: StatesEnum;
    localOrTribal?: string;
    otherLocalOrTribalDesc?: string;
  };
}
