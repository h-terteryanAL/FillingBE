import { IUserInvitationEmail } from '@/mail/interfaces/mail.interface';

export async function calculateRequiredFieldsCount(
  data: any,
  requiredFields: string[],
): Promise<number> {
  let enteredFieldsCount = 0;
  requiredFields.forEach((fieldPath) => {
    const [start, end] = fieldPath.split('.');

    if (!!data[start]) {
      if (!!data[start][end]) {
        enteredFieldsCount++;
      }
    }
  });

  return enteredFieldsCount;
}

export const mailDataParser = (data: IUserInvitationEmail[]) => {
  const newCreatedCompanies = data.filter((item: any) => item.isNewCompany);
  const oldCompanies = data.filter((item: any) => !item.isNewCompany);

  const groupByEmail = (data: any) => {
    const grouped = new Map();

    data.forEach((item: any) => {
      const { fullName, companyName, isNewCompany } = item;
      const email = item.email.trim();
      if (!grouped.has(email)) {
        grouped.set(email, {
          email,
          fullName: fullName.trim(),
          isNewCompany,
          companiesNames: [],
        });
      }

      grouped.get(email).companiesNames.push(companyName);
    });

    return Array.from(grouped.values());
  };

  const newCompaniesResult = groupByEmail(newCreatedCompanies);
  const oldCompaniesResult = groupByEmail(oldCompanies);
  return [...newCompaniesResult, ...oldCompaniesResult];
};
