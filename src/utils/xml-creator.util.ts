import {
  AllCountryEnum,
  BOIRDateParser,
  BOIRParticipantDocTypeParser,
  BOIRTaxIdTypeParser,
  countriesWithStates,
  ForeignCountryEnum,
  StatesEnum,
  TribalDataEnum,
  UNITED_STATES,
} from '@/company/constants';
import { CompanyDocument } from '@/company/schemas/company.schema';
import { create } from 'xmlbuilder2';
import { getEnumKeyByValue } from './validator.util';

const addDataElement = (
  parent: any,
  elementName: string,
  data: any,
  options: any = {},
) => {
  return parent.ele(`fc2:${elementName}`, options).txt(data);
};

export const createCompanyXml = async (
  companyData: CompanyDocument,
  userData: { email: string; lastName: string; firstName: string },
) => {
  let seqNum = 0;
  const { email, lastName, firstName } = userData;
  const companyForm = companyData.forms.company;
  const xml = create({ version: '1.0', encoding: 'UTF-8' }).ele(
    'fc2:EFilingSubmissionXML',
    {
      'xmlns:fc2': 'www.fincen.gov/base',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation': `www.fincen.gov/base https://www.fincen.gov/sites/default/files/schema/base/BOIRSchema.xsd`,
      SeqNum: `${++seqNum}`,
    },
  );

  xml.ele('fc2:SubmitterElectronicAddressText').txt(email);
  xml.ele('fc2:SubmitterEntityIndivdualLastName').txt(lastName);
  xml.ele('fc2:SubmitterIndivdualFirstName').txt(firstName);
  const activity = xml.ele('fc2:Activity', { SeqNum: `${++seqNum}` });
  addDataElement(
    activity,
    'ApprovalOfficialSignatureDateText',
    BOIRDateParser(new Date()),
  );

  addDataElement(activity, 'FilingDateText', BOIRDateParser(new Date()));
  const activityAssociation = activity.ele('fc2:ActivityAssociation', {
    SeqNum: `${++seqNum}`,
  });
  addDataElement(activityAssociation, 'InitialReportIndicator', 'Y');

  seqNum = reportCompanyParty(activity, companyForm, seqNum);
  companyData.forms.owners.forEach((owner) => {
    seqNum = ownerFormParty(activity, owner, seqNum);
  });

  return xml.end({ prettyPrint: true });
};

function ownerFormParty(activity: any, ownerForm: any, seqNum: number) {
  const ownerFormParty = activity.ele('fc2:Party', {
    SeqNum: `${++seqNum}`,
  });
  addDataElement(ownerFormParty, 'ActivityPartyTypeCode', '64');

  if (ownerForm.personalInfo.dateOfBirth) {
    addDataElement(
      ownerFormParty,
      'IndividualBirthDateText',
      BOIRDateParser(ownerForm.personalInfo.dateOfBirth),
    );
  }
  if (ownerForm.beneficialOwner.isParentOrGuard) {
    addDataElement(
      ownerFormParty,
      'ParentOrLegalGuardianForMinorChildIndicator',
      'Y',
    );
  }
  const ownerPartyName = ownerFormParty.ele('fc2:PartyName', {
    SeqNum: `${++seqNum}`,
  });
  addDataElement(ownerPartyName, 'PartyNameTypeCode', 'L');
  addDataElement(
    ownerPartyName,
    'RawEntityIndividualLastName',
    ownerForm.personalInfo.lastOrLegalName,
  );

  addDataElement(
    ownerPartyName,
    'RawIndividualFirstName',
    ownerForm.personalInfo.firstName,
  );
  if (ownerForm.personalInfo.middleName) {
    addDataElement(
      ownerPartyName,
      'RawIndividualMiddleName',
      ownerForm.personalInfo.middleName,
    );
  }
  if (ownerForm.personalInfo.suffix) {
    addDataElement(
      ownerPartyName,
      'RawIndividualNameSuffixText',
      ownerForm.personalInfo.suffix,
    );
  }
  const ownerAddress = ownerFormParty.ele('fc2:Address', {
    SeqNum: `${++seqNum}`,
  });
  addDataElement(ownerAddress, 'RawCityText', ownerForm.address.city);
  addDataElement(
    ownerAddress,
    'RawCountryCodeText',
    getEnumKeyByValue(ownerForm.address.countryOrJurisdiction, AllCountryEnum),
  );
  if (ownerForm.address.state) {
    addDataElement(
      ownerAddress,
      'RawStateCodeText',
      getEnumKeyByValue(ownerForm.address.state, StatesEnum),
    );
  }
  addDataElement(
    ownerAddress,
    'RawStreetAddress1Text',
    ownerForm.address.address,
  );
  addDataElement(ownerAddress, 'RawZIPCode', ownerForm.address.postalCode);
  const ownerPartyIdentification = ownerFormParty.ele(
    'fc2:PartyIdentification',
    {
      SeqNum: `${++seqNum}`,
    },
  );
  if (ownerForm.identificationDetails.localOrTribal) {
    addDataElement(
      ownerPartyIdentification,
      'IssuerLocalTribalCodeText',
      getEnumKeyByValue(
        ownerForm.identificationDetails.localOrTribal,
        TribalDataEnum,
      ),
    );
  }
  addDataElement(
    ownerPartyIdentification,
    'OriginalAttachmentFileName',
    ownerForm.identificationDetails.docImg,
  );
  addDataElement(
    ownerPartyIdentification,
    'OtherIssuerCountryText',
    getEnumKeyByValue(
      ownerForm.identificationDetails.countryOrJurisdiction,
      AllCountryEnum,
    ),
  );
  if (ownerForm.identificationDetails.otherLocalOrTribalDesc) {
    addDataElement(
      ownerPartyIdentification,
      'OtherIssuerLocalTribalText',
      ownerForm.identificationDetails.otherLocalOrTribalDesc,
    );
  }
  if (ownerForm.identificationDetails.state) {
    addDataElement(
      ownerPartyIdentification,
      'OtherIssuerStateText',
      getEnumKeyByValue(ownerForm.identificationDetails.state, StatesEnum),
    );
  }
  addDataElement(
    ownerPartyIdentification,
    'PartyIdentificationNumberText',
    ownerForm.identificationDetails.docNumber,
  );
  addDataElement(
    ownerPartyIdentification,
    'PartyIdentificationTypeCode',
    BOIRParticipantDocTypeParser(ownerForm.identificationDetails.docType),
  );

  return seqNum;
}

function reportCompanyParty(activity: any, companyForm: any, seqNum: number) {
  const reportCompanyParty = activity.ele('fc2:Party', {
    SeqNum: `${++seqNum}`,
  });
  addDataElement(reportCompanyParty, 'ActivityPartyTypeCode', '62');
  addDataElement(reportCompanyParty, 'ExistingReportingCompanyIndicator', 'Y');

  if (
    !(
      countriesWithStates.includes(
        companyForm.formationJurisdiction.countryOrJurisdictionOfFormation,
      ) ||
      companyForm.formationJurisdiction.countryOrJurisdictionOfFormation ===
        UNITED_STATES
    )
  ) {
    if (companyForm.formationJurisdiction.tribalJurisdiction) {
      addDataElement(
        reportCompanyParty,
        'FirstRegistrationLocalTribalCodeText',
        getEnumKeyByValue(
          companyForm.formationJurisdiction.tribalJurisdiction,
          TribalDataEnum,
        ),
      );
    }

    if (companyForm.formationJurisdiction.stateOfFormation) {
      addDataElement(
        reportCompanyParty,
        'FirstRegistrationStateCodeText',
        getEnumKeyByValue(
          companyForm.formationJurisdiction.stateOfFormation,
          StatesEnum,
        ),
      );
    }

    addDataElement(
      reportCompanyParty,
      'FormationCountryCodeText',
      getEnumKeyByValue(
        companyForm.formationJurisdiction.countryOrJurisdictionOfFormation,
        ForeignCountryEnum,
      ),
    );

    if (companyForm.formationJurisdiction.nameOfOtherTribal) {
      addDataElement(
        reportCompanyParty,
        'OtherFirstRegistrationLocalTribalText',
        companyForm.formationJurisdiction.nameOfOtherTribal,
      );
    }
  } else {
    addDataElement(
      reportCompanyParty,
      'FormationCountryCodeText',
      getEnumKeyByValue(
        companyForm.formationJurisdiction.countryOrJurisdictionOfFormation,
        AllCountryEnum,
      ),
    );

    if (companyForm.formationJurisdiction.tribalJurisdiction) {
      addDataElement(
        reportCompanyParty,
        'FormationLocalTribalCodeText',
        getEnumKeyByValue(
          companyForm.formationJurisdiction.tribalJurisdiction,
          TribalDataEnum,
        ),
      );
    }

    if (companyForm.formationJurisdiction.stateOfFormation) {
      addDataElement(
        reportCompanyParty,
        'FormationStateCodeText',
        getEnumKeyByValue(
          companyForm.formationJurisdiction.stateOfFormation,
          StatesEnum,
        ),
      );
    }

    if (companyForm.formationJurisdiction.nameOfOtherTribal) {
      addDataElement(
        reportCompanyParty,
        'OtherFormationLocalTribalText',
        companyForm.formationJurisdiction.nameOfOtherTribal,
      );
    }
  }

  addDataElement(reportCompanyParty, 'RequestFinCENIDIndicator', 'Y');

  const companyLegalPartyName = reportCompanyParty.ele('fc2:PartyName', {
    SeqNum: `${++seqNum}`,
  });

  addDataElement(companyLegalPartyName, 'PartyNameTypeCode', 'L');
  addDataElement(
    companyLegalPartyName,
    'RawPartyFullName',
    companyForm.names.legalName,
  );

  companyForm.names.altName.forEach((name) => {
    const companyAltPartyName = reportCompanyParty.ele('fc2:PartyName', {
      SeqNum: `${++seqNum}`,
    });

    addDataElement(companyAltPartyName, 'PartyNameTypeCode', 'DBA');
    addDataElement(companyAltPartyName, 'RawPartyFullName', name);
  });

  const companyAddress = reportCompanyParty.ele('fc2:Address', {
    SeqNum: `${++seqNum}`,
  });

  addDataElement(companyAddress, 'RawCityText', companyForm.address.city);
  addDataElement(
    companyAddress,
    'RawCountryCodeText',
    getEnumKeyByValue(companyForm.address.usOrUsTerritory, AllCountryEnum),
  );
  if (companyForm.address.state) {
    addDataElement(
      companyAddress,
      'RawStateCodeText',
      getEnumKeyByValue(companyForm.address.state, StatesEnum),
    );
  }
  addDataElement(
    companyAddress,
    'RawStreetAddress1Text',
    companyForm.address.address,
  );
  addDataElement(companyAddress, 'RawZIPCode', companyForm.address.zipCode);

  const identificationParty = reportCompanyParty.ele(
    'fc2:PartyIdentification',
    {
      SeqNum: `${++seqNum}`,
    },
  );
  if (companyForm.taxInfo.taxIdType === 'Foreign') {
    addDataElement(
      identificationParty,
      'OtherIssuerCountryText',
      getEnumKeyByValue(
        companyForm.taxInfo.countryOrJurisdiction,
        ForeignCountryEnum,
      ),
    );
  }
  addDataElement(
    identificationParty,
    'PartyIdentificationNumberText',
    companyForm.taxInfo.taxIdNumber,
  );

  addDataElement(
    identificationParty,
    'PartyIdentificationTypeCode',
    BOIRTaxIdTypeParser(companyForm.taxInfo.taxIdType),
  );

  return seqNum;
}
