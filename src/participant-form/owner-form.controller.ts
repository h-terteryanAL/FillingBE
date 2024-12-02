import { AccessTokenGuard } from '@/auth/guards/access-token.guard';
import { RequestWithUser } from '@/auth/interfaces/request.interface';
import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpException,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { participantFormResponseMsgs } from './constants';
import {
  CreateParticipantDocDto,
  OwnerFormDto,
} from './dtos/participant-form.dto';
import { ParticipantFormService } from './participant-form.service';

@ApiTags('form/owner')
@Controller('form/owner')
export class OwnerFormController {
  constructor(
    private readonly participantFormService: ParticipantFormService,
  ) {}

  @Post('create/:companyId')
  @ApiBody({
    type: OwnerFormDto,
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    description: 'ID of the company',
  })
  @ApiOperation({
    summary: 'Create new owner',
  })
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  async createNewParticipantForm(
    @Body() payload: OwnerFormDto,
    @Req() req: RequestWithUser,
    @Param('companyId') companyId: string,
  ) {
    try {
      return this.participantFormService.createParticipantForm(
        payload,
        companyId,
        false,
        req.user,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':companyId/:formId')
  @ApiOperation({
    summary: 'Change owner by formId',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
    description: 'ID of the company',
  })
  @ApiParam({
    name: 'formId',
    required: true,
    description: 'ID of the owner form',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        docImg: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: OwnerFormDto })
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  async changeParticipantForm(
    @Param('formId') formId: string,
    @Param('companyId') companyId: string,
    @Body() payload: OwnerFormDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      return this.participantFormService.changeParticipantForm(
        payload,
        formId,
        false,
        companyId,
        req.user,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':formId')
  @ApiOperation({
    summary: 'Get owner by formId',
  })
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  async getParticipantFormById(
    @Param('formId') formId: string,
    @Req() req: RequestWithUser,
  ) {
    try {
      return this.participantFormService.getParticipantFormById(
        formId,
        false,
        req.user,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('/:companyId/:formId')
  @ApiOperation({
    summary: 'Remove owner by formId',
  })
  @ApiParam({
    name: 'companyId',
    required: true,
  })
  @ApiParam({
    name: 'formId',
    required: true,
  })
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  async deleteParticipantFormById(
    @Param('formId') formId: string,
    @Param('companyId') companyId: string,
    @Req() req: RequestWithUser,
  ) {
    try {
      return this.participantFormService.deleteParticipantFormById(
        formId,
        false,
        req.user,
        companyId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('uploadDocImg/:companyId')
  @UseInterceptors(FileInterceptor('docImg'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        docImg: {
          type: 'string',
          format: 'binary',
        },
        docType: {
          type: 'string',
          example: 'Foreign passport',
        },
        docNum: {
          type: 'string',
          example: 'A123456789',
        },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  async uploadAnImageToTheCloudAndCreate(
    @Param('companyId') companyId: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new FileTypeValidator({ fileType: '.(jpeg|png|jpg)' }),
          new MaxFileSizeValidator({ maxSize: 4 * 1024 * 1024 }),
        ],
      }),
    )
    docImg: Express.Multer.File,
    @Body() payload: CreateParticipantDocDto,
    @Req() req: RequestWithUser,
  ) {
    try {
      return await this.participantFormService.uploadAnImageAndCreate(
        companyId,
        docImg,
        payload,
        false,
        req.user,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('uploadAndUpdate/:participantId')
  @UseInterceptors(FileInterceptor('docImg'))
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'participantId',
    required: true,
    description: 'ID of owner which doc image will send',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        docImg: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  async uploadAnImageToTheCloudAndUpdate(
    @Param('participantId') participantId: string,
    @Param('companyId') companyId: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new FileTypeValidator({ fileType: '.(jpeg|png|jpg)' }),
          new MaxFileSizeValidator({ maxSize: 4 * 1024 * 1024 }),
        ],
      }),
    )
    docImg: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    try {
      return await this.participantFormService.updateDocImageInParticipantForm(
        participantId,
        docImg,
        req.user,
        false,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/company/:companyId')
  @ApiParam({
    required: true,
    name: 'companyId',
  })
  @ApiOperation({
    summary: 'Get all user companies applicant information',
  })
  @ApiOkResponse({
    description: participantFormResponseMsgs.retrieved,
  })
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  async getAllCompaniesOwners(@Param('companyId') companyId: string) {
    try {
      return this.participantFormService.getAllCompanyParticipants(
        false,
        companyId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('/docImg/:companyId/:participantId')
  @ApiParam({
    required: true,
    name: 'participantId',
  })
  @ApiParam({
    required: true,
    name: 'companyId',
  })
  @ApiOperation({
    summary: 'Remove applicant document image',
  })
  @ApiOkResponse({
    description: 'image deleted',
  })
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  async deleteDocumentImage(
    @Param('participantId') participantId: string,
    @Param('companyId') companyId: string,
    @Req() req: RequestWithUser,
  ) {
    try {
      return this.participantFormService.removeParticipantDocumentImage(
        participantId,
        req.user,
        false,
        companyId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
