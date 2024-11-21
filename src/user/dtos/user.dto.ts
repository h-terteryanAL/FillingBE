import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ type: String, required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  firstName: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  lastName: string;
}

export class CreateAdminDto {
  @ApiProperty({ type: String, required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ type: String, required: true })
  password: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  firstName: string;

  @ApiProperty({ type: String, required: true })
  @IsString()
  lastName: string;
}

export class CSVUserDto {
  @ApiProperty({ required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ required: true })
  @IsString()
  firstName: string;

  @ApiProperty({ required: true })
  @IsString()
  lastName: string;
}
