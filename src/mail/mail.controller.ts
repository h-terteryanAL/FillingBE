import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
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
    await this.mailService.updateEmailStatus(events);
  }
}
