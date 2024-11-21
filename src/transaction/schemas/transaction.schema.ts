import { Company } from '@/company/schemas/company.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongoSchema } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: String })
  transactionId: string;

  @Prop({ type: Number })
  amountPaid: number;

  @Prop({ type: String })
  status: string;

  @Prop({ type: Date })
  paymentDate: Date;

  @Prop({ type: String })
  paymentMethod: string;

  @Prop({
    type: String,
    enum: ['BOIR Payment', 'Other'],
    default: 'BOIR Payment',
  })
  transactionType: string;

  @Prop({ type: [MongoSchema.Types.ObjectId], ref: 'Company', required: false })
  companies: Company[];
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
