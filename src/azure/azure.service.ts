import { IRequestUser } from '@/auth/interfaces/request.interface';
import { CompanyService } from '@/company/company.service';
import { ParticipantFormService } from '@/participant-form/participant-form.service';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AzureService {
  connectionString: string;
  containerName: string;
  constructor(
    private readonly configService: ConfigService,
    private containerClient: ContainerClient,
    @Inject(forwardRef(() => CompanyService))
    private readonly companyService: CompanyService,
    @Inject(forwardRef(() => ParticipantFormService))
    private readonly participantService: ParticipantFormService,
  ) {
    this.connectionString = this.configService.get<string>(
      'AZURE.connectionString',
    );
    this.containerName = this.configService.get<string>('AZURE.containerName');
  }

  getBlockBlobClient(fileName: string) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      this.connectionString,
    );
    const blobContainer = blobServiceClient.getContainerClient(
      this.containerName,
    );

    return blobContainer.getBlockBlobClient(fileName);
  }

  async uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('file is missing');
    }

    const sanitizedFileName = file.originalname.replace(
      /[^a-zA-Z0-9!@#$%()_\-\.=+\[\]{}|;~]/g,
      '_',
    );

    const redactedFileName = `${Date.now()}_${sanitizedFileName}`;
    try {
      const blockBlobClient = this.getBlockBlobClient(redactedFileName);

      await blockBlobClient.uploadData(file.buffer);
    } catch (error) {
      console.error(error, 'error');
    }

    return redactedFileName;
  }

  async readStream(
    fileName: string,
    participantId?: string,
    user?: IRequestUser,
  ) {
    try {
      if (user) {
        await this.companyService.checkUserCompanyPermission(
          user,
          participantId,
          'participantForm',
        );
      }
      const blockBlobClient = this.getBlockBlobClient(fileName);
      const blobDownload = await blockBlobClient.download(0);
      return blobDownload.readableStreamBody;
    } catch (error) {
      console.error('err', error);

      if (participantId) {
       await this.participantService.removeImageFromParticipant(participantId)
      }
      throw new NotFoundException('Image not found');
    }
  }

  async readAll() {
    const blobsData = [];

    for await (const blob of this.containerClient.listBlobsFlat()) {
      const blockBlobClient = this.getBlockBlobClient(blob.name);
      const downloadBlockBlobResponse = await blockBlobClient.download(0);
      const stream = downloadBlockBlobResponse.readableStreamBody;

      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      const blobContent = Buffer.concat(chunks).toString();
      blobsData.push({ name: blob.name, content: blobContent });
    }

    return blobsData;
  }

  async delete(fileName: string) {
    const blockBlobClient = this.getBlockBlobClient(fileName);
    await blockBlobClient.deleteIfExists();
  }
}
