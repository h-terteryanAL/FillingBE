export interface IResponseMessage {
  message: string;
}

type CompanyFormResponseMsgKeys =
  | 'companyFormNotFound'
  | 'companyFormUpdated'
  | 'companyFormDeleted'
  | 'companyFormCreated'
  | 'companyFormForeignTaxIdError';

export const companyFormResponseMsgs: Record<
  CompanyFormResponseMsgKeys,
  string
> = {
  companyFormNotFound: 'Company form is not found',
  companyFormUpdated: 'Company form data changed',
  companyFormDeleted: 'Company form deleted',
  companyFormCreated: 'Company form created',
  companyFormForeignTaxIdError:
    'Country and jurisdiction field can exist only if type is Foreign',
};

export { companyFormFields } from './company-form_fields';
