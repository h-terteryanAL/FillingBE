import { IResponseMessage } from '@/user/constants';
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { authResponseMsgs } from './constants';
import { ILoginResponse } from './constants/auth-responses';
import { LoginAdminDto, LoginDto, SendEmailDto } from './dtos/auth.dto';
import {
  ICustomResponse,
  LoginResponseDto,
  RefreshTokenResponseDto,
  ResponseMessageDto,
} from './dtos/response.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { RequestWithUser } from './interfaces/request.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('email')
  @ApiBody({ type: SendEmailDto })
  @ApiOkResponse({
    description: authResponseMsgs.otpWasSent,
  })
  @ApiNotFoundResponse({
    description: authResponseMsgs.userNotFound,
  })
  @ApiOperation({ summary: 'Send Validation Email to User' })
  async sendValidateEmail(
    @Body() body: SendEmailDto,
  ): Promise<IResponseMessage> {
    try {
      return this.authService.sendValidationEmail(body.email.toLowerCase());
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: authResponseMsgs.successfulLogin,
    type: LoginResponseDto,
  })
  @ApiOperation({ summary: 'Sign in by one time pass' })
  @ApiNotFoundResponse({ description: authResponseMsgs.wrongSentEmailOrPass })
  @ApiUnauthorizedResponse({ description: authResponseMsgs.codeWasExpired })
  async login(
    @Body() body: LoginDto,
    @Res() res: ICustomResponse,
  ): Promise<ILoginResponse> {
    try {
      return this.authService.login(
        body.email.toLowerCase(),
        body.oneTimePass,
        res,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login/admin')
  @ApiBody({ type: LoginAdminDto })
  @UseGuards(LocalAuthGuard)
  @ApiNotFoundResponse({ description: authResponseMsgs.userNotFound })
  @ApiBadRequestResponse({
    description: authResponseMsgs.wrongSentEmailOrPass,
  })
  @ApiOkResponse({
    description: authResponseMsgs.successfulLogin,
    type: LoginResponseDto,
  })
  async signInAdmin(@Body() body: LoginAdminDto, @Res() res: ICustomResponse) {
    try {
      return this.authService.signInAdmin(body.email.toLowerCase(), res);
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('refresh')
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiBearerAuth()
  @UseGuards(RefreshTokenGuard)
  @ApiOkResponse({
    description: authResponseMsgs.tokenRefreshed,
    type: RefreshTokenResponseDto,
  })
  @ApiForbiddenResponse({
    description: authResponseMsgs.expiredRefreshToken,
  })
  @ApiUnauthorizedResponse({
    description: authResponseMsgs.expiredRefreshToken,
  })
  @ApiBadRequestResponse({
    description: authResponseMsgs.tokenPayloadMissingFields,
  })
  async refreshTokens(@Req() req: RequestWithUser) {
    try {
      return this.authService.refreshTokens(
        req.user['userId'] as string,
        req.user['refreshToken'],
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('logout/:userId')
  @ApiOkResponse({
    type: ResponseMessageDto,
    description: authResponseMsgs.successfulLogout,
  })
  @ApiNotFoundResponse({ description: authResponseMsgs.userNotFound })
  @ApiOperation({ summary: 'Sign out by entered user id' })
  async logout(@Param('userId') userId: string): Promise<IResponseMessage> {
    try {
      return this.authService.logout(userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('/admin/:userId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiParam({
    name: 'userId',
    required: true,
  })
  @ApiOperation({ description: 'check user privileges' })
  async checkAdmin(
    @Param('userId') userId: string,
    @Req() req: RequestWithUser,
  ) {
    try {
      return this.authService.checkUserAdminRole(req.user, userId);
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
