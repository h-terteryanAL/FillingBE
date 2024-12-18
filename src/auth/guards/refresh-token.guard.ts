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

    const refreshToken =
      request.cookies?.refreshToken ||
      request.cookies?.refresh_token ||
      this.extractBearerToken(request.headers.authorization);

    if (!refreshToken) {
      console.log('No refresh token provided');
      return false;
    }

    try {
      const user = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('TOKEN.refreshSecret'),
      });

      request.user = { ...user, refreshToken };
      return true;
    } catch (err) {
      console.log('Token verification failed', err);
      return false;
    }
  }

  private extractBearerToken(authorization?: string): string | null {
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null;
    }
    return authorization.split(' ')[1]; 
  }
}
