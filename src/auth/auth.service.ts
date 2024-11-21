import {
  authResponseMsgs,
  cookieExpTime,
  ExpirationTimes,
  IResponseMessage,
} from '@/auth/constants';
import { MailService } from '@/mail/mail.service';
import { UserService } from '@/user/user.service';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';
import { LoginAdminDto } from './dtos/auth.dto';
import { ICustomResponse } from './dtos/response.dto';
import { IRequestUser } from './interfaces/request.interface';

@Injectable()
export class AuthService {
  private accessSecretKey: string;
  private refreshSecretKey: string;

  constructor(
    private readonly mailerService: MailService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecretKey = this.configService.get<string>('TOKEN.accessSecret');
    this.refreshSecretKey = this.configService.get<string>(
      'TOKEN.refreshSecret',
    );
  }

  async sendValidationEmail(email: string): Promise<IResponseMessage> {
    const oneTimePass = Math.floor(100000 + Math.random() * 900000);
    const userName = await this.userService.changeUserOtp(email, oneTimePass);
    await this.mailerService.sendOTPtoEmail(oneTimePass, email, userName);

    return { message: authResponseMsgs.otpWasSent };
  }

  async login(
    email: string,
    oneTimePass: number,
    res: ICustomResponse,
  ): Promise<any> {
    const user = await this.userService.getUserByEmail(email);

    if (!user || user.oneTimePass !== oneTimePass) {
      throw new NotFoundException(authResponseMsgs.wrongSentEmailOrPass);
    }

    if (moment(user.oneTimeExpiration).isBefore(moment())) {
      throw new UnauthorizedException(authResponseMsgs.codeWasExpired);
    }

    const { accessToken, refreshToken } = await this.generateNewToken(
      user['id'],
      user.email,
      user.role,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieExpTime,
    });

    await this.userService.changeRefreshToken(user['id'], refreshToken);

    return res.json({
      message: authResponseMsgs.successfulLogin,
      userId: user['id'],
      role: user['role'],
      refreshToken: refreshToken,
      accessToken: accessToken,
    });
  }

  async logout(userId: string) {
    await this.userService.changeRefreshToken(userId, '');

    return { message: authResponseMsgs.successfulLogout };
  }

  async generateNewToken(userId: string, email: string, role: string) {
    const accessToken = jwt.sign(
      { userId, email, role },
      this.accessSecretKey,
      {
        expiresIn: ExpirationTimes.ACCESS_TOKEN,
      },
    );

    const refreshToken = jwt.sign(
      { userId, email, role },
      this.refreshSecretKey,
      {
        expiresIn: ExpirationTimes.REFRESH_TOKEN,
      },
    );

    return { refreshToken, accessToken };
  }

  async refreshTokens(userId: string, refToken: string) {
    const user = await this.userService.getUserByTokenAndId(
      userId as string,
      refToken,
    );

    if (!user) {
      throw new ForbiddenException(authResponseMsgs.accessDenied);
    }

    const { accessToken } = await this.generateNewToken(
      userId,
      user.email,
      user.role,
    );

    return {
      message: authResponseMsgs.tokenRefreshed,
      accessToken,
    };
  }

  async signInAdmin(email: string, res: ICustomResponse) {
    const user = await this.userService.getUserByEmail(email);

    if (!user) {
      throw new NotFoundException(authResponseMsgs.userNotFound);
    }

    const { accessToken, refreshToken } = await this.generateNewToken(
      user['id'],
      email,
      'admin',
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: cookieExpTime,
    });

    await this.userService.changeRefreshToken(user['id'], refreshToken);

    return res.json({
      message: authResponseMsgs.successfulLogin,
      role: user['role'],
      userId: user['id'],
      refreshToken: refreshToken,
      accessToken: accessToken,
    });
  }

  async validateUser(loginAdminDto: LoginAdminDto): Promise<any> {
    const user = await this.userService.getUserByEmail(loginAdminDto.email);
    if (user && (await bcrypt.compare(loginAdminDto.password, user.password))) {
      return { email: loginAdminDto.email, userId: user['id'] };
    }
    return null;
  }

  async checkUserAdminRole(user: IRequestUser, userId: string) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('The current user is not an administrator.');
    }

    if (userId !== user.userId) {
      throw new ForbiddenException('The provided user ID is incorrect.');
    }

    const userData = await this.userService.getUserById(userId);
    if (userData.role !== 'admin') {
      throw new ForbiddenException(
        'The specified user does not have administrative privileges.',
      );
    }

    return {
      message: 'The current user has administrative privileges.',
    };
  }
}
