// const results = [];
// await new Promise((resolve, reject) => {
//   bufferStream
//     .pipe(csvParser({ separator: ',', quote: '"' }))
//     .on('data', (data: []) => {
//       const trimmedData = Object.fromEntries(
//         Object.entries(data).map(([key, value]: [string, string]) => [
//           key.trim(),
//           value.trim(),
//         ]),
//       );

//       results.push(trimmedData);
//     })
//     .on('end', () => resolve(results))
//     .on('error', reject);
// });

// import { CompanyData, ParticipantData, UserData } from '@/company/constants';
// import {
//   ICompanyCSVRowData,
//   ICompanyData,
//   IParticipantData,
//   ISanitizedData,
// } from '@/company/interfaces';
// import { ICsvUser } from '@/company/interfaces/sanitized-data.interface';
// import { BadRequestException, ConflictException } from '@nestjs/common';
// import { validateData } from './validator.util';

// export async function sanitizeData(
//   data: ICompanyCSVRowData,
// ): Promise<{ sanitized: ISanitizedData; resultMessage: string }> {
//   const sanitized: ISanitizedData = {
//     user: {} as ICsvUser,
//     company: {} as ICompanyData,
//     participants: [] as IParticipantData[],
//     BOIRExpTime: data['BOIR Submission Deadline']
//       ? new Date(data['BOIR Submission Deadline'])
//       : null,
//   };

//   const participantKeys = Object.keys(
//     ParticipantData,
//   ) as (keyof typeof ParticipantData)[];
//   const companyKeys = Object.keys(CompanyData) as (keyof typeof CompanyData)[];
//   const userKeys = Object.keys(UserData) as (keyof typeof UserData)[];

//   function convertValue(key: string, value: string) {
//       if (key === 'dateOfBirth') {
//       return value ? new Date(value) : undefined;
//     } else if (value.toLowerCase() === 'true') {
//       return true;
//     } else if (value.toLowerCase() === 'false') {
//       return false;
//     } else if (key === 'altName') {
//       return value.trim().split(',');
//     }
//     return value.trim();
//   }

//   function mapFieldToObject(
//     mappedField: string,
//     value: string,
//     targetObj: IParticipantData | ICompanyData | ICsvUser,
//   ) {
//     const fieldParts = mappedField.split('.');
//     let current = targetObj;
//     fieldParts.forEach((part, index) => {
//       if (index === fieldParts.length - 1) {
//         current[part] = convertValue(part, value);
//       } else {
//         current[part] = current[part] || {};
//         current = current[part];
//       }
//     });
//   }

//   userKeys.forEach((key) => {
//     const mappedField = UserData[key];
//     const value = data[key];
//     if (value) {
//       mapFieldToObject(mappedField, value, sanitized.user);
//     }
//   });

//   companyKeys.forEach((key) => {
//     const mappedField = CompanyData[key];
//     const value = data[key];
//     if (value) {
//       mapFieldToObject(mappedField, value, sanitized.company);
//     }
//   });

//   const participantTypes = [
//     { prefix: 'Applicant', isApplicant: true },
//     { prefix: 'Owner', isApplicant: false },
//   ];

//   participantTypes.forEach(({ prefix, isApplicant }) => {
//     const hasMultipleParticipants = data[`${prefix} First Name`]?.includes(',');

//     if (hasMultipleParticipants) {
//       const firstNames = data[`${prefix} First Name`].split(',');
//       firstNames.forEach((_, index) => {
//         if (
//           !(
//             (sanitized.company.isExistingCompany ||
//               (sanitized.company.repCompanyInfo &&
//                 sanitized.company.repCompanyInfo.foreignPooled)) &&
//             isApplicant
//           )
//         ) {
//           const participant: any = { isApplicant };
//           participantKeys.forEach((key) => {
//             const value = data[`${prefix} ${key}`];
//               if (value) {
//               const splitValues = value.split(',');
//               const trimmedValue = splitValues[index]?.trim();
//               if (trimmedValue) {
//                 const mappedField = ParticipantData[key];

//                 mapFieldToObject(
//                   mappedField,
//                   trimmedValue,
//                   participant as IParticipantData,
//                 );
//               }
//             }
//           });

//           if (isApplicant && participant.address) {
//             if (!participant.address.type) {
//               throw new ConflictException('Address type is missing');
//             }
//           }

//           sanitized.participants.push({ ...participant });
//         }
//       });
//     } else {
//       if (
//         !(
//           sanitized.company.isExistingCompany ||
//           (!(
//             sanitized.company.repCompanyInfo &&
//             sanitized.company.repCompanyInfo.foreignPooled
//           ) &&
//             isApplicant)
//         )
//       ) {
//         const participant: any = { isApplicant };
//         participantKeys.forEach((key) => {
//           const value = data[`${prefix} ${key}`];
//           if (value) {
//             const mappedField = ParticipantData[key];
//             mapFieldToObject(
//               mappedField,
//               value,
//               participant as IParticipantData,
//             );
//           }
//         });

//         if (isApplicant && participant.address) {
//           if (!participant.address.type) {
//             throw new ConflictException('Address type is missing');
//           }
//         }

//         sanitized.participants.push({ ...participant });
//       }
//     }
//   });

//   if (
//     sanitized.company.taxInfo.taxIdType &&
//     sanitized.company.taxInfo.taxIdType !== 'Foreign' &&
//     sanitized.company.taxInfo.countryOrJurisdiction
//   ) {
//     throw new ConflictException(
//       'Country/Jurisdiction can be added only if tax type is Foreign',
//     );
//   }

//   if (sanitized.BOIRExpTime && isNaN(sanitized.BOIRExpTime.getTime())) {
//     throw new BadRequestException('Invalid expiration time format.');
//   }

//   await validateData(sanitized);

//   return {
//     sanitized,
//     resultMessage: `${sanitized.company.names.legalName || 'Company'} data could not be added due to missing or incorrect information.`,
//   };
// }
