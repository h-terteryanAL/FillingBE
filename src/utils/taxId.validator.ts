import { IdentificationTypesEnum } from '@/company/constants';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsTaxIdValid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsTaxIdValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const { taxIdType } = args.object as any; // Accessing the taxIdType from the object

          if (taxIdType === IdentificationTypesEnum.FOREIGN) {
            return (
              typeof value === 'string' && /^[A-Za-z0-9]{1,25}$/.test(value)
            );
          } else if (
            taxIdType === IdentificationTypesEnum.EIN ||
            taxIdType === IdentificationTypesEnum.SSNOrITIN
          ) {
            // For EIN, ITIN, or SSN, taxIdNumber must be exactly 9 digits, and not a sequence of the same digit
            return typeof value === 'string' && /^\d{9}$/.test(value);
          }
          return false;
        },
        defaultMessage(args: ValidationArguments) {
          const { taxIdType } = args.object as any;
          if (taxIdType === IdentificationTypesEnum.FOREIGN) {
            return 'Tax ID for Foreign must be up to 25 alphanumeric characters';
          }
          if (
            taxIdType === IdentificationTypesEnum.EIN ||
            taxIdType === IdentificationTypesEnum.SSNOrITIN
          ) {
            return 'Tax ID for EIN, ITIN, or SSN must be exactly 9 digits';
          }
          return 'Invalid tax ID number';
        },
      },
    });
  };
}
