import { IRequestUser } from '@/auth/interfaces/request.interface';
import { CompanyService } from '@/company/company.service';
import {
  countriesWithStates,
  requiredCompanyFields,
} from '@/company/constants';
import { ParticipantFormService } from '@/participant-form/participant-form.service';
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
    @Inject(forwardRef(() => ParticipantFormService))
    private readonly participantService: ParticipantFormService,
  ) {}

  async createCompanyFormFromCsv(companyFormData: ICompanyForm) {
    const companyData = new this.companyFormModel({ ...companyFormData });
    const answerCount = await calculateRequiredFieldsCount(
      companyFormData,
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
      isForeignPooled: companyData.repCompanyInfo?.foreignPooled,
    };
  }

  async updateCompanyForm(
    companyFormData: IChangeCompanyForm,
    companyFormDataId: string,
    companyId: string,
    user?: IRequestUser | boolean,
    missingCompanyForm?: any,
    companyForeignPooled?: { isForeignPooled: boolean },
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

    const foreignPooledBefore = companyData.repCompanyInfo?.foreignPooled;
    const companyNameBefore = companyData.names.legalName;
    const companyExistingData =
      companyFormData?.currentCompany?.isExistingCompany || undefined;
    delete companyFormData.currentCompany;

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

    if (foreignPooledBefore !== companyData.repCompanyInfo.foreignPooled) {
      await this.participantService.changeForForeignPooled(
        await this.companyService.getCompanyById(companyId),
      );
    }

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

    if (
      !isForCsv &&
      (typeof companyExistingData === 'boolean' ||
        companyData.repCompanyInfo.foreignPooled)
    ) {
      await this.companyService.changeCompanyExistingApplicantData(
        companyExistingData,
        companyData.repCompanyInfo.foreignPooled,
        companyId,
      );
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

    if (companyForeignPooled) {
      companyForeignPooled.isForeignPooled =
        companyData.repCompanyInfo.foreignPooled;
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
}
