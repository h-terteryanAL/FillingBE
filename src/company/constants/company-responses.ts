export interface IResponseMessage {
  message: string;
}

type CompanyResponseMsgKeys =
  | 'csvUploadSuccessful'
  | 'companyNotFound'
  | 'companyCreated'
  | 'companyChanged'
  | 'companyDeleted'
  | 'dontHavePermission'
  | 'companyWasCreated'
  | 'companyNameMissing'
  | 'csvFileIsMissing'
  | 'expirationTimeIsMissing'
  | 'BOIRfieldsMissing'
  | 'companiesNotSubmitted'
  | 'BOIRisSubmitted'
  | 'companiesDataRetrieved'
  | 'companyDataRetrieved';

export const companyResponseMsgs: Record<CompanyResponseMsgKeys, string> = {
  csvUploadSuccessful: 'Data is successfully saved',
  companyDataRetrieved: 'Company data retrieved',
  companiesDataRetrieved: 'Companies data retrieved',
  companyNotFound: 'Company Not found',
  companyCreated: 'Company successfully created',
  companyChanged: 'Company data was changed',
  companyDeleted: 'Company successfully deleted',
  dontHavePermission: 'You do not have permission to perform this action.',
  companyWasCreated: 'Company with that tax Id Number was already created',
  companyNameMissing: 'Company Nam is Required',
  csvFileIsMissing: 'Csv file is not detected',
  expirationTimeIsMissing: 'Expiration time is required for creating company',
  BOIRfieldsMissing: 'Company BOIR is not full',
  companiesNotSubmitted: 'Current companies is not submitted',
  BOIRisSubmitted: 'Company BOIR is submitted',
};
