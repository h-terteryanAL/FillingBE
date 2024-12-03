import { IRequestUser } from '@/auth/interfaces/request.interface';
import { AzureService } from '@/azure/azure.service';
import { companyFormResponseMsgs } from '@/company-form/constants';
import { CompanyService } from '@/company/company.service';
import {
  CANADA,
  countriesWithStates,
  MEXICO,
  requiredApplicantFields,
  requiredOwnerFields,
  UNITED_STATES,
} from '@/company/constants';
import { CompanyDocument } from '@/company/schemas/company.schema';
import { calculateRequiredFieldsCount } from '@/utils/util';
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { requiredOwnerFieldWhichExemptEntity } from './../company/constants/required-data-fields';
import {
  applicantFormFields,
  ownerFormFields,
  participantFormResponseMsgs,
} from './constants';
import { TRCreateParticipantByCSV } from './interfaces/participant-service.interface';
import {
  ApplicantForm,
  ApplicantFormDocument,
  OwnerForm,
  OwnerFormDocument,
} from './schemas/participant-form.schema';

@Injectable()
export class ParticipantFormService {
  constructor(
    @InjectModel(OwnerForm.name)
    private ownerFormModel: Model<OwnerFormDocument>,
    @InjectModel(ApplicantForm.name)
    private applicantFormModel: Model<ApplicantFormDocument>,
    @Inject(forwardRef(() => CompanyService))
    private readonly companyService: CompanyService,
    private readonly azureService: AzureService,
  ) {}

  async createParticipantFormFromCsv(
    companyParticipantData: any,
    missingFields?: any,
  ): TRCreateParticipantByCSV {
    const isApplicant = companyParticipantData.isApplicant;

    delete companyParticipantData.isApplicant;

    const isExemptEntity =
      !isApplicant && companyParticipantData?.exemptEntity?.isExemptEntity;
    const participant = isApplicant
      ? new this.applicantFormModel(companyParticipantData)
      : new this.ownerFormModel(companyParticipantData);

    const requiredFieldsCount =
      participant.finCENID && participant.finCENID.finCENID
        ? isApplicant
          ? requiredApplicantFields.length
          : requiredOwnerFields.length
        : await calculateRequiredFieldsCount(
            participant,
            isApplicant
              ? requiredApplicantFields
              : isExemptEntity
                ? requiredOwnerFieldWhichExemptEntity
                : requiredOwnerFields,
          );
    participant.answerCount = requiredFieldsCount;

    await participant.save();

    if (missingFields) {
      if (!missingFields[isApplicant ? 'applicants' : 'owners']) {
        missingFields[isApplicant ? 'applicants' : 'owners'] = [
          await this.getParticipantFormMissingFields(participant, isApplicant),
        ];
      } else {
        missingFields[isApplicant ? 'applicants' : 'owners'].push(
          await this.getParticipantFormMissingFields(participant, isApplicant),
        );
      }
    }

    return [isApplicant, participant.id as string, requiredFieldsCount];
  }

  async changeParticipantForm(
    participantData: any,
    participantFormId: string,
    isApplicant: boolean,
    companyId: string,
    user?: IRequestUser | boolean,
    missingFields?: any,
  ): Promise<any> {
    if (user && typeof user !== 'boolean') {
      await this.companyService.checkUserCompanyPermission(
        user,
        participantFormId,
        'participantForm',
      );
    }

    const participant: any = isApplicant
      ? await this.applicantFormModel.findById(participantFormId)
      : await this.ownerFormModel.findById(participantFormId);

    if (!participant) {
      throw new NotFoundException('Form Not Found');
    }

    let participantStatusBefore = 'default';
    if (participant?.finCENID?.finCENID) {
      participantStatusBefore = 'finCEN';
    } else if (!isApplicant && participant?.exemptEntity?.isExemptEntity) {
      participantStatusBefore = 'entity';
    }

    let participantStatusAfter = 'default';
    if (participantData?.finCENID?.finCENID) {
      participantStatusAfter = 'finCEN';
    } else if (!isApplicant && participant?.exemptEntity?.isExemptEntity) {
      participantStatusAfter = 'entity';
    }

    if (
      participantStatusAfter === 'finCEN' &&
      participant?.identificationDetails?.docImg
    ) {
      await this.azureService.delete(participant.identificationDetails.docImg);
    }

    if (
      participantStatusBefore === participantStatusAfter ||
      (participantStatusBefore === 'entity' &&
        participantStatusAfter === 'default')
    ) {
      const updateDataKeys = Object.keys(participantData);
      for (const i of updateDataKeys) {
        participant[i] = { ...participant[i], ...participantData[i] };
      }
    } else if (participantStatusBefore === 'finCEN') {
      participant['finCENID'] = undefined;
      const updateDataKeys = Object.keys(participantData);
      for (const i of updateDataKeys) {
        participant[i] = { ...participant[i], ...participantData[i] };
      }
    } else if (participantStatusAfter === 'finCEN') {
      const participantKeys = Object.keys(participant);

      for (const i of participantKeys) {
        if (!(i == '_doc' || i == '$__' || i == '$isNew'))
          participant[i] = undefined;
      }

      if (!participant.finCENID) {
        participant.finCENID = {};
      }

      participant.finCENID.finCENID = participantData?.finCENID?.finCENID;
      participant.finCENID.isVerified = participantData.finCENID.isVerified;
      if (!isApplicant && participantData?.beneficialOwner?.isParentOrGuard) {
        participant.beneficialOwner.isParentOrGuard =
          participantData.beneficialOwner.isParentOrGuard;
      }
    } else if (!isApplicant && participantStatusAfter === 'entity') {
      const exemptEntityKeys = ['exempt entity', 'personalInfo', 'answerCount'];

      const updateDataKeys = Object.keys(participantData);
      const participantKeys = Object.keys(participant);
      for (const i of participantKeys) {
        if (exemptEntityKeys.includes(i) && updateDataKeys.includes(i)) {
          participant[i] = { ...participant[i], ...participantData[i] };
        } else if (
          !exemptEntityKeys.includes(i) &&
          !updateDataKeys.includes(i)
        ) {
          participant[i] = undefined;
        }
      }
    }

    participant.answerCount = participant?.finCENID?.finCENID
      ? isApplicant
        ? requiredApplicantFields.length
        : requiredOwnerFields.length
      : await calculateRequiredFieldsCount(
          participant,
          isApplicant
            ? requiredApplicantFields
            : participantStatusBefore === 'entity'
              ? requiredOwnerFieldWhichExemptEntity
              : requiredOwnerFields,
        );

    await participant.save();
    await this.companyService.changeCompanyCounts(companyId);

    if (missingFields && Object.keys(missingFields).length) {
      if (!missingFields[isApplicant ? 'applicants' : 'owners']) {
        missingFields[isApplicant ? 'applicants' : 'owners'] = [
          await this.getParticipantFormMissingFields(participant, isApplicant),
        ];
      } else {
        missingFields[isApplicant ? 'applicants' : 'owners'].push(
          await this.getParticipantFormMissingFields(participant, isApplicant),
        );
      }
    }

    return {
      participant,
      message: participantFormResponseMsgs.changed,
    };
  }

  async findParticipantFormByDocDataAndIds(
    docNum: string,
    docType: string,
    ids: any,
    isApplicant: boolean,
  ) {
    const participantForm = isApplicant
      ? await this.applicantFormModel.findOne({
          'identificationDetails.docNumber': docNum,
          'identificationDetails.docType': docType,
          _id: { $in: ids },
        })
      : await this.ownerFormModel.findOne({
          'identificationDetails.docNumber': docNum,
          'identificationDetails.docType': docType,
          _id: { $in: ids },
        });

    return participantForm;
  }

  async createParticipantForm(
    payload: any,
    companyId: string,
    isApplicant: boolean,
    user: IRequestUser,
  ) {
    // Check user permissions
    await this.companyService.checkUserCompanyPermission(
      user,
      companyId,
      'company',
    );

    const company = await this.companyService.getCompanyById(companyId);
    const { docType, docNumber } = payload?.identificationDetails;

    const existingParticipant = isApplicant
      ? await this.applicantFormModel.findOne({
          'identificationDetails.docType': docType,
          'identificationDetails.docNumber': docNumber,
        })
      : await this.ownerFormModel.findOne({
          'identificationDetails.docType': docType,
          'identificationDetails.docNumber': docNumber,
        });

    if (existingParticipant) {
      const isCompanyParticipant = company.forms[
        isApplicant ? 'applicants' : 'owners'
      ].includes(existingParticipant.id.toString());
      if (isCompanyParticipant) {
        Object.keys(payload).forEach((key) => {
          existingParticipant[key] = {
            ...existingParticipant[key],
            ...payload[key],
          };
        });

        existingParticipant.answerCount = await calculateRequiredFieldsCount(
          existingParticipant,
          isApplicant ? requiredApplicantFields : requiredOwnerFields,
        );

        await existingParticipant.save();
      } else {
        company.forms[isApplicant ? 'applicants' : 'owners'].push(
          existingParticipant.id.toString(),
        );
        await company.save();
      }
    } else {
      // Create a new participant and associate with the company
      const newParticipant = isApplicant
        ? await this.applicantFormModel.create(payload)
        : await this.ownerFormModel.create(payload);

      company.forms[isApplicant ? 'applicants' : 'owners'].push(
        newParticipant.id.toString(),
      );

      // Calculate initial answer count
      newParticipant.answerCount = newParticipant.finCENID?.finCENID
        ? isApplicant
          ? requiredApplicantFields.length
          : requiredOwnerFields.length
        : await calculateRequiredFieldsCount(
            newParticipant,
            isApplicant ? requiredApplicantFields : requiredOwnerFields,
          );

      await newParticipant.save();
      await company.save();
    }

    await this.companyService.changeCompanyCounts(companyId);
    const companyFormData =
      await this.companyService.getCurrentParticipantForms(
        companyId,
        isApplicant,
      );

    return { participantForms: companyFormData };
  }

  async getParticipantFormById(
    participantFormId: string,
    isApplicant: boolean,
    user: IRequestUser,
  ) {
    await this.companyService.checkUserCompanyPermission(
      user,
      participantFormId,
      'participantForm',
    );

    const participantForm = isApplicant
      ? await this.applicantFormModel.findById(participantFormId)
      : await this.ownerFormModel.findById(participantFormId);

    if (!participantForm) {
      throw new NotFoundException(companyFormResponseMsgs.companyFormNotFound);
    }

    return participantForm;
  }

  async deleteParticipantFormById(
    participantFormId: string,
    isApplicant: boolean,
    user?: IRequestUser,
    companyId?: string,
  ) {
    try {
      if (user) {
        await this.companyService.checkUserCompanyPermission(
          user,
          participantFormId,
          'participantForm',
        );
      }

      const participantForm = isApplicant
        ? await this.applicantFormModel.findOne({ _id: participantFormId })
        : await this.ownerFormModel.findOne({ _id: participantFormId });

      if (!participantForm) {
        throw new NotFoundException(participantFormResponseMsgs.formNotFound);
      }

      const imageName = participantForm.identificationDetails?.docImg;

      if (imageName) {
        await this.azureService.delete(imageName);
      }

      if (companyId) {
        await this.companyService.removeParticipantFromCompany(
          participantFormId,
          companyId,
          isApplicant,
        );
      }

      if (isApplicant) {
        await this.applicantFormModel.findByIdAndDelete(participantFormId);
      } else {
        await this.ownerFormModel.findByIdAndDelete(participantFormId);
      }

      const companyFormData =
        await this.companyService.getCurrentParticipantForms(
          companyId,
          isApplicant,
        );

      return {
        message: participantFormResponseMsgs.deleted,
        participantForms: companyFormData,
      };
    } catch (error) {
      console.log(error);
    }
  }

  async updateDocImageInParticipantForm(
    participantId: string,
    docImg: Express.Multer.File,
    user: any,
    isApplicant: boolean,
  ) {
    await this.companyService.checkUserCompanyPermission(
      user,
      participantId,
      'participantForm',
    );
    const company = await this.companyService.getByParticipantId(
      participantId,
      isApplicant,
    );

    const docImgName = await this.azureService.uploadImage(docImg);
    await this.changeParticipantForm(
      { identificationDetails: { docImg: docImgName } },
      participantId,
      isApplicant,
      company['id'],
    );

    return { message: participantFormResponseMsgs.changed, docImg: docImgName };
  }

  async uploadAnImageAndCreate(
    companyId: string,
    docImg: Express.Multer.File,
    payload: {
      docNumber: string;
      docType: string;
      countryOrJurisdiction?: string;
      state?: string;
      localOrTribal?: string;
      otherLocalOrTribal?: string;
    },
    isApplicant: boolean,
    user: IRequestUser,
  ) {
    await this.companyService.checkUserCompanyPermission(
      user,
      companyId,
      'company',
    );

    const { docNumber, docType } = payload;
    const company = await this.companyService.getCompanyById(companyId);
    const docImgName = await this.azureService.uploadImage(docImg);
    const participantIsExist = isApplicant
      ? await this.applicantFormModel.findOne({
          ['identificationDetails.docNumber']: docNumber,
          ['identificationDetails.docType']: docType,
        })
      : await this.ownerFormModel.findOne({
          ['identificationDetails.docNumber']: docNumber,
          ['identificationDetails.docType']: docType,
        });

    if (participantIsExist) {
      if (
        company.forms[isApplicant ? 'applicants' : 'owners'].includes(
          participantIsExist['id'],
        )
      ) {
        throw new ConflictException('Current Participant is already exist');
      }
    }

    const identificationDetails = { ...payload, docImg: docImgName };
    const createdParticipant = isApplicant
      ? await this.applicantFormModel.create({
          identificationDetails,
          answerCount: payload.countryOrJurisdiction ? 4 : 3,
        })
      : await this.ownerFormModel.create({
          identificationDetails,
          answerCount: payload.countryOrJurisdiction ? 4 : 3,
        });

    company.forms[`${isApplicant ? 'applicants' : 'owners'}`].push(
      createdParticipant['id'],
    );

    await company.save();
    await this.companyService.changeCompanyCounts(companyId);

    const companyFormData =
      await this.companyService.getCurrentParticipantForms(
        companyId,
        isApplicant,
      );

    return {
      message: participantFormResponseMsgs.created,
      participantId: createdParticipant['id'],
      docImg: docImgName,
      participantForms: companyFormData,
    };
  }

  async getAllCompanyParticipants(isApplicant: boolean, companyId: string) {
    const userParticipants =
      await this.companyService.getUserCompanyParticipants(
        companyId,
        isApplicant,
      );

    const filtered = userParticipants.map((participant: any) => {
      const participantKeys = [
        'finCENID',
        'personalInfo',
        'address',
        'identificationDetails',
        'exemptEntity',
        'beneficialOwner',
      ];
      const allVerified = Object.keys(participant['_doc']).every((key) => {
        if (participantKeys.includes(key)) {
          return participant[key]?.isVerified || false;
        } else {
          return true;
        }
      });
      return {
        participantId: participant['id'],
        name:
          participant?.personalInfo?.firstName ||
          `New ${isApplicant ? 'applicant' : 'owner'}`,
        allVerified,
        percentage: Math.floor(
          (isApplicant
            ? participant.answerCount / 12
            : participant?.exemptEntity?.isExemptEntity
              ? participant.answerCount / 1
              : participant.answerCount / 11) * 100,
        ),
      };
    });
    return {
      message: participantFormResponseMsgs.retrieved,
      filtered,
    };
  }

  async getParticipantFormMissingFields(
    participantForm: ApplicantFormDocument | OwnerFormDocument | any,
    isApplicant: boolean,
  ) {
    const formFields = isApplicant ? applicantFormFields : ownerFormFields;
    const topLevelKeys = Object.keys(formFields);
    const missingFields: string[] = [];
    const isExemptEntity =
      !isApplicant && participantForm?.exemptEntity?.isExemptEntity;
    topLevelKeys.forEach((topLevelKey) => {
      if (participantForm[topLevelKey]) {
        Object.keys(formFields[topLevelKey]).forEach((lowLevelKey) => {
          if (
            participantForm[topLevelKey][lowLevelKey] === '' ||
            participantForm[topLevelKey][lowLevelKey] === undefined ||
            participantForm[topLevelKey][lowLevelKey] === null
          ) {
            if (!participantForm['finCENID']) {
              if (
                topLevelKey === 'identificationDetails' &&
                (lowLevelKey !== 'docNumber' || 'docType')
              ) {
                if (
                  lowLevelKey === 'state' ||
                  lowLevelKey === 'localOrTribal' ||
                  (lowLevelKey === 'otherLocalOrTribalDesc' &&
                    participantForm[topLevelKey].countryOrJurisdiction ===
                      UNITED_STATES) ||
                  participantForm[topLevelKey].countryOrJurisdiction ===
                    MEXICO ||
                  participantForm[topLevelKey].countryOrJurisdiction === CANADA
                ) {
                  if (
                    (lowLevelKey === 'state' &&
                      !participantForm[topLevelKey].localOrTribal) ||
                    (lowLevelKey === 'localOrTribal' &&
                      !participantForm[topLevelKey].state) ||
                    (lowLevelKey === 'otherLocalOrTribalDesc' &&
                      participantForm[topLevelKey].localOrTribal === 'Other' &&
                      !participantForm[topLevelKey].otherLocalOrTribalDesc)
                  ) {
                    missingFields.push(formFields[topLevelKey][lowLevelKey]);
                  }
                } else if (
                  lowLevelKey === 'state' &&
                  countriesWithStates.includes(
                    participantForm[topLevelKey].countryOrJurisdiction,
                  )
                ) {
                  missingFields.push(formFields[topLevelKey][lowLevelKey]);
                }
              } else {
                if (!isApplicant && isExemptEntity) {
                  if (
                    !(
                      topLevelKey === 'address' ||
                      topLevelKey === 'beneficialOwner'
                    )
                  ) {
                    if (topLevelKey === 'personalInfo') {
                      if (
                        lowLevelKey === 'lastOrLegalName' &&
                        !participantForm[topLevelKey][lowLevelKey]
                      ) {
                        missingFields.push(
                          formFields[topLevelKey][lowLevelKey],
                        );
                      }
                    }
                  }
                } else {
                  missingFields.push(formFields[topLevelKey][lowLevelKey]);
                }
              }
            }
          }
        });
      }
    });

    return missingFields;
  }

  async changeForForeignPooled(
    company: CompanyDocument,
    ownerData?: any,
    isUploadedData?: boolean,
  ) {
    const currentCompanyOwners = company.forms.owners;
    company.populate({ path: 'forms.owners', model: 'OwnerForm' });
    const currentCompanyOwnersCount = currentCompanyOwners.length;

    if (
      !currentCompanyOwnersCount ||
      (isUploadedData && currentCompanyOwnersCount === 1)
    ) {
      return;
    }

    if (ownerData) {
      const isExistedOwner = currentCompanyOwners.find((owner) => {
        if (ownerData?.finCENID?.finCENID) {
          return owner.finCENID.finCENID === ownerData.finCENID.finCENID;
        } else if (ownerData?.exemptEntity?.isExemptEntity) {
          return (
            owner?.exemptEntity?.isExemptEntity ===
              ownerData?.exemptEntity?.isExemptEntity &&
            ownerData?.personalInfo?.lastOrLegalName ===
              owner?.personalInfo?.lastOrLegalName
          );
        } else if (
          ownerData?.identificationDetails?.docType &&
          ownerData?.identificationDetails?.docNumber
        ) {
          return (
            owner?.identificationDetails?.docType ===
              ownerData?.identificationDetails?.docType &&
            ownerData?.identificationDetails?.docNumber ===
              owner?.identificationDetails?.docNumber
          );
        }
        return;
      });

      if (isExistedOwner) {
        company.forms.owners = currentCompanyOwners.filter(
          (owner) => owner['id'] !== isExistedOwner['id'],
        );
      } else {
        company.forms.owners.length = 0;
        company.forms.owners.push(isExistedOwner['id']);
      }
    }

    if (!isUploadedData) {
      await company.save();
    }
  }

  async getByFinCENId(finCENId: string, isApplicant: boolean) {
    const participant = isApplicant
      ? await this.applicantFormModel.findOne({
          ['finCENID.finCENID']: finCENId,
        })
      : await this.ownerFormModel.findOne({ ['finCENID.finCENID']: finCENId });
    return participant;
  }

  async removeParticipantDocumentImage(
    participantId: string,
    user: IRequestUser,
    isApplicant: boolean,
    companyId: string,
  ) {
    await this.companyService.checkUserCompanyPermission(
      user,
      participantId,
      'participantForm',
    );

    const participant = isApplicant
      ? await this.applicantFormModel.findById(participantId)
      : await this.ownerFormModel.findById(participantId);

    if (!participant) {
      throw new NotFoundException(participantFormResponseMsgs.formNotFound);
    }

    if (!participant.identificationDetails.docImg) {
      throw new BadRequestException('current participant dont have an image');
    }

    await this.azureService.delete(participant.identificationDetails.docImg);

    await this.companyService.changeCompanyCounts(companyId);

    return { message: 'image deleted' };
  }
}
