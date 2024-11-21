import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { authResponseMsgs } from '../constants';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const userData = await this.authService.validateUser({ email, password });
    if (!userData) {
      throw new BadRequestException(authResponseMsgs.wrongSentEmailOrPass);
    }
    return userData;
  }
}
