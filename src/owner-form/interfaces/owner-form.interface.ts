import { AllCountryEnum, StatesEnum } from '@/company/constants';

export interface IChangeOwnerForm {
  beneficialOwner?: {
    isParentOrGuard?: boolean;
  };
  personalInfo?: {
    lastOrLegalName?: string;
    firstName?: string;
    middleName?: string;
    suffix?: string;
    dateOfBirth?: Date;
  };
  address?: {
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

export interface ICreateOwnerForm {
  beneficialOwner?: {
    isParentOrGuard?: boolean;
  };
  personalInfo?: {
    lastOrLegalName?: string;
    firstName?: string;
    middleName?: string;
    suffix?: string;
    dateOfBirth?: Date;
  };
  address?: {
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
