import { Role } from '@/auth/constants';
import { Roles } from '@/auth/decorators/roles.decorator';
import { AccessTokenGuard } from '@/auth/guards/access-token.guard';
import { RolesGuard } from '@/auth/guards/role.guard';
import { RequestWithUser } from '@/auth/interfaces/request.interface';
import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpException,
  HttpStatus,
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
  ApiConflictResponse,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { companyResponseMsgs } from './constants';
import { CreateCompanyFormDto } from '@/company-form/dtos/company-form.dto';
import { ResponseMessageDto } from './dtos/response';

@ApiTags('company')
@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('/submitted/:userId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiParam({
    name: 'userId',
    required: true,
    description: 'user Id',
  })
  @ApiForbiddenResponse({ description: companyResponseMsgs.dontHavePermission })
  @ApiOperation({ summary: 'Get submitted companies for current user by Id' })
  async getAllSubmittedCompanies(
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
  ) {
    try {
      return {
        company: await this.companyService.getSubmittedCompanies(
          req.user,
          userId,
        ),
        message: companyResponseMsgs.companyDataRetrieved,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiForbiddenResponse({ description: companyResponseMsgs.dontHavePermission })
  @ApiOperation({ summary: 'Get all company data(Admin)' })
  async getAllCompanies() {
    try {
      return {
        companies: await this.companyService.getAllCompanies(),
        message: companyResponseMsgs.companiesDataRetrieved,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':companyId')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiForbiddenResponse({ description: companyResponseMsgs.dontHavePermission })
  @ApiOperation({ summary: 'Get company by entered company Id' })
  async getCompanyById(@Param('companyId') companyId: string) {
    try {
      return {
        company: await this.companyService.getCompanyById(companyId),
        message: companyResponseMsgs.companyDataRetrieved,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('data/:companyId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiForbiddenResponse({ description: companyResponseMsgs.dontHavePermission })
  @ApiOperation({ summary: 'Get company full data by entered company Id' })
  async getAllCompanyData(
    @Param('companyId') companyId: string,
    @Req() req: RequestWithUser,
  ) {
    try {
      return {
        company: await this.companyService.getAllCompanyData(
          companyId,
          req.user,
        ),
        message: companyResponseMsgs.companyDataRetrieved,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('/:userId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    type: ResponseMessageDto,
    description: companyResponseMsgs.companyCreated,
  })
  @ApiParam({
    name: 'userId',
    required: true,
  })
  @ApiBody({ type: CreateCompanyFormDto })
  @ApiForbiddenResponse({ description: companyResponseMsgs.dontHavePermission })
  @ApiOperation({ summary: 'Create new company' })
  @ApiConflictResponse({ description: companyResponseMsgs.companyWasCreated })
  async createNewCompany(
    @Body() body: CreateCompanyFormDto,
    @Param('userId') userId: string,
  ) {
    return this.companyService.createNewCompany(body, userId);
  }

  @Post('csv')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Create or change company data by entered .csv file (Admin)',
  })
  @UseInterceptors(FileInterceptor('csvFile'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        csvFile: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: companyResponseMsgs.dontHavePermission })
  @ApiOkResponse({ description: companyResponseMsgs.csvUploadSuccessful })
  async addDataFromCSV(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [new FileTypeValidator({ fileType: '.(csv)' })],
      }),
    )
    companyFile: Express.Multer.File,
  ) {
    try {
      return this.companyService.addCsvDataIntoDb(companyFile);
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':companyId')
  @Roles(Role.Admin)
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: companyResponseMsgs.companyDeleted,
  })
  @ApiForbiddenResponse({ description: companyResponseMsgs.dontHavePermission })
  @ApiOperation({ summary: 'Delete company by companyId ' })
  async deleteCompany(@Param('companyId') companyId: string) {
    try {
      return this.companyService.deleteCompanyById(companyId);
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('/submit/:companyId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  async submitCompanyBoir(@Param('companyId') companyId: string) {
    try {
      return this.companyService.submitCompanyById(companyId);
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
