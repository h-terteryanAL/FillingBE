import { AzureService } from '@/azure/azure.service';
import { CompanyService } from '@/company/company.service';
import { MailService } from '@/mail/mail.service';
import { createCompanyXml } from '@/utils/xml-creator.util';
import { HttpService } from '@nestjs/axios';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { IAttachmentResponse } from './interfaces';

@Injectable()
export class GovernmentService {
  private readonly clientSecret: string;
  private readonly clientId: string;
  private readonly sandboxURL: string;
  private readonly mainURL: string;
  private readonly tokenURL: string;
  private readonly logger = new Logger(GovernmentService.name);

  private accessToken: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => CompanyService))
    private readonly companyService: CompanyService,
    private httpService: HttpService,
    private readonly azureService: AzureService,
    private readonly mailService: MailService,
  ) {
    this.clientSecret = this.configService.get<string>(
      'GOVERNMENT.clientSecret',
    );
    this.clientId = this.configService.get<string>('GOVERNMENT.clientId');
    this.sandboxURL = this.configService.get<string>('GOVERNMENT.sandboxURL');
    this.mainURL = this.configService.get<string>('GOVERNMENT.mainURL');
    this.tokenURL = this.configService.get<string>('GOVERNMENT.tokenURL');
    this.accessToken = '';
  }

  private async streamToBinary(readableStream) {
    const chunks = [];
    for await (const chunk of readableStream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async sendCompanyDataToGovernment(companies: string[]) {
    await Promise.all(
      companies.map(async (companyId) => {
        try {
          const companyData = (await this.companyService.getFilteredData(
            companyId,
          )) as any;
          const processId = await this.getProcessId(companyId);

          if (companyData?.forms.applicants.length) {
            await this.sendCompanyImagesAttachments(
              companyData.forms.applicants,
              processId,
            );
          }
          if (companyData?.forms.owners.length) {
            await this.sendCompanyImagesAttachments(
              companyData.forms.owners,
              processId,
            );
          }
          let xmlData = await createCompanyXml(companyData, companyData.user);
          xmlData = String(xmlData).trim().replace('^([\\W]+)<', '<');
          // fs.writeFile(
          //   path.join(path.resolve(), `${companyId}.xml`),
          //   xmlData,
          //   (err) => {
          //     console.error(err);
          //   },
          // );
          const response: AxiosResponse = await firstValueFrom(
            this.httpService.post(
              `${this.sandboxURL}/upload/BOIR/${processId}/${companyId}.xml`,
              xmlData,
              {
                headers: {
                  Authorization: `Bearer ${this.accessToken}`,
                  'Content-Type': 'application/xml',
                },
              },
            ),
          );

          return response.data;
        } catch (error) {
          this.logger.error(
            `Failed to process company ID: ${companyId}`,
            error.stack,
          );
        }
      }),
    );
  }

  private async sendCompanyImagesAttachments(formData: any, processId: string) {
    await Promise.all(
      formData.map(async (applicant) => {
        if (applicant.identificationDetails.docImg) {
          const applicantImageData = await this.azureService.readStream(
            applicant.identificationDetails.docImg,
          );
          const binaryImageData = (
            await this.streamToBinary(applicantImageData)
          ).toString('base64');
          const URIName = encodeURI(applicant.identificationDetails.docImg);
          await firstValueFrom(
            this.httpService.post(
              `${this.sandboxURL}/attachments/${processId}/${URIName}`,
              binaryImageData,
              {
                headers: {
                  Authorization: `Bearer ${this.accessToken}`,
                  'Content-Type': 'application/binary',
                },
              },
            ),
          );
        }
      }),
    );
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString('base64');

    const data = new URLSearchParams();
    data.append('grant_type', 'client_credentials');
    data.append('scope', 'BOSS-EFILE-SANDBOX');

    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(this.tokenURL, data, {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      throw new Error(`Failed to obtain access token: ${error.message}`);
    }
  }

  async getProcessId(companyId: string): Promise<string> {
    if (!companyId) {
      throw new Error(`Provide company Id`);
    }

    const company = await this.companyService.getCompanyById(companyId);

    const accessToken = await this.getAccessToken();
    if (company.processId) return company.processId;

    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.sandboxURL}/processId`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      await this.companyService.setProcessId(
        companyId,
        response.data.processId,
      );

      return response.data.processId;
    } catch (error) {
      throw new Error(`Failed to obtain processId: ${error.message}`);
    }
  }

  async sendAttachment(
    companyId: string,
    file: Express.Multer.File,
  ): Promise<IAttachmentResponse> {
    try {
      const URIName = encodeURI(file.originalname); // URL encode the file name
      const processId = await this.getProcessId(companyId);
      const fileData = file.buffer.toString('base64');
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(
          `${this.sandboxURL}/attachments/${processId}/${URIName}`,
          fileData,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/binary',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed upload attachment: ${error.message}`);
    }
  }

  async checkGovernmentStatus(companyId: string) {
    const processId = await this.getProcessId(companyId);
    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(`${this.sandboxURL}/transcript/${processId}`, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      if (
        response.data.status.submissionStatus === 'submission_validation_failed'
      ) {
        const company = await this.companyService.getCompanyById(companyId);
        company.processId = null;
        await company.save();
      }

      return response.data;
    } catch (error) {
      console.log(error);
      throw new Error(`Failed to check submission status: ${error.message}`);
    }
  }
}
