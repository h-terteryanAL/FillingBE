import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SendGridEventTypeEnum } from '../constants';

export class SendGridWebhookDto {
  @IsString()
  message_id: string;

  @IsEnum(SendGridEventTypeEnum)
  event: SendGridEventTypeEnum;

  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
