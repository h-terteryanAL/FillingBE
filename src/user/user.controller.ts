import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
// import { User } from './schema/user.schema';
import { AccessTokenGuard } from '@/auth/guards/access-token.guard';

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
    return this.userService.getUserCompanyData(userId);
  }
}
