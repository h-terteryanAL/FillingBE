import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import { GovernmentService } from './government.service';

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
    try {
      await this.governmentService.getProcessId(companyId);
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
    try {
      const result = files.map(async (file) => {
        return await this.governmentService.sendAttachment(companyId, file);
      });
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('send-companies')
  @HttpCode(HttpStatus.OK)
  async handleSendDataToGovernment(@Body() companies: string[]): Promise<void> {
    try {
      await this.governmentService.sendCompanyDataToGovernment(companies);
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('checkStatus/:companyId')
  async checkCompanyStatus(@Param('companyId') companyId: string) {
    try {
      return this.governmentService.checkGovernmentStatus(companyId);
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
