import {
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
// import { User } from './schema/user.schema';
import { AccessTokenGuard } from '@/auth/guards/access-token.guard';
import { RequestWithUser } from '@/auth/interfaces/request.interface';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // @Post('company/:userId')
  // @ApiOperation({ summary: 'Add company(or companies) to user' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'successfully added',
  // })
  // @ApiParam({
  //   name: 'userId',
  //   description: 'The unique identifier (ID) for the user',
  //   type: String,
  // })
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       companyIds: {
  //         type: 'array',
  //         items: {
  //           type: 'string',
  //           description: 'The unique identifier (ID) for the entity',
  //         },
  //         description: 'Array of unique identifiers for companies',
  //       },
  //     },
  //     required: ['companyIds'],
  //   },
  // })
  // @ApiBearerAuth()
  // @Roles(Role.Admin)
  // @UseGuards(RolesGuard)
  // @ApiForbiddenResponse({ description: authResponseMsgs.accessDenied })
  // async addCompaniesToUser(
  //   @Param('userId') userId: string,
  //   @Body() body: { companyIds: string[] },
  // ) {
  //   await this.userService.addCompaniesToUser(userId, body.companyIds);
  // }

  @Delete(':companyId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'company removed from user',
  })
  @ApiForbiddenResponse({ description: 'Dont have permission' })
  @ApiOperation({ summary: 'Delete company by companyId ' })
  async deleteCompany(
    @Param('companyId') companyId: string,
    @Req() req: RequestWithUser,
  ) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('Unauthorized');
      }

      return this.userService.removeCompanyFromUser(
        req.user.userId as string,
        companyId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('company/:userId')
  @ApiParam({
    name: 'userId',
    description: 'The unique identifier (ID) for the user',
    type: String,
  })
  @ApiBearerAuth()
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: 'Get user company data by userId' })
  async getUserCompanyData(@Param('userId') userId: string) {
    try {
      return this.userService.getUserCompanyData(userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
