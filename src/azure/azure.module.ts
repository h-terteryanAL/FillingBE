import { CompanyModule } from '@/company/company.module';
import { ParticipantFormModule } from '@/participant-form/participant-form.module';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureService } from './azure.service';

@Module({
  imports: [
    forwardRef(() => CompanyModule),
    forwardRef(() => ParticipantFormModule),
  ],
  providers: [
    AzureService,
    {
      provide: ContainerClient,
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>(
          'AZURE.connectionString',
        );
        const containerName = configService.get<string>('AZURE.containerName');

        const blobServiceClient =
          BlobServiceClient.fromConnectionString(connectionString);
        return blobServiceClient.getContainerClient(containerName);
      },
      inject: [ConfigService],
    },
  ],
  exports: [AzureService],
})
export class AzureModule {}
