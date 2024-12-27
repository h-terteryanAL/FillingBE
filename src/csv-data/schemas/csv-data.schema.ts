import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CompanyCSVData } from './company-csv.schema';
import { OwnerCSV } from './owner-csv.schema';
import { UserCSV } from './user-csv.schema';

export type CSVDataDocument = CSVData & Document;

@Schema({ timestamps: true })
export class CSVData {
  @Prop()
  BOIRExpTime: Date;

  @Prop()
  company: CompanyCSVData;

  @Prop()
  user: UserCSV;

  @Prop({ default: [] })
  owners: OwnerCSV[];
}

export const CSVDataSchema = SchemaFactory.createForClass(CSVData);
