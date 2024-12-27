import {
  AllCountryEnum,
  CompanyData,
  OwnerData,
  StatesEnum,
  UserData,
} from '@/company/constants';
import { ICompanyData, IOwnerData, ISanitizedData } from '@/company/interfaces';
import { ICsvUser } from '@/company/interfaces/sanitized-data.interface';
import { clearWrongFields, validateData } from './validator.util';

export async function sanitizeData(
  data: any,
  createCSVData: any,
): Promise<{
  sanitized: ISanitizedData;
  errorData: any;
  reasons: any;
  companyDeleted: boolean;
}> {
  const sanitized: ISanitizedData = {
    user: {} as ICsvUser,
    company: {} as ICompanyData,
    owners: [] as IOwnerData[],
    BOIRExpTime: data['BOIR Submission Deadline'][0]
      ? new Date(data['BOIR Submission Deadline'][0])
      : null,
  };

  const companyKeys = Object.keys(CompanyData) as (keyof typeof CompanyData)[];
  const userKeys = Object.keys(UserData) as (keyof typeof UserData)[];
  const ownerKeys = Object.keys(OwnerData) as (keyof typeof OwnerData)[];

  function convertValue(key: string, value: string) {
    if (key === 'dateOfBirth') {
      return value ? new Date(value) : undefined;
    } else if (
      value.toLowerCase() === 'true' ||
      value.toLowerCase() === 'false'
    ) {
      return value.toLowerCase() === 'true';
    } else if (key === 'altName') {
      return value.trim().split(',');
    } else if (
      key === 'countryOrJurisdiction' ||
      key === 'countryOrJurisdictionOfFormation' ||
      key === 'usOrUsTerritory'
    ) {
      if (value.trim().length <= 2) {
        const countryData = AllCountryEnum[value];
        return countryData || value;
      }
    } else if (key === 'state' || key === 'stateOfFormation') {
      if (value.trim().length <= 2) {
        const stateData = StatesEnum[value];
        return stateData || value;
      }
    } else if (key === 'taxIdNumber') {
      return value.replace(/-/g, '');
    }
    return value;
  }

  function mapFieldToObject(
    mappedField: string,
    value: string,
    targetObj: IOwnerData | ICompanyData | ICsvUser,
  ) {
    const fieldParts = mappedField.split('.');
    let current = targetObj;

    fieldParts.forEach((part, index) => {
      if (index === fieldParts.length - 1) {
        current[part] = convertValue(part, value);
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    });
  }

  userKeys.forEach((key) => {
    const mappedField = UserData[key];
    let value = data[key].join('');
    if (value && value !== '') {
      if (key === 'User Email') {
        value = value.toLowerCase();
      }
      mapFieldToObject(mappedField, value, sanitized.user);
    }
  });

  companyKeys.forEach((key) => {
    if (key && typeof data[key] !== 'undefined') {
      const mappedField = CompanyData[key];
      const value = data[key].join('');
      if (value && value !== '') {
        mapFieldToObject(mappedField, value, sanitized.company);
      }
    }
  });

  const ownerCount = data['Owner Document Type']?.filter(Boolean).length ?? 0;

  for (let i = 0; i < ownerCount; i++) {
    const participant: any = {};

    ownerKeys.forEach((key) => {
      if (key && typeof data[key] !== 'undefined') {
        const mappedField = OwnerData[key];
        const value = data[key][i];
        if (value !== undefined && value !== '') {
          mapFieldToObject(mappedField, value, participant);
        }
      }
    });

    sanitized.owners.push(participant);
  }

  await createCSVData.create(sanitized);

  const validatedData = await validateData(sanitized);
  const { errorData } = validatedData;
  let isDeletedCompany = validatedData.isDeletedCompany;
  const { reasons, companyDeleted } = await clearWrongFields(sanitized);

  if (data['Company Formation Date']) {
    const formationDate = data['Company Formation Date'];
    const targetDate = new Date('2024-01-01');
    const date =
      formationDate instanceof Date ? formationDate : new Date(formationDate);

    if (targetDate < date) {
      reasons.push({
        fields: ['All Company Fields'],
        problemDesc:
          "Company can't be added because the application works only with existing companies which were added before January 1, 2024.",
      });
      if (!isDeletedCompany) isDeletedCompany = true;
    }
  }

  if (isDeletedCompany) {
    reasons.push({
      fields: ['All Company Fields'],
      problemDesc:
        'Company could not be created because one or more required fields contain incorrect or missing information.',
    });
  }

  return {
    sanitized,
    reasons,
    errorData,
    companyDeleted: companyDeleted || isDeletedCompany,
  };
}
