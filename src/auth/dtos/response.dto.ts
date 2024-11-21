import { ApiProperty } from '@nestjs/swagger';
import { Response } from 'express';
import { authResponseMsgs } from '../constants';

export interface ICustomResponse extends Response {
  cookie(name: string, value: string, options?: { [key: string]: any }): this;
  json(body?: any): this;
}
export class LoginResponseDto {
  @ApiProperty({ example: authResponseMsgs.successfulLogin })
  message: string;

  @ApiProperty({ example: '66f4f33f6538526f9f929d4f' })
  userId: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5...refresh' })
  refreshToken: string;
}

export class ResponseMessageDto {
  @ApiProperty()
  message: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ description: 'New access token' })
  accessToken: string;

  @ApiProperty({ description: 'New refresh token' })
  refreshToken: string;

  @ApiProperty({
    description: 'Message indicating the result of the refresh process',
  })
  message: string;
}
