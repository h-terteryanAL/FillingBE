import { IRequestUser } from '@/auth/interfaces/request.interface';
import { CompanyService } from '@/company/company.service';
import {
  countriesWithStates,
  requiredCompanyFields,
} from '@/company/constants';
import { calculateRequiredFieldsCount } from '@/utils/util';
import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { companyFormFields, companyFormResponseMsgs } from './constants';
import {
  IChangeCompanyForm,
  ICompanyForm,
} from './interfaces/company-form.interface';
import {
  CompanyForm,
  CompanyFormDocument,
} from './schemas/company-form.schema';

@Injectable()
export class CompanyFormService {
  constructor(
    @InjectModel(CompanyForm.name)
    private companyFormModel: Model<CompanyFormDocument>,
    @Inject(forwardRef(() => CompanyService))
    private readonly companyService: CompanyService,
  ) {}

  async createCompanyFormFromCsv(companyFormData: ICompanyForm) {
    const updatedFormData = this.addIsVerifiedFlag(companyFormData);
    const companyData = new this.companyFormModel({ ...updatedFormData });
    const answerCount = await calculateRequiredFieldsCount(
      companyData,
      requiredCompanyFields,
    );

    companyData.answerCount = answerCount;

    await companyData.save();
    const missingFormData = await this.getCompanyFormMissingFields(companyData);
    return {
      id: companyData._id,
      companyName: companyData.names.legalName,
      answerCount,
      missingFormData,
    };
  }

  async updateCompanyForm(
    companyFormData: IChangeCompanyForm,
    companyFormDataId: string,
    companyId: string,
    user?: IRequestUser | boolean,
    missingCompanyForm?: any,
    isForCsv?: boolean,
    company?: any,
  ) {
    if (user && typeof user !== 'boolean') {
      await this.companyService.checkUserCompanyPermission(
        user,
        companyId,
        'company',
      );
    }

    const companyData = await this.companyFormModel.findById(companyFormDataId);

    if (!companyData) {
      throw new NotFoundException('Company Form not Found');
    }

    const companyNameBefore = companyData.names.legalName;

    if (companyFormData.taxInfo) {
      if (
        companyFormData.taxInfo.taxIdType !== 'Foreign' &&
        companyFormData.taxInfo.countryOrJurisdiction
      ) {
        throw new ConflictException(
          companyFormResponseMsgs.companyFormForeignTaxIdError,
        );
      }
    }

    const updateDataKeys = Object.keys(companyFormData);
    for (const i of updateDataKeys) {
      if (companyFormData[i] === '') {
        companyFormData[i] = undefined;
      }
      companyData[i] = { ...companyData[i], ...companyFormData[i] };
    }

    companyData.answerCount = await calculateRequiredFieldsCount(
      companyData,
      requiredCompanyFields,
    );

    if (!isForCsv && companyNameBefore !== companyData.names.legalName) {
      await this.companyService.changeCompanyName(
        companyId,
        companyData.names.legalName,
      );
    } else {
      if (company) {
        company.name = companyData.names.legalName;
      }
    }

    await companyData.save();
    await this.companyService.changeCompanyCounts(companyId);

    if (missingCompanyForm) {
      const missingCompanyData =
        await this.getCompanyFormMissingFields(companyData);
      if (missingCompanyData.length) {
        missingCompanyForm.company = missingCompanyData;
      }
    }

    return {
      message: companyFormResponseMsgs.companyFormUpdated,
    };
  }

  async getCompanyFormById(
    companyFormId: string,
    user: IRequestUser,
  ): Promise<CompanyFormDocument> {
    const companyForm = await this.companyFormModel.findById(companyFormId);

    if (!companyForm) {
      throw new NotFoundException(companyFormResponseMsgs.companyFormNotFound);
    }

    await this.companyService.checkUserCompanyPermission(
      user,
      companyForm['id'],
      'companyForm',
    );

    return companyForm;
  }

  async deleteCompanyFormById(companyFormId: string) {
    const companyForm =
      await this.companyFormModel.findByIdAndDelete(companyFormId);

    if (!companyForm) {
      throw new NotFoundException(companyFormResponseMsgs.companyFormNotFound);
    }

    return { message: companyFormResponseMsgs.companyFormDeleted };
  }

  async getCompanyFormByTaxData(
    taxNumber: string,
    taxType: string,
  ): Promise<CompanyFormDocument> | null {
    return this.companyFormModel.findOne({
      'taxInfo.taxIdNumber': taxNumber,
      'taxInfo.taxIdType': taxType,
    });
  }

  async getCompanyFormMissingFields(companyForm: CompanyFormDocument) {
    const topLevelKeys = Object.keys(companyFormFields);
    const missingFields: string[] = [];

    topLevelKeys.forEach((topLevelKey) => {
      if (companyForm[topLevelKey]) {
        if (
          typeof companyForm[topLevelKey] !== 'string' ||
          typeof companyForm[topLevelKey] !== 'boolean'
        ) {
          Object.keys(companyFormFields[topLevelKey]).forEach((lowLevelKey) => {
            if (
              companyForm[topLevelKey][lowLevelKey] === '' ||
              companyForm[topLevelKey][lowLevelKey] === undefined ||
              companyForm[topLevelKey][lowLevelKey] === null
            ) {
              if (topLevelKey === 'taxInfo') {
                if (lowLevelKey === 'countryOrJurisdiction') {
                  if (companyForm[topLevelKey]['taxIdType'] === 'Foreign') {
                    missingFields.push(
                      companyFormFields[topLevelKey][lowLevelKey],
                    );
                  }
                } else {
                  missingFields.push(
                    companyFormFields[topLevelKey][lowLevelKey],
                  );
                }
              } else if (topLevelKey === 'formationJurisdiction') {
                if (lowLevelKey === 'countryOrJurisdictionOfFormation') {
                  missingFields.push(
                    companyFormFields[topLevelKey][lowLevelKey],
                  );
                } else if (
                  lowLevelKey === 'stateOfFormation' &&
                  !companyFormFields[topLevelKey].tribalJurisdiction
                ) {
                  if (
                    countriesWithStates.includes(
                      companyForm[topLevelKey][
                        'countryOrJurisdictionOfFormation'
                      ],
                    )
                  ) {
                    missingFields.push(
                      companyFormFields[topLevelKey][lowLevelKey],
                    );
                  }
                } else if (
                  lowLevelKey === 'tribalJurisdiction' &&
                  !companyFormFields[topLevelKey].stateOfFormation
                ) {
                  missingFields.push(
                    companyFormFields[topLevelKey][lowLevelKey],
                  );
                } else if (
                  lowLevelKey === 'nameOfOtherTribal' &&
                  companyForm[topLevelKey]['tribalJurisdiction'] === 'Other'
                ) {
                  missingFields.push(
                    companyFormFields[topLevelKey][lowLevelKey],
                  );
                }
              } else {
                missingFields.push(companyFormFields[topLevelKey][lowLevelKey]);
              }
            }
          });
        } else {
          missingFields.push(companyFormFields[topLevelKey]);
        }
      }
    });

    return missingFields;
  }

  private addIsVerifiedFlag(data: any): any {
    if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
      for (const key in data) {
        if (
          typeof data[key] === 'object' &&
          !Array.isArray(data) &&
          data[key] !== null
        ) {
          data[key] = this.addIsVerifiedFlag(data[key]);
        }
      }
      return { ...data, isVerified: false };
    }
    return data;
  }
}
