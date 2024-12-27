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

export const requiredOwnerFieldWhichExemptEntity = [];

export const requiredOwnerFields = [
  'address.address',
  'address.city',
  'address.countryOrJurisdiction',
  'address.postalCode',
  'personalInfo.lastOrLegalName',
  'personalInfo.firstName',
  'personalInfo.dateOfBirth',
  'identificationDetails.docType',
  'identificationDetails.docNumber',
  'identificationDetails.countryOrJurisdiction',
  'identificationDetails.docImg',
];
