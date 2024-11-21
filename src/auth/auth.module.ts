import { CompanyModule } from '@/company/company.module';
import { MailModule } from '@/mail/mail.module';
import { UserModule } from '@/user/user.module';
import { UserService } from '@/user/user.service';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schema/user.schema';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ExpirationTimes } from './constants';
import { RolesGuard } from './guards/role.guard';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('TOKEN.accessSecret'),
        signOptions: { expiresIn: ExpirationTimes.ACCESS_TOKEN },
      }),
    }),
    MailModule,
    forwardRef(() => UserModule),
    forwardRef(() => CompanyModule),
  ],
  providers: [
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    UserService,
    RolesGuard,
    LocalStrategy,
  ],
  controllers: [AuthController],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
