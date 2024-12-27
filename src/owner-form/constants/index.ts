export { ownerFormFields } from './owner-fields';
type OwnerFormResponseKeys =
  | 'formNotFound'
  | 'changed'
  | 'deleted'
  | 'created'
  | 'allRetrieved'
  | 'retrieved'
  | 'failed';

export const ownerFormResponseMsgs: Record<OwnerFormResponseKeys, string> = {
  formNotFound: 'Form not found',
  changed: 'Data was changed',
  deleted: 'Form successfully deleted',
  created: 'Form successfully created',
  allRetrieved: 'All data retrieved successfully',
  retrieved: 'Data retrieved successfully',
  failed: 'Data update failed',
};
