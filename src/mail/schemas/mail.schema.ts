import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MessageTypeEnum, SendGridEventTypeEnum } from '../constants';

export type MailDocument = Mail & Document;

@Schema({ _id: false })
class EmailBody {
  @Prop({ required: true })
  messageType: MessageTypeEnum;

  @Prop({ required: true, default: Date.now })
  sendTime: Date;

  @Prop({
    enum: SendGridEventTypeEnum,
    default: SendGridEventTypeEnum.PENDING,
  })
  status: SendGridEventTypeEnum;

  @Prop({ required: true })
  message_id: string;

  @Prop()
  reason?: string;
}

@Schema({ _id: false })
class ErrorBody {
  @Prop({ required: true })
  messageType: MessageTypeEnum;

  @Prop()
  reason?: string;

  @Prop({ required: true, default: Date.now })
  receiveTime: Date;
}

@Schema({ timestamps: true })
export class Mail {
  @Prop({ required: true })
  email: string;

  @Prop({ required: false, default: [] })
  messages: EmailBody[];

  @Prop({ default: [] })
  errorMessages: ErrorBody[];
}

export const MailSchema = SchemaFactory.createForClass(Mail);
