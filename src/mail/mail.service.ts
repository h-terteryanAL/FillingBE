import { userVerificationTime } from '@/auth/constants';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as SendGrid from '@sendgrid/mail';
import Handlebars from 'handlebars';
import { Model } from 'mongoose';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { MessageTypeEnum, SendGridEventTypeEnum } from './constants';
import { SendGridWebhookDto } from './dtos/mail.dto';
import { IUserInvitationEmail } from './interfaces/mail.interface';
import { Mail, MailDocument } from './schemas/mail.schema';

@Injectable()
export class MailService {
  emailFrom: string;
  adminFullName: string;
  adminEmail: string;
  link: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Mail.name) private mailModel: Model<MailDocument>,
  ) {
    SendGrid.setApiKey(configService.get<string>('SENDGRID.apiKey'));
    this.emailFrom = configService.get<string>('SENDGRID.emailFrom');
    this.adminFullName = `${this.configService.get<string>('ADMIN.firstName')} ${this.configService.get<string>(
      'ADMIN.lastName',
    )}`;
    this.adminEmail = this.configService.get<string>('ADMIN.email');
    const linkHost = this.configService.get<string>('HOST');
    const linkPort = this.configService.get<string>('CLIENT_PORT');
    this.link =
      linkPort &&
      (linkHost.includes('localhost') || linkHost.includes('127.0.0.1'))
        ? `${linkHost}:${linkPort}`
        : linkHost;
  }

  async sendOTPtoEmail(
    oneTimePass: number,
    email: string,
    userName: string,
  ): Promise<void> {
    try {
      const templatePath = path.join(
        path.resolve(),
        '/src/mail/templates/oneTimePass.hbs',
      );

      const verificationTime = `${userVerificationTime[0]} ${userVerificationTime[1]}`;
      const template = fs.readFileSync(templatePath, 'utf-8');
      const compiledFile = Handlebars.compile(template);
      const htmlContent = compiledFile({
        oneTimePass,
        verificationTime,
        userName,
        link: this.link,
      });

      const mail: SendGrid.MailDataRequired = {
        to: email,
        from: this.emailFrom,
        subject: 'Email Confirmation',
        html: htmlContent,
      };

      const sendgridData = await SendGrid.send(mail);
      const messageId = sendgridData[0]?.headers['x-message-id'];
      await this.createEmailData(MessageTypeEnum.OTP, messageId, email);
    } catch (error) {
      await this.createErrorData(MessageTypeEnum.OTP, email, error.message);
      console.log(error, 'in sendgrid');
      throw new HttpException(
        {
          status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message || 'An unexpected error occurred',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendInvitationEmailToFormFiller(data: IUserInvitationEmail) {
    const { email, companyName, fullName, isNewCompany } = data;
    if (!email) {
      return;
    }

    try {
      const templatePath = path.join(
        path.resolve(),
        `/src/mail/templates/${isNewCompany ? 'invitation' : 'change-notification'}.hbs`,
      );

      const template = fs.readFileSync(templatePath, 'utf-8');
      const compiledFile = Handlebars.compile(template);
      const htmlContent = compiledFile({
        companyName,
        fullName,
        link: this.link,
      });
      const mail: SendGrid.MailDataRequired = {
        to: email,
        from: this.emailFrom,
        subject: 'Mail for BOIR Filler',
        html: htmlContent,
      };

      const sendgridData = await SendGrid.send(mail);
      const messageId = sendgridData[0]?.headers['x-message-id'];
      await this.createEmailData(MessageTypeEnum.OTP, messageId, email);
    } catch (error) {
      await this.createErrorData(MessageTypeEnum.OTP, email, error.message);
      throw new HttpException(
        {
          status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message || 'An unexpected error occurred',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async alertUserOfExpiringCompany(
    companies: {
      name: string;
      user: { firstName: string; lastName: string; email: string };
    }[],
    remainingDay: number,
  ): Promise<void> {
    const templatePath = path.join(
      path.resolve(),
      '/src/mail/templates/warning-notification.hbs',
    );

    const template = fs.readFileSync(templatePath, 'utf-8');
    const compiledFile = Handlebars.compile(template);

    await Promise.all(
      companies.map(async (company) => {
        try {
          console.log(this.link);
          const htmlContent = compiledFile({
            fillerFullName: `${company.user?.firstName} ${company.user?.lastName}`,
            companyName: company.name,
            remainingDays: remainingDay,
            link: this.link,
          });

          const mail: SendGrid.MailDataRequired = {
            to: company.user.email,
            from: this.emailFrom,
            subject: 'Company expiration time is coming up',
            html: htmlContent,
          };

          const sendgridData = await SendGrid.send(mail);
          const messageId = sendgridData[0]?.headers['x-message-id'];
          await this.createEmailData(
            MessageTypeEnum.OTP,
            messageId,
            company.user.email,
          );
        } catch (error) {
          await this.createErrorData(
            MessageTypeEnum.OTP,
            company.user.email,
            error.message,
          );
          throw new HttpException(
            {
              status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
              error: error.message || 'An unexpected error occurred',
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }),
    );
  }

  async notifyAdminAboutExpiredCompanies(
    companies: { user: { name: string; email: string } }[],
  ) {
    const templatePath = path.join(
      path.resolve(),
      '/src/mail/templates/expired-notification.hbs',
    );

    const template = fs.readFileSync(templatePath, 'utf-8');
    const compiledFile = Handlebars.compile(template);
    const htmlContent = compiledFile({
      companies,
    });
    try {
      const mail: SendGrid.MailDataRequired = {
        to: this.adminEmail,
        from: this.emailFrom,
        subject: 'Expired companies List',
        html: htmlContent,
      };

      const sendgridData = await SendGrid.send(mail);
      const messageId = sendgridData[0]?.headers['x-message-id'];
      await this.createEmailData(
        MessageTypeEnum.OTP,
        messageId,
        this.adminEmail,
      );
    } catch (error) {
      await this.createErrorData(
        MessageTypeEnum.OTP,
        this.adminEmail,
        error.message,
      );
      throw new HttpException(
        {
          status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message || 'An unexpected error occurred',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendPDFtoUsers(
    userName: string,
    companyName: string,
    email: string,
    pdf: string,
  ) {
    const templatePath = path.join(
      path.resolve(),
      '/src/mail/templates/pdf-report.hbs',
    );

    const template = fs.readFileSync(templatePath, 'utf-8');
    const compiledFile = Handlebars.compile(template);
    const htmlContent = compiledFile({
      userName,
      companyName,
      pdf,
    });
    try {
      const mail: SendGrid.MailDataRequired = {
        to: email,
        from: this.emailFrom,
        subject: 'Company report success',
        html: htmlContent,
      };

      const sendgridData = await SendGrid.send(mail);
      const messageId = sendgridData[0]?.headers['x-message-id'];
      await this.createEmailData(MessageTypeEnum.OTP, messageId, email);
    } catch (error) {
      await this.createErrorData(MessageTypeEnum.OTP, email, error.message);
      throw new HttpException(
        {
          status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message || 'An unexpected error occurred',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendInvoiceData(
    userName: string,
    companyName: string,
    email: string,
    invoice: string,
  ) {
    const templatePath = path.join(
      path.resolve(),
      '/src/mail/templates/invoice.hbs',
    );

    const template = fs.readFileSync(templatePath, 'utf-8');
    const compiledFile = Handlebars.compile(template);
    const htmlContent = compiledFile({
      userName,
      companyName,
      invoice,
    });
    try {
      const mail: SendGrid.MailDataRequired = {
        to: email,
        from: this.emailFrom,
        subject: 'Company paid success',
        html: htmlContent,
      };

      const sendgridData = await SendGrid.send(mail);
      const messageId = sendgridData[0]?.headers['x-message-id'];
      await this.createEmailData(MessageTypeEnum.OTP, messageId, email);
    } catch (error) {
      await this.createErrorData(MessageTypeEnum.OTP, email, error.message);
      throw new HttpException(
        {
          status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message || 'An unexpected error occurred',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createEmailData(
    messageType: MessageTypeEnum,
    message_id: string,
    email: string,
  ) {
    const messageData = {
      messages: [
        {
          messageType,
          sendTime: new Date(),
          status: SendGridEventTypeEnum.PENDING,
          message_id,
        },
      ],
    };

    await this.upsertEmailData(email, messageData);
  }

  async updateEmailStatus(events: SendGridWebhookDto[]): Promise<void> {
    for (const event of events) {
      const { message_id, event: status, email, reason } = event;

      await this.mailModel.updateOne(
        { email, 'messages.message_id': message_id },
        {
          $set: {
            'messages.$.status':
              SendGridEventTypeEnum[status.toUpperCase()] ||
              SendGridEventTypeEnum.UNKNOWN,
            'messages.$.reason': reason || null,
          },
        },
      );
    }
  }

  async createErrorData(
    messageType: MessageTypeEnum,
    email: string,
    reason?: string,
  ) {
    const errorData = {
      errors: [
        {
          messageType,
          receiveTime: new Date(),
          reason,
        },
      ],
    };

    await this.upsertEmailData(email, errorData);
  }

  private async upsertEmailData(
    email: string,
    data: { messages?: any[]; errors?: any[] },
  ): Promise<void> {
    const message = await this.mailModel.findOne({ email });

    if (!message) {
      const newMessage = new this.mailModel({ email, ...data });
      await newMessage.save();
    } else {
      if (data.messages) {
        message.messages.push(...data.messages);
      }
      if (data.errors) {
        message.errorMessages.push(...data.errors);
      }
      await message.save();
    }
  }

  async sendGovernmentResultToAdmin(data: IUserInvitationEmail) {
    const { companyName } = data;

    try {
      const templatePath = path.join(
        path.resolve(),
        `/src/mail/templates/send-government-res.hbs`,
      );

      const template = fs.readFileSync(templatePath, 'utf-8');
      const compiledFile = Handlebars.compile(template);
      const htmlContent = compiledFile({
        companyName,
        fullName: this.adminFullName,
        link: this.link,
      });
      const mail: SendGrid.MailDataRequired = {
        to: this.adminEmail,
        from: this.emailFrom,
        subject: 'Data sended to Government',
        html: htmlContent,
      };

      const sendgridData = await SendGrid.send(mail);
      const messageId = sendgridData[0]?.headers['x-message-id'];
      await this.createEmailData(
        MessageTypeEnum.OTP,
        messageId,
        this.adminEmail,
      );
    } catch (error) {
      await this.createErrorData(
        MessageTypeEnum.OTP,
        this.adminEmail,
        error.message,
      );
      throw new HttpException(
        {
          status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message || 'An unexpected error occurred',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
