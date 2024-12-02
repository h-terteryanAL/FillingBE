import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SendGridWebhookDto } from './dtos/mail.dto';
import { MailService } from './mail.service';

@Controller('mail')
@ApiTags('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}
  @Post('webhook/sendgrid')
  @HttpCode(HttpStatus.OK)
  async handleSendGridWebhook(
    @Body() events: SendGridWebhookDto[],
  ): Promise<void> {
    try {
      await this.mailService.updateEmailStatus(events);
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while retrieving the company form.',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
