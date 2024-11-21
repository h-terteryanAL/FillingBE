export const fields = [
  // Reporting Company
  {
    name: 'FormationCountryCodeText',
    dataName: 'formationCountry',
    options: {},
  },
  { name: 'FormationStateCodeText', dataName: 'formationState', options: {} },
  {
    name: 'RequestFinCENIDIndicator',
    dataName: 'requestFinCENID',
    options: {},
  },
  { name: 'PartyName', dataName: 'companyName', options: { type: 'L' } }, // 'type' as an example option
  { name: 'Address', dataName: 'companyAddress', options: {} },
  {
    name: 'PartyIdentification',
    dataName: 'companyID',
    options: { type: 'TaxID' },
  },

  // Company Applicant
  { name: 'ActivityPartyTypeCode', dataName: 'applicantTypeCode', options: {} },
  { name: 'FinCENID', dataName: 'applicantFinCENID', options: {} },
  { name: 'IndividualBirthDateText', dataName: 'applicantDOB', options: {} },
  { name: 'PartyName', dataName: 'applicantName', options: {} },
  { name: 'Address', dataName: 'applicantAddress', options: {} },
  {
    name: 'PartyIdentification',
    dataName: 'applicantID',
    options: { type: 'Passport' },
  },

  // Beneficial Owner
  { name: 'ActivityPartyTypeCode', dataName: 'ownerTypeCode', options: {} },
  { name: 'ExemptIndicator', dataName: 'ownerExempt', options: {} },
  { name: 'FinCENID', dataName: 'ownerFinCENID', options: {} },
  { name: 'IndividualBirthDateText', dataName: 'ownerDOB', options: {} },
  {
    name: 'ParentOrLegalGuardianForMinorChildIndicator',
    dataName: 'guardianIndicator',
    options: {},
  },
  { name: 'PartyName', dataName: 'ownerName', options: {} },
  { name: 'Address', dataName: 'ownerAddress', options: {} },
  {
    name: 'PartyIdentification',
    dataName: 'ownerID',
    options: { type: 'DriverLicense' },
  },
];
