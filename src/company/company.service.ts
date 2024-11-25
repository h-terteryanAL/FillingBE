import { IRequestUser } from '@/auth/interfaces/request.interface';
import { CompanyFormService } from '@/company-form/company-form.service';
import { IUserInvitationEmail } from '@/mail/interfaces/mail.interface';
import { MailService } from '@/mail/mail.service';
import { ParticipantFormService } from '@/participant-form/participant-form.service';
import { UserService } from '@/user/user.service';
import { sanitizeData } from '@/utils/csv-sanitize';
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { parse } from 'fast-csv';
import * as moment from 'moment';
import mongoose, { Model } from 'mongoose';
import * as Stream from 'stream';
import { companyResponseMsgs } from './constants';
import { ISanitizedData } from './interfaces';
import { ICompanyCSVRowData } from './interfaces/company-csv.interface';
import { Company, CompanyDocument } from './schemas/company.schema';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    private readonly companyFormService: CompanyFormService,
    private readonly participantFormService: ParticipantFormService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {}

  async getAllCompanies(): Promise<CompanyDocument[]> {
    const companies = await this.companyModel.find();
    // let selection: string;
    // if (query?.expTime) {
    //   query['expiationTime'] = query.expirationTime;
    // }

    // const companies = await this.companyModel
    //   .find()
    //   .limit(query?.size)
    //   .skip(query?.page === 0 ? query?.page : query?.size * query?.page)
    //   .populate({
    //     path: 'user',
    //     model: 'User',
    //     select: 'firstName email',
    //   })
    //   .exec();

    return companies;
  }

  async addCsvDataIntoDb(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException(companyResponseMsgs.csvFileIsMissing);
    }

    const bufferStream = new Stream.PassThrough();
    bufferStream.end(file.buffer);

    const resultData: any[] = await new Promise((resolve, reject) => {
      const results: any[] = [];
      const headers: string[] = [];

      bufferStream
        .pipe(parse({ headers: false, delimiter: ',', quote: '"' }))
        .on('data', (row: string[]) => {
          if (headers.length === 0) {
            row.forEach((header) => headers.push(header.trim()));
          } else {
            const rowData: any = {};
            row.forEach((value, index) => {
              const header = headers[index].trim();
              if (!rowData[header]) {
                rowData[header] = [value.trim()];
              } else {
                rowData[header].push(value.trim());
              }
            });

            results.push(rowData);
          }
        })
        .on('end', () => resolve(results))
        .on('error', reject);
    });

    const allErrors = [];
    const allReasons = [];
    const allMissingFields = [];
    const companiesResults = [];
    await Promise.all(
      resultData.map(async (row: ICompanyCSVRowData) => {
        const { sanitized, errorData, reasons, companyDeleted } =
          await sanitizeData(row);
        if (Object.keys(errorData).length) allErrors.push(errorData);
        if (Object.keys(reasons).length) allReasons.push(reasons);
        if (!companyDeleted) {
          const changedCompanyData = await this.ParseCsvData(
            sanitized,
            allReasons,
          );
          if (!changedCompanyData) {
            companiesResults.push(
              `${sanitized.company.names.legalName || 'Company'} data could not be added due to missing or incorrect information.`,
            );
            return;
          }
          companiesResults.push(
            `${sanitized.company.names.legalName || 'Company'} created/changed`,
          );
          allMissingFields.push(changedCompanyData);
        } else {
          companiesResults.push(
            `${sanitized.company.names.legalName || 'Company'} data could not be added due to missing or incorrect information.`,
          );
        }
      }),
    );

    return {
      message: companyResponseMsgs.csvUploadSuccessful,
      errors: allErrors,
      problemReasons: allReasons,
      currentMissingFields: allMissingFields,
      companiesResultsMessage: companiesResults,
    };
  }

  private async ParseCsvData(sanitized: ISanitizedData, errorReasons: any) {
    const missingFields: any = {};
    const companyFormData =
      await this.companyFormService.getCompanyFormByTaxData(
        sanitized.company.taxInfo.taxIdNumber,
        sanitized.company.taxInfo.taxIdType,
      );
    const companyFormId = companyFormData && companyFormData['id'];

    let company =
      companyFormId &&
      (await this.companyModel.findOne({
        'forms.company': companyFormId,
      }));

    const userEmailData: IUserInvitationEmail = {
      email: '',
      fullName: '',
      companyName: '',
      isNewCompany: true,
    };

    if (!company) {
      company = await this.createNewCompanyFromCsv(
        sanitized,
        userEmailData,
        missingFields,
        errorReasons,
      );

      if (!company) {
        return;
      }
    } else {
      const updatedCompany = await this.changeCompanyByCsv(
        company,
        companyFormId,
        sanitized,
        userEmailData,
        missingFields,
      );
      if (!updatedCompany) {
        return;
      }
    }

    if (sanitized.BOIRExpTime) {
      company.expTime = sanitized.BOIRExpTime;
    }

    company.reqFieldsCount = this.calculateReqFieldsCount(company);

    const user = await this.userService.findOrCreateUser(
      sanitized.user.email || null,
      sanitized.user.firstName,
      sanitized.user.lastName,
      company['_id'] as unknown as string,
      (company.user as unknown as string) || null,
    );

    if (!company.user && user) {
      company.user = user['id'];
    }

    await company.save();

    if (user) {
      userEmailData.email = user.email;
      userEmailData.fullName = `${user.firstName} ${user.lastName}`;
      await this.mailService.sendInvitationEmailToFormFiller(userEmailData);
    }

    return missingFields;
  }

  private async createNewCompanyFromCsv(
    sanitized: ISanitizedData,
    userEmailData: IUserInvitationEmail,
    missingFields: any,
    errorReasons: any,
  ) {
    let company = null;

    if (!sanitized.BOIRExpTime) {
      errorReasons.push({
        fields: 'BOIR Submission Deadline',
        problemDesc: 'BOIR expiration time is required for company creating',
      });
      return;
    }

    const isExistingCompany = sanitized.company.isExistingCompany;
    const applicantIsNotRequired =
      sanitized.company.isExistingCompany ||
      sanitized.company.repCompanyInfo.foreignPooled ||
      false;
    delete sanitized.company.isExistingCompany;

    const ownersIds = [];
    const applicantsIds = [];
    let answerCount = 0;

    if (!sanitized.company.names.legalName) {
      errorReasons.push({
        fields: 'Company LegalName',
        problemDesc: companyResponseMsgs.companyNameMissing,
      });

      return;
    }

    const participantsData = (
      await Promise.all(
        sanitized.participants.map((participant) => {
          if (
            !participant.isApplicant ||
            (participant.isApplicant && !applicantIsNotRequired)
          ) {
            return this.participantFormService.createParticipantFormFromCsv(
              participant,
              missingFields,
            );
          }
        }),
      )
    ).filter(Boolean);

    if (participantsData && participantsData.length) {
      participantsData.forEach((participant) => {
        if (participant[0]) {
          applicantsIds.push(participant[1]);
        } else {
          ownersIds.push(participant[1]);
        }

        answerCount += participant[2];
      });
    }

    const companyForm = await this.companyFormService.createCompanyFormFromCsv(
      sanitized.company,
    );

    missingFields.company = companyForm.missingFormData;
    answerCount += companyForm.answerCount;

    company = new this.companyModel({
      isExistingCompany,
      ['forms.company']: companyForm.id,
      name: companyForm.companyName,
      expTime: sanitized.BOIRExpTime,
      ['forms.owners']: ownersIds,
      ...(applicantIsNotRequired
        ? {}
        : { ['forms.applicants']: applicantsIds }),
    });

    company.answersCount = answerCount;
    company.reqFieldsCount = this.calculateReqFieldsCount(company);

    userEmailData.companyName = company.name;
    userEmailData.isNewCompany = true;

    return company;
  }

  private async changeCompanyByCsv(
    company: CompanyDocument,
    companyFormId: string,
    sanitized: ISanitizedData,
    userEmailData: IUserInvitationEmail,
    missingFields: { company?: string[] },
  ) {
    try {
      const foreignPooled = { isForeignPooled: false };
      await this.companyFormService.updateCompanyForm(
        sanitized.company,
        companyFormId,
        company['id'],
        false,
        missingFields,
        foreignPooled,
        true,
        company,
      );

      if (foreignPooled.isForeignPooled) {
        await this.participantFormService.changeForForeignPooled(
          company,
          sanitized.participants.find(
            (participant) => !participant.isApplicant,
          ),
          true,
        );
      }

      const participantPromises = sanitized.participants.map(
        async (participant) => {
          const existParticipant = participant.finCENID
            ? await this.participantFormService.getByFinCENId(
                participant.finCENID.finCENID,
                participant.isApplicant,
              )
            : await this.participantFormService.findParticipantFormByDocDataAndIds(
                participant.identificationDetails.docNumber,
                participant.identificationDetails.docType,
                participant.isApplicant
                  ? company.forms.applicants
                  : company.forms.owners,
                participant.isApplicant,
              );

          if (existParticipant) {
            await this.participantFormService.changeParticipantForm(
              participant,
              existParticipant['id'],
              participant['isApplicant'],
              company['id'],
              false,
              missingFields,
            );
          } else {
            const newParticipant =
              await this.participantFormService.createParticipantFormFromCsv(
                participant,
                missingFields,
              );
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            newParticipant[0]
              ? company.forms.applicants.push(newParticipant[1])
              : company.forms.owners.push(newParticipant[1]);

            company.answersCount += newParticipant[2];
          }
        },
      );

      const companyUser = await this.userService.getUserById(
        company.user as unknown as string,
      );

      if (companyUser.email !== sanitized.user.email) {
        try {
          await this.userService.removeCompanyFromUser(
            company.user as unknown as string,
            company['id'],
          );
          company.user = undefined;
        } catch (error) {
          console.error(error);
        }
      }

      userEmailData.companyName = company.name;
      userEmailData.isNewCompany = false;
      company.isSubmitted = false;
      await Promise.all(participantPromises);

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async getCompaniesByIds(companyIds: string[]) {
    const companies = await this.companyModel.find({
      _id: { $in: companyIds.map((id) => new mongoose.Types.ObjectId(id)) },
    });

    return companies;
  }

  async deleteCompanyById(companyId: string): Promise<{ message: string }> {
    const company = await this.companyModel.findById(companyId);

    if (!company) {
      throw new NotFoundException(companyResponseMsgs.companyNotFound);
    }

    if (company.forms.applicants && company.forms.applicants.length) {
      const applicantForms = company.forms.applicants.map(
        async (applicant) =>
          await this.participantFormService.deleteParticipantFormById(
            applicant as unknown as string,
            true,
          ),
      );

      await Promise.all(applicantForms);
    }

    if (company.forms.owners.length) {
      const ownerForms = company.forms.owners.map(
        async (owner) =>
          await this.participantFormService.deleteParticipantFormById(
            owner as unknown as string,
            false,
          ),
      );

      await Promise.all(ownerForms);
    }

    await this.userService.removeCompanyFromUser(
      company.user as unknown as string,
      companyId,
    );
    await this.companyFormService.deleteCompanyFormById(
      company.forms.company as any,
    );

    await this.companyModel.deleteOne({ _id: companyId });

    return { message: companyResponseMsgs.companyDeleted };
  }

  async getCompanyById(companyId: string): Promise<CompanyDocument> {
    const company = await this.companyModel.findById(companyId);

    if (!company) {
      throw new NotFoundException(companyResponseMsgs.companyNotFound);
    }

    return company;
  }

  async findExpiringCompanies(days?: number) {
    const now = moment.utc();

    const expirationFilter = days
      ? days === 7
        ? {
            $lt: now.clone().add(7, 'days').endOf('day').toDate(),
            $gt: now.clone().add(1, 'days').endOf('day').toDate(),
          }
        : {
            $lt: now.clone().add(1, 'days').endOf('day').toDate(),
          }
      : {
          $lt: now.toDate(),
        };

    const companies = await this.companyModel
      .find(
        {
          expTime: expirationFilter,
          isPaid: false,
        },
        {
          name: 1,
          _id: 0,
        },
      )
      .populate({
        path: 'user',
        select: 'firstName lastName email',
      })
      .exec();

    return companies;
  }

  async getByParticipantId(
    participantId: string,
    isApplicant: boolean,
  ): Promise<CompanyDocument> {
    const formType = isApplicant ? 'forms.applicants' : 'forms.owners';
    const company = await this.companyModel.findOne({
      [formType]: participantId,
    });

    if (!company) {
      throw new NotFoundException(companyResponseMsgs.companyNotFound);
    }

    return company;
  }

  async checkUserCompanyPermission(
    user: IRequestUser,
    fieldId: string,
    fieldName: 'participantForm' | 'companyForm' | 'company',
  ): Promise<void> {
    if (user) {
      const { role, userId } = user;
      let foundCompany = null;

      if (role !== 'admin') {
        if (fieldName === 'company') {
          foundCompany = await this.companyModel.findById(fieldId);
        } else if (fieldName === 'participantForm') {
          foundCompany = await this.companyModel.findOne({
            user: userId,
            $or: [{ 'forms.applicants': fieldId }, { 'forms.owners': fieldId }],
          });
        } else if (fieldName === 'companyForm') {
          foundCompany = await this.companyModel.findOne({
            user: userId,
            'forms.company': fieldId,
          });
        }

        if (!foundCompany) {
          throw new ForbiddenException(companyResponseMsgs.dontHavePermission);
        }
      }
    }
  }

  private calculateReqFieldsCount(
    company: CompanyDocument,
    countOfExemptEntity?: number,
  ): number {
    countOfExemptEntity = countOfExemptEntity ? countOfExemptEntity : 0;
    return (
      company.forms.applicants.length * 12 +
      (company.forms.owners.length - countOfExemptEntity) * 11 +
      countOfExemptEntity * 1 +
      9
    );
  }

  async changeCompanyCounts(companyId: string): Promise<void> {
    const company = await this.companyModel.findById(companyId);

    if (!company) {
      throw new NotFoundException(companyResponseMsgs.companyNotFound);
    }

    await company.populate({
      path: 'forms.company',
      select: 'answerCount -_id',
    });

    await company.populate({
      path: 'forms.applicants',
      select: 'answerCount -_id',
    });

    await company.populate({
      path: 'forms.owners',
      select: 'answerCount -_id',
    });

    const applicantIsNotRequired =
      company.isExistingCompany ||
      company.forms.company.repCompanyInfo?.foreignPooled;

    let countOfEntityOwners = 0;
    if (company.forms.owners) {
      company.forms.owners.forEach((owner) => {
        if (owner?.exemptEntity?.isExemptEntity) ++countOfEntityOwners;
      });
    }

    company.reqFieldsCount = applicantIsNotRequired
      ? 9 +
        (company.forms.owners.length - countOfEntityOwners) * 11 +
        countOfEntityOwners * 1
      : this.calculateReqFieldsCount(company, countOfEntityOwners);

    let totalCount = 0;

    if (!applicantIsNotRequired) {
      company.forms.applicants.forEach(
        (applicant) => (totalCount += applicant.answerCount),
      );
    }
    company.forms.owners.forEach((owner) => (totalCount += owner.answerCount));
    totalCount += company.forms.company.answerCount;
    company.answersCount = totalCount;

    if (company.isSubmitted) {
      company.isSubmitted = false;
    }

    await company.save();
  }

  async getUserCompaniesParticipants(userId: string, isApplicant: boolean) {
    const companies = await this.companyModel.find({
      user: userId,
    });

    if (!companies.length) {
      throw new NotFoundException(companyResponseMsgs.companyNotFound);
    }

    const allParticipants = companies.map((company) =>
      isApplicant ? company.forms.applicants : company.forms.owners,
    );

    return allParticipants.flat();
  }

  async submitCompanyById(companyId: string) {
    const company = await this.companyModel.findById(companyId).populate({
      path: 'forms.applicants forms.owners forms.company',
    });
    if (!company) {
      throw new NotFoundException(companyResponseMsgs.companyNotFound);
    }

    if (company.reqFieldsCount !== company.answersCount) {
      throw new BadRequestException(companyResponseMsgs.BOIRfieldsMissing);
    }

    const isAllVerified = (data: any[]) => {
      return data.every((item) => {
        return Object.keys(item).some((key) => {
          const field = item[key];
          return (
            typeof field === 'object' &&
            field !== null &&
            typeof field.isVerified === 'boolean' &&
            field.isVerified
          );
        });
      });
    };

    const allApplicantsVerified = isAllVerified(company.forms.applicants);
    const allOwnersVerified = isAllVerified(company.forms.owners);

    const isCompanyVerified = Object.keys(company.forms.company).every(
      (key) => {
        const field = company.forms.company[key];
        return (
          typeof field === 'object' &&
          field !== null &&
          typeof field.isVerified === 'boolean' &&
          field.isVerified
        );
      },
    );
    if (!allApplicantsVerified || !allOwnersVerified || !isCompanyVerified) {
      throw new BadRequestException(companyResponseMsgs.BOIRNotAllVerified);
    }

    company.isSubmitted = true;

    await company.save();

    return { message: companyResponseMsgs.BOIRisSubmitted };
  }

  async getSubmittedCompaniesAndTheirAmount(companyIds: string[]): Promise<{
    companiesAndTheirAmount: { name: string; amount: number }[];
    totalAmount: number;
  }> {
    const companies = await this.companyModel.find({
      _id: { $in: companyIds },
      isSubmitted: true,
      isPaid: false,
    });

    if (!companies.length) {
      throw new BadRequestException(companyResponseMsgs.companiesNotSubmitted);
    }

    const companiesAndTheirAmount: { name: string; amount: number }[] =
      companies.map((company, index) => ({
        name: company.name,
        amount: 100 * (index === 1 ? 0.75 : index > 1 ? 0.5 : 1),
      }));

    const totalAmount = companiesAndTheirAmount.reduce((sum, { amount }) => {
      return sum + amount;
    }, 0);

    return { companiesAndTheirAmount, totalAmount };
  }

  async removeCompanyTransaction(companyIds: string[], transactionId: string) {
    for (const companyId of companyIds) {
      const company = await this.companyModel.findOne({
        companyId,
        transactions: { $in: [transactionId] },
      });

      company.transactions = company.transactions.filter(
        (transaction) => transaction.toString() !== transactionId,
      );

      await company.save();
    }
  }

  async addTransactionToCompanies(companyIds: string, transactionId: string) {
    for (const companyId of companyIds) {
      const company = await this.companyModel.findById(companyId);

      if (!company) {
        throw new Error(`Company with ID ${companyId} not found`);
      }

      if (!company.transactions.includes(transactionId as any)) {
        company.transactions.push(transactionId as any);

        await company.save();
      }
    }
  }

  async getAllCompanyData(companyId: string, user: IRequestUser) {
    await this.checkUserCompanyPermission(user, companyId, 'company');

    const company = await this.companyModel
      .findById(companyId)
      .select('name answersCount reqFieldsCount forms -_id  isExistingCompany')
      .populate({
        path: 'forms.company',
        model: 'CompanyForm',
        select: '-answerCount -_id -createdAt -updatedAt -__v',
      })
      .populate({
        path: 'forms.applicants',
        model: 'ApplicantForm',
        select: '-answerCount -applicant -_id -createdAt -updatedAt -__v',
      })
      .populate({
        path: 'forms.owners',
        model: 'OwnerForm',
        select:
          '-answerCount -exemptEntity -beneficialOwner -_id -createdAt -updatedAt -__v',
      })
      .exec();

    if (!company) {
      throw new NotFoundException(companyResponseMsgs.companyNotFound);
    }

    return company;
  }

  async changeCompanyPaidStatus(transactionId: string): Promise<string[]> {
    const companies = await this.companyModel.find({
      transactions: {
        $in: [transactionId],
      },
    });

    if (!companies.length) {
      throw new NotFoundException(companyResponseMsgs.companyNotFound);
    }

    const updatedCompanyIds = [];
    for (const company of companies) {
      company.isPaid = true;
      await company.save();
      updatedCompanyIds.push(company._id.toString());
    }

    return updatedCompanyIds;
  }
  async getSubmittedCompanies(user: IRequestUser, userId: string) {
    if (user.userId !== userId) {
      if (user.role !== 'admin') {
        throw new ForbiddenException(companyResponseMsgs.dontHavePermission);
      }
    }

    const userCompanies = await this.companyModel
      .find({ user: userId, isSubmitted: true, isPaid: false })
      .select('name _id')
      .exec();

    if (!userCompanies.length) {
      throw new NotFoundException(companyResponseMsgs.companyNotFound);
    }

    return userCompanies;
  }

  async changeExistingCompanyStatus(
    companyId: string,
    isExistingCompany: boolean,
  ) {
    const company = await this.companyModel.findById(companyId);

    if (!company) {
      throw new NotFoundException(companyResponseMsgs.companyNotFound);
    }

    if (company.isExistingCompany === isExistingCompany) {
      return false;
    }

    company.isExistingCompany = isExistingCompany;
    await company.save();

    return true;
  }

  async resetCompaniesStatus(): Promise<void> {
    const currentDate = new Date();
    const oneYearLater = new Date(
      currentDate.setFullYear(currentDate.getFullYear() + 1),
    ).toISOString();

    await this.companyModel.updateMany(
      {},
      {
        $set: {
          isPaid: false,
          isSubmitted: false,
          expTime: {
            $cond: {
              if: { $ne: ['$expTime', null] },
              then: {
                $dateAdd: { startDate: '$expTime', unit: 'year', amount: 1 },
              },
              else: oneYearLater,
            },
          },
        },
      },
    );
  }

  async getFilteredData(companyId: string) {
    const company = await this.companyModel
      .findById(companyId)
      .select('name forms -_id isExistingCompany')
      .populate({
        path: 'user',
        model: 'User',
        select: 'firstName lastName email -_id',
      })
      .populate({
        path: 'forms.company',
        model: 'CompanyForm',
        select:
          '-answerCount -_id -createdAt -updatedAt -__v -names.isVerified -formationJurisdiction.isVerified -taxInfo.isVerified -address.isVerified -repCompanyInfo.isVerified ',
      })
      .populate({
        path: 'forms.owners',
        model: 'OwnerForm',
        select:
          '-answerCount -exemptEntity.isVerified -beneficialOwner.isVerified -address.isVerified -identificationDetails.isVerified -personalInfo.isVerified -_id -createdAt -updatedAt -__v -finCENID.isVerified',
      })
      .exec();

    const cleanVerified = (item) => {
      if (item?.finCENID) {
        delete item.finCENID.isVerified;
      }
    };

    company.forms.owners.forEach(cleanVerified);
    if (
      (!company.isExistingCompany ||
        !company.forms.company.repCompanyInfo.foreignPooled) &&
      company.forms.applicants.length
    ) {
      await company.populate({
        path: 'forms.applicants',
        model: 'ApplicantForm',
        select:
          '-answerCount -_id -createdAt -updatedAt -__v -address.isVerified -identificationDetails.isVerified -personalInfo.isVerified -finCENID.isVerified',
      });

      company.forms.applicants.forEach(cleanVerified);
    }

    const companyData = company.toObject();

    return companyData;
  }

  async changeCompanyName(
    companyId: string,
    companyName: string,
  ): Promise<void> {
    const company = await this.companyModel.findById(companyId);

    if (!company) {
      throw new NotFoundException(companyResponseMsgs.companyNotFound);
    }

    company.name = companyName;
    await company.save();
  }

  async setProcessId(companyId: string, processId: string): Promise<void> {
    const company = await this.companyModel.findById(companyId);

    if (!company) {
      throw new NotFoundException(companyResponseMsgs.companyNotFound);
    }

    company.processId = processId;
    await company.save();
  }

  async removeParticipantFromCompany(
    participantId: string,
    companyId: string,
    isApplicant: boolean,
  ) {
    const company = await this.companyModel.findOne({ _id: companyId });
    if (!company) {
      throw new Error('Company not found');
    }

    if (isApplicant) {
      const updatedApplicants = company.forms.applicants.filter(
        (applicant: any) => applicant !== participantId,
      );
      if (updatedApplicants.length !== company.forms.applicants.length) {
        company.forms.applicants = updatedApplicants;
        await company.save();
      }
    } else {
      const updatedOwners = company.forms.owners.filter(
        (owner: any) => owner !== participantId,
      );
      if (updatedOwners.length !== company.forms.owners.length) {
        company.forms.owners = updatedOwners;
        await company.save();
      }

      await this.changeCompanyCounts(companyId);
    }
  }

  async changeCompanyExistingApplicantData(
    isExistingCompany: boolean,
    isForeignPooled: boolean,
    companyId: string,
  ) {
    const company = await this.companyModel.findById(companyId);
    if (isExistingCompany) {
      company.isExistingCompany = isExistingCompany;
    }

    if (company.isExistingCompany || isForeignPooled) {
      const companyApplicants: any = company.forms.applicants;
      if (companyApplicants.length) {
        companyApplicants.forEach(async (applicantId: string) => {
          await this.participantFormService.deleteParticipantFormById(
            applicantId,
            true,
          );
        });
      }
      company.forms.applicants.length = 0;
    }

    await company.save();
  }
  // need some changes after admin part creating
  // async createNewCompany(payload: any) {
  //   const existCompanyForm =
  //     await this.companyFormService.getCompanyFormByTaxData(
  //       payload.taxIdNumber,
  //       payload.taxIdType,
  //     );

  //   if (existCompanyForm) {
  //     throw new ConflictException(companyResponseMsgs.companyWasCreated);
  //   }

  //   const newCompanyForm = await this.companyFormService.create(payload);
  //   const newCompany = new this.companyModel();
  //   newCompany['forms.company'] = newCompanyForm['id'];
  //   newCompany['reqFieldsCount'] = 9;

  //   await newCompany.save();

  //   return { message: companyResponseMsgs.companyCreated };
  // }
}
