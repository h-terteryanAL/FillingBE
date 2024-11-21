import { Role } from '@/auth/constants';
import { Roles } from '@/auth/decorators/roles.decorator';
import { AccessTokenGuard } from '@/auth/guards/access-token.guard';
import { RolesGuard } from '@/auth/guards/role.guard';
import { RequestWithUser } from '@/auth/interfaces/request.interface';
import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
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
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { companyResponseMsgs } from './constants';

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
    return {
      company: await this.companyService.getSubmittedCompanies(
        req.user,
        userId,
      ),
      message: companyResponseMsgs.companyDataRetrieved,
    };
  }

  @Get()
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiForbiddenResponse({ description: companyResponseMsgs.dontHavePermission })
  @ApiOperation({ summary: 'Get all company data(Admin)' })
  async getAllCompanies() {
    return {
      companies: await this.companyService.getAllCompanies(),
      message: companyResponseMsgs.companiesDataRetrieved,
    };
  }

  @Get(':companyId')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiForbiddenResponse({ description: companyResponseMsgs.dontHavePermission })
  @ApiOperation({ summary: 'Get company by entered company Id' })
  async getCompanyById(@Param('companyId') companyId: string) {
    return {
      company: await this.companyService.getCompanyById(companyId),
      message: companyResponseMsgs.companyDataRetrieved,
    };
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
    return {
      company: await this.companyService.getAllCompanyData(companyId, req.user),
      message: companyResponseMsgs.companyDataRetrieved,
    };
  }

  // @Post()
  // @Roles(Role.Admin)
  // @UseGuards(RolesGuard)
  // @ApiBearerAuth()
  // @ApiOkResponse({
  //   type: ResponseMessageDto,
  //   description: companyResponseMsgs.companyCreated,
  // })
  // @ApiBody({ type: CreateCompanyFormDto })
  // @ApiForbiddenResponse({ description: companyResponseMsgs.dontHavePermission })
  // @ApiOperation({ summary: 'Create new company (Admin)' })
  // @ApiConflictResponse({ description: companyResponseMsgs.companyWasCreated })
  // async createNewCompany(@Body() body: CreateCompanyFormDto) {
  //   return this.companyService.createNewCompany(body);
  // }

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
    return this.companyService.addCsvDataIntoDb(companyFile);
  }

  @Delete(':companyId')
  @Roles(Role.Admin)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: companyResponseMsgs.companyDeleted,
  })
  @ApiForbiddenResponse({ description: companyResponseMsgs.dontHavePermission })
  @ApiOperation({ summary: 'Delete company by companyId (Admin)' })
  async deleteCompany(@Param('companyId') companyId: string) {
    return this.companyService.deleteCompanyById(companyId);
  }

  @Patch('/submit/:companyId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  async submitCompanyBoir(@Param('companyId') companyId: string) {
    return this.companyService.submitCompanyById(companyId);
  }
}
