import { IRequestUser } from '@/auth/interfaces/request.interface';
import { AzureService } from '@/azure/azure.service';
import { companyFormResponseMsgs } from '@/company-form/constants';
import { CompanyService } from '@/company/company.service';
import {
  CANADA,
  countriesWithStates,
  MEXICO,
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
import { ownerFormFields, ownerFormResponseMsgs } from './constants';
import { OwnerForm, OwnerFormDocument } from './schemas/owner-form.schema';

@Injectable()
export class OwnerFormService {
  constructor(
    @InjectModel(OwnerForm.name)
    private ownerFormModel: Model<OwnerFormDocument>,
    @Inject(forwardRef(() => CompanyService))
    private readonly companyService: CompanyService,
    private readonly azureService: AzureService,
  ) {}

  async createOwnerFormFromCsv(
    companyOwnerData: any,
    missingFields?: any,
  ): Promise<[string, number]> {
    const updatedOwnerData = this.addIsVerifiedFlag(companyOwnerData);
    const owner = new this.ownerFormModel(updatedOwnerData);

    owner.answerCount = await calculateRequiredFieldsCount(
      owner,
      requiredOwnerFields,
    );

    await owner.save();

    if (missingFields) {
      if (!missingFields['owners']) {
        const getMissingData = await this.getOwnerFormMissingFields(owner);
        if (getMissingData.length) {
          missingFields['owners'] = [getMissingData];
        }
      } else {
        missingFields['owners'].push(
          await this.getOwnerFormMissingFields(owner),
        );
      }
    }

    return [owner.id as string, owner.answerCount];
  }

  async changeOwnerForm(
    ownerData: any,
    ownerFormId: string,
    companyId: string,
    user?: IRequestUser | boolean,
    missingFields?: any,
  ): Promise<any> {
    if (user && typeof user !== 'boolean') {
      await this.companyService.checkUserCompanyPermission(
        user,
        ownerFormId,
        'ownerForm',
      );
    }

    const owner: any = await this.ownerFormModel.findById(ownerFormId);

    if (!owner) {
      throw new NotFoundException('Form Not Found');
    }

    const updateDataKeys = Object.keys(ownerData);
    for (const i of updateDataKeys) {
      owner[i] = { ...owner[i], ...ownerData[i] };
    }

    owner.answerCount = requiredOwnerFields.length;

    await owner.save();
    await this.companyService.changeCompanyCounts(companyId);

    if (missingFields && Object.keys(missingFields).length) {
      if (!missingFields['owners']) {
        missingFields['owners'] = [await this.getOwnerFormMissingFields(owner)];
      } else {
        missingFields['owners'].push(
          await this.getOwnerFormMissingFields(owner),
        );
      }
    }

    return {
      owner,
      message: ownerFormResponseMsgs.changed,
    };
  }

  async findParticipantFormByDocDataAndIds(
    docNum: string,
    docType: string,
    ids: any,
  ) {
    const ownerForm = await this.ownerFormModel.findOne({
      'identificationDetails.docNumber': docNum,
      'identificationDetails.docType': docType,
      _id: { $in: ids },
    });

    return ownerForm;
  }

  async createParticipantForm(
    payload: any,
    companyId: string,
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

    const existingOwner = await this.ownerFormModel.findOne({
      'identificationDetails.docType': docType,
      'identificationDetails.docNumber': docNumber,
    });

    if (existingOwner) {
      const isCompanyParticipant = company.forms['owners'].includes(
        existingOwner.id.toString(),
      );

      if (isCompanyParticipant) {
        Object.keys(payload).forEach((key) => {
          existingOwner[key] = {
            ...existingOwner[key],
            ...payload[key],
          };
        });

        existingOwner.answerCount = await calculateRequiredFieldsCount(
          existingOwner,
          requiredOwnerFields,
        );

        await existingOwner.save();
      } else {
        company.forms['owners'].push(existingOwner.id.toString());
        await company.save();
      }
    } else {
      // Create a new participant and associate with the company
      const newOwner = await this.ownerFormModel.create(payload);

      company.forms['owners'].push(newOwner.id.toString());

      newOwner.answerCount = requiredOwnerFields.length;

      await newOwner.save();
      await company.save();
    }

    await this.companyService.changeCompanyCounts(companyId);
    const companyFormData =
      await this.companyService.getCurrentOwnerForms(companyId);

    return { participantForms: companyFormData };
  }

  async getOwnerFormById(ownerFormId: string, user: IRequestUser) {
    await this.companyService.checkUserCompanyPermission(
      user,
      ownerFormId,
      'ownerForm',
    );

    const participantForm = await this.ownerFormModel.findById(ownerFormId);

    if (!participantForm) {
      throw new NotFoundException(companyFormResponseMsgs.companyFormNotFound);
    }

    return participantForm;
  }

  async deleteOwnerFormById(
    ownerFormId: string,
    user?: IRequestUser,
    companyId?: string,
  ) {
    try {
      if (user) {
        await this.companyService.checkUserCompanyPermission(
          user,
          ownerFormId,
          'ownerForm',
        );
      }

      const participantForm = await this.ownerFormModel.findOne({
        _id: ownerFormId,
      });

      if (!participantForm) {
        throw new NotFoundException(ownerFormResponseMsgs.formNotFound);
      }

      const imageName = participantForm.identificationDetails?.docImg;

      if (imageName) {
        await this.azureService.delete(imageName);
      }

      if (companyId) {
        await this.companyService.removeOwnerFromCompany(
          ownerFormId,
          companyId,
        );
      }

      await this.ownerFormModel.findByIdAndDelete(ownerFormId);

      const companyFormData =
        await this.companyService.getCurrentOwnerForms(companyId);

      return {
        message: ownerFormResponseMsgs.deleted,
        participantForms: companyFormData,
      };
    } catch (error) {
      console.log(error);
    }
  }

  async updateDocImageInParticipantForm(
    ownerId: string,
    docImg: Express.Multer.File,
    user: any,
  ) {
    await this.companyService.checkUserCompanyPermission(
      user,
      ownerId,
      'ownerForm',
    );
    const company = await this.companyService.getByOwnerId(ownerId);

    const docImgName = await this.azureService.uploadImage(docImg);
    await this.changeOwnerForm(
      { identificationDetails: { docImg: docImgName } },
      ownerId,
      company['id'],
    );

    return { message: ownerFormResponseMsgs.changed, docImg: docImgName };
  }

  async uploadAnImageAndCreate(
    companyId: string,
    docImg: Express.Multer.File,
    payload: any,
    user: IRequestUser,
  ) {
    await this.companyService.checkUserCompanyPermission(
      user,
      companyId,
      'company',
    );

    const payloadKeys = Object.keys(payload);
    const filteredData: any = {};

    payloadKeys.forEach((keyWithDot) => {
      if (keyWithDot !== 'docImg') {
        const [fieldName, fieldKey]: any = keyWithDot.split('.');

        if (!filteredData[fieldName]) {
          filteredData[fieldName] = { [fieldKey]: payload[keyWithDot] };
        } else {
          filteredData[fieldName][fieldKey] = payload[keyWithDot];
        }
      }
    });

    const company = await this.companyService.getCompanyById(companyId);
    const docImgName = await this.azureService.uploadImage(docImg);
    if (filteredData.identificationDetails) {
      filteredData.identificationDetails.docImg = docImgName;
    }

    const ownerIsExist = await this.ownerFormModel.findOne({
      ['identificationDetails.docNumber']:
        payload['identificationDetails.docNumber'],
      ['identificationDetails.docType']:
        payload['identificationDetails.docNumber'],
    });

    if (ownerIsExist) {
      if (company.forms['owners'].includes(ownerIsExist['id'])) {
        throw new ConflictException('Current Participant is already exist');
      }
    }

    const createdOwner = await this.ownerFormModel.create({
      ...filteredData,
    });

    createdOwner.answerCount = await calculateRequiredFieldsCount(
      createdOwner,
      requiredOwnerFields,
    );

    await createdOwner.save();

    company.forms['owners'].push(createdOwner['id']);

    await company.save();
    await this.companyService.changeCompanyCounts(companyId);

    const companyFormData =
      await this.companyService.getCurrentOwnerForms(companyId);

    return {
      message: ownerFormResponseMsgs.created,
      participantId: createdOwner['id'],
      docImg: docImgName,
      participantForms: companyFormData,
    };
  }

  async getAllCompanyOwners(companyId: string) {
    const userOwners =
      await this.companyService.getUserCompanyOwners(companyId);

    const filtered = userOwners.map((participant: any) => {
      const ownerKeys = [
        'personalInfo',
        'address',
        'identificationDetails',
        'beneficialOwner',
      ];
      const allVerified = Object.keys(participant['_doc']).every((key) => {
        if (ownerKeys.includes(key)) {
          return participant[key]?.isVerified || false;
        } else {
          return true;
        }
      });
      return {
        participantId: participant['id'],
        name: participant?.personalInfo?.firstName || `New owner`,
        allVerified,
        percentage: Math.floor((participant.answerCount / 11) * 100),
      };
    });
    return {
      message: ownerFormResponseMsgs.retrieved,
      filtered,
    };
  }

  async getOwnerFormMissingFields(ownerForm: OwnerFormDocument | any) {
    const formFields = ownerFormFields;
    const topLevelKeys = Object.keys(formFields);
    const missingFields: string[] = [];
    topLevelKeys.forEach((topLevelKey) => {
      if (ownerForm[topLevelKey]) {
        Object.keys(formFields[topLevelKey]).forEach((lowLevelKey) => {
          if (
            ownerForm[topLevelKey][lowLevelKey] === '' ||
            ownerForm[topLevelKey][lowLevelKey] === undefined ||
            ownerForm[topLevelKey][lowLevelKey] === null
          ) {
            if (
              topLevelKey === 'identificationDetails' &&
              (lowLevelKey !== 'docNumber' || 'docType')
            ) {
              if (
                lowLevelKey === 'state' ||
                lowLevelKey === 'localOrTribal' ||
                (lowLevelKey === 'otherLocalOrTribalDesc' &&
                  ownerForm[topLevelKey].countryOrJurisdiction ===
                    UNITED_STATES) ||
                ownerForm[topLevelKey].countryOrJurisdiction === MEXICO ||
                ownerForm[topLevelKey].countryOrJurisdiction === CANADA
              ) {
                if (
                  (lowLevelKey === 'state' &&
                    !ownerForm[topLevelKey].localOrTribal) ||
                  (lowLevelKey === 'localOrTribal' &&
                    !ownerForm[topLevelKey].state) ||
                  (lowLevelKey === 'otherLocalOrTribalDesc' &&
                    ownerForm[topLevelKey].localOrTribal === 'Other' &&
                    !ownerForm[topLevelKey].otherLocalOrTribalDesc)
                ) {
                  missingFields.push(formFields[topLevelKey][lowLevelKey]);
                }
              } else if (
                lowLevelKey === 'state' &&
                countriesWithStates.includes(
                  ownerForm[topLevelKey].countryOrJurisdiction,
                )
              ) {
                missingFields.push(formFields[topLevelKey][lowLevelKey]);
              }
            } else {
              missingFields.push(formFields[topLevelKey][lowLevelKey]);
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
        if (
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

  async removeOwnerDocumentImage(
    ownerId: string,
    user: IRequestUser,
    companyId: string,
  ) {
    await this.companyService.checkUserCompanyPermission(
      user,
      ownerId,
      'ownerForm',
    );

    const owner = await this.ownerFormModel.findById(ownerId);

    if (!owner) {
      throw new NotFoundException(ownerFormResponseMsgs.formNotFound);
    }

    if (!owner.identificationDetails.docImg) {
      throw new BadRequestException('current owner dont have an image');
    }

    await this.azureService.delete(owner.identificationDetails.docImg);
    owner.identificationDetails.docImg = undefined;
    owner.answerCount = owner.answerCount - 1;
    if (owner.identificationDetails?.isVerified)
      owner.identificationDetails.isVerified = false;
    await owner.save();

    await this.companyService.changeCompanyCounts(companyId);

    return { message: 'image deleted' };
  }

  async removeImageFromOwner(ownerId: string) {
    const owner: null | OwnerFormDocument =
      await this.ownerFormModel.findById(ownerId);

    if (!owner) {
      throw new NotFoundException(ownerFormResponseMsgs.formNotFound);
    }

    owner.identificationDetails.docImg = undefined;
    owner.answerCount = owner.answerCount - 1;
    if (owner.identificationDetails?.isVerified)
      owner.identificationDetails.isVerified = false;

    await owner.save();

    const company = await this.companyService.getByOwnerId(ownerId);
    if (company) await this.companyService.changeCompanyCounts(company._id);
  }

  private addIsVerifiedFlag(data: any): any {
    if (typeof data === 'object' && data !== null) {
      for (const key in data) {
        if (
          typeof data[key] === 'object' &&
          key !== 'dateOfBirth' &&
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
