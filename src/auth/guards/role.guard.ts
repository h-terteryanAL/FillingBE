import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { authResponseMsgs, Role } from '../constants';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException(authResponseMsgs.tokenIsMissing);
    }

    const accessToken = authHeader.replace('Bearer ', '');

    try {
      const user = this.jwtService.verify(accessToken, {
        secret: this.configService.get<string>('TOKEN.accessSecret'),
      });

      return requiredRoles.includes(user.role);
    } catch (err) {
      console.log(err);
      throw new UnauthorizedException(authResponseMsgs.accessTokenExpired);
    }
  }
}
