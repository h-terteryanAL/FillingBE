import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber } from 'class-validator';

export class SendEmailDto {
  @ApiProperty({ type: String, required: true })
  @IsEmail()
  email: string;
}

export class LoginDto {
  @ApiProperty({ type: String, required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ type: Number, required: true })
  @IsNumber()
  oneTimePass: number;
}

export class LoginAdminDto {
  @ApiProperty({ type: String, required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ type: String, required: true })
  password: string;
}
