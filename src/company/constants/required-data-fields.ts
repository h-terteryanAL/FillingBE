export const requiredCompanyFields = [
  'names.legalName',
  'taxInfo.taxIdType',
  'taxInfo.taxIdNumber',
  'formationJurisdiction.countryOrJurisdictionOfFormation',
  'address.address',
  'address.city',
  'address.usOrUsTerritory',
  'address.state',
  'address.zipCode',
];

export const requiredOwnerFieldWhichExemptEntity = [
  'personalInfo.lastOrLegalName',
];

export const requiredOwnerFields = [
  'address.address',
  'address.city',
  'address.countryOrJurisdiction',
  'address.postalCode',
  'personalInfo.firstName',
  'personalInfo.dateOfBirth',
  'identificationDetails.docType',
  'identificationDetails.docNumber',
  'identificationDetails.countryOrJurisdiction',
  'identificationDetails.docImg',
  ...requiredOwnerFieldWhichExemptEntity,
];

export const requiredApplicantFields = [...requiredOwnerFields, 'address.type'];
