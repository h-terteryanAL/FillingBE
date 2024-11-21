import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import { GovernmentService } from './government.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('government')
@ApiTags('government')
export class GovernmentController {
  constructor(private readonly governmentService: GovernmentService) {}

  @Get('get-processId/:companyId')
  @ApiParam({
    name: 'companyId',
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  async handleGetProcessId(
    @Param('companyId') companyId: string,
  ): Promise<void> {
    await this.governmentService.getProcessId(companyId);
  }


  @Post('sendAttachments/:companyId')
  @UseInterceptors(FilesInterceptor('files'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async sendAttachments(
    @Param('companyId') companyId: string,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const result = files.map(async (file) => {
      return await this.governmentService.sendAttachment(companyId, file);
    });
    return result;
  }

  @Post('send-companies')
  @HttpCode(HttpStatus.OK)
  async handleSendDataToGovernment(@Body() companies: string[]): Promise<void> {
    await this.governmentService.sendCompanyDataToGovernment(companies);
  }

  @Get('checkStatus/:companyId')
  async checkCompanyStatus(@Param('companyId') companyId: string) {
    return this.governmentService.checkGovernmentStatus(companyId);
  }
}
