import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RequestWithUser } from '../interfaces/request.interface';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const refreshToken = request.cookies?.refresh_token;
    try {
      const user = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('TOKEN.refreshSecret'),
      });

      request.user = { ...user, refreshToken };
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }
}
