import {
  AllCountryEnum,
  countriesWithStates,
  ForeignCountryEnum,
  StatesEnum,
  TribalDataEnum,
  USTerritoryEnum,
} from '@/company/constants';
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export function ValidateCompanyTribalData(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'ValidateCompanyTribalData',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const object: any = args.object;
          const { countryOrJurisdictionOfFormation } = object;
          if (object?.stateOfFormation) {
            return value === undefined || value === null;
          }
          if (countriesWithStates.includes(countryOrJurisdictionOfFormation)) {
            return countryOrJurisdictionOfFormation === value;
          }

          return Object.values(TribalDataEnum).includes(value);
        },
        defaultMessage: () =>
          `Tribal Jurisdiction cannot be selected when a state is chosen. Please deselect Tribal Jurisdiction or choose a valid state.`,
      },
    });
  };
}

export function StateOfFormationValidator(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'StateOfFormationValidator',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const object = args.object as any;
          const { countryOrJurisdictionOfFormation } = object;
          if (object?.tribalJurisdiction) {
            return value === undefined || value === null;
          }

          if (countriesWithStates.includes(countryOrJurisdictionOfFormation)) {
            return value === countryOrJurisdictionOfFormation;
          }

          return Object.values(StatesEnum).includes(value);
        },
        defaultMessage: (args: ValidationArguments) => {
          const objects = args.object as any;
          const { countryOrJurisdictionOfFormation } = objects;
          if (objects?.tribalJurisdiction) {
            return `Only one of stateOfFormation or tribalJurisdiction can be provided.`;
          }
          if (countriesWithStates.includes(countryOrJurisdictionOfFormation)) {
            return `stateOfFormation must match the country value when country is one of the USCountries.`;
          }
          return `stateOfFormation must be empty when the country is foreign.`;
        },
      },
    });
  };
}

export function IsEmptyIfNotOtherTribal(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsEmptyIfNotOtherTribal',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const { tribalJurisdiction } = args.object as any;
          if (tribalJurisdiction !== TribalDataEnum.Other) {
            return false;
          }

          return true;
        },
        defaultMessage: () =>
          `nameOfOtherTribal must be empty when tribalJurisdiction is not 'Other'`,
      },
    });
  };
}

@ValidatorConstraint({ async: false })
export class CountryOrJurisdictionValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments) {
    const docType = (args.object as any).docType;

    switch (docType) {
      case "State issued driver's license":
        return Object.values(USTerritoryEnum).includes(value);
      case 'State/local/tribe-issued ID':
        return Object.values(AllCountryEnum).includes(value);
      case 'US Passport':
        return value === AllCountryEnum.US;
      case 'Foreign Passport':
        return Object.values(ForeignCountryEnum).includes(value);
      default:
        return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `countryOrJurisdiction is not valid for the given docType.`;
  }
}

export function IsCountryOrJurisdictionValid(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: CountryOrJurisdictionValidator,
    });
  };
}

@ValidatorConstraint({ async: false })
class StateValidator implements ValidatorConstraintInterface {
  validate(state: any, args: ValidationArguments) {
    const { docType, countryOrJurisdiction } = args.object as any;

    switch (docType) {
      case "State issued driver's license":
        if (countryOrJurisdiction === AllCountryEnum.US) {
          return Object.values(StatesEnum).includes(state);
        } else {
          return state === countryOrJurisdiction;
        }

      case 'State/local/tribe-issued ID':
        if (countryOrJurisdiction === AllCountryEnum.US) {
          return Object.values(StatesEnum).includes(state);
        } else if (
          Object.values(USTerritoryEnum).includes(countryOrJurisdiction)
        ) {
          return Object.values(USTerritoryEnum).includes(state);
        } else {
          return false;
        }
      default:
        return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `Invalid state for the selected docType and countryOrJurisdiction.`;
  }
}

export function IsStateValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: StateValidator,
    });
  };
}

@ValidatorConstraint({ async: false })
class LocalOrTribalValidator implements ValidatorConstraintInterface {
  validate(localOrTribal: any, args: ValidationArguments) {
    const { docType, countryOrJurisdiction } = args.object as any;
    if (
      docType === 'State/local/tribe-issued ID' &&
      countryOrJurisdiction === AllCountryEnum.US
    ) {
      return Object.values(TribalDataEnum).includes(localOrTribal);
    }

    return localOrTribal === undefined || localOrTribal === null;
  }

  defaultMessage(args: ValidationArguments) {
    return `The localOrTribal field is only allowed when docType is "State/local/tribe-issued ID" and countryOrJurisdiction is "United States of America".`;
  }
}

export function IsLocalOrTribalValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: LocalOrTribalValidator,
    });
  };
}
@ValidatorConstraint({ async: false })
export class OtherLocalOrTribalDescValidator
  implements ValidatorConstraintInterface
{
  validate(otherLocalOrTribalDesc: any, args: ValidationArguments) {
    const { docType, countryOrJurisdiction, localOrTribal } =
      args.object as any;

    if (
      docType === 'State/local/tribe-issued ID' &&
      countryOrJurisdiction === AllCountryEnum.US &&
      localOrTribal === TribalDataEnum.Other
    ) {
      return (
        typeof otherLocalOrTribalDesc === 'string' &&
        otherLocalOrTribalDesc.length <= 150
      );
    }

    return false;
  }

  defaultMessage(args: ValidationArguments) {
    return `The otherLocalOrTribalDesc field is only allowed when docType is "State/local/tribe-issued ID", countryOrJurisdiction is "United States of America", and localOrTribal is "Other".`;
  }
}

export function IsOtherLocalOrTribalDescValid(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: OtherLocalOrTribalDescValidator,
    });
  };
}

export function CountryStateValidator(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'StateValidator',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const object = args.object as any;
          const { countryOrJurisdiction } = object;

          if (countryOrJurisdiction === AllCountryEnum.US) {
            return Object.values(StatesEnum).includes(value);
          }

          if (countriesWithStates.includes(countryOrJurisdiction)) {
            return value === countryOrJurisdiction;
          }

          return false;
        },
        defaultMessage: (args: ValidationArguments) => {
          const objects = args.object as any;
          const { countryOrJurisdictionOfFormation } = objects;
          if (objects?.tribalJurisdiction) {
            return `Only one of stateOfFormation or tribalJurisdiction can be provided.`;
          }
          if (countryOrJurisdictionOfFormation === AllCountryEnum.US) {
            return `stateOfFormation must be a valid state when country is USA.`;
          }
          if (countriesWithStates.includes(countryOrJurisdictionOfFormation)) {
            return `stateOfFormation must match the country value when country is one of the USCountries.`;
          }
          return `stateOfFormation must be empty when the country is foreign.`;
        },
      },
    });
  };
}

export function PostalCodeValidator(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'PostalCodeValidator',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const object = args.object as any;
          const { countryOrJurisdiction } = object;

          if (
            countryOrJurisdiction === AllCountryEnum.US ||
            countriesWithStates.includes(countryOrJurisdiction)
          ) {
            const usRegex = /^\d{5}(\d{4})?$/;
            if (!usRegex.test(value)) {
              return false;
            }

            if (/^(\d)\1*$/.test(value) || value === '123456789') {
              return false;
            }
          } else {
            const genericRegex = /^[a-zA-Z0-9]{1,9}$/; // 1-9 alphanumeric characters
            if (!genericRegex.test(value)) {
              return false;
            }
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const objects = args.object as any;
          const { countryOrJurisdiction } = objects;

          if (!countryOrJurisdiction) {
            return `Postal code validation skipped due to missing country or jurisdiction.`;
          }

          if (countryOrJurisdiction === 'United States of America') {
            return `Postal code must be valid for the United States (e.g., 12345 or 654987321).`;
          }

          return `Postal code must be valid for the selected country or jurisdiction (1-9 alphanumeric characters).`;
        },
      },
    });
  };
}
