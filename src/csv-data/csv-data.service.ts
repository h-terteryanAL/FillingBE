import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CSVData, CSVDataDocument } from './schemas/csv-data.schema';

@Injectable()
export class CsvDataService {
  constructor(
    @InjectModel(CSVData.name)
    private readonly csvDataModel: Model<CSVDataDocument>,
  ) {}

  async create(data: any) {
    const owners = [];
    const applicants = [];
    if (data.participants.length) {
      data.participants.forEach((participant: any) => {
        if (participant.isApplicant) {
          delete participant.isApplicant;
          applicants.push(participant);
        } else {
          delete participant.isApplicant;
          owners.push(participant);
        }
      });
    }

    const filteredData: {
      user?: any;
      owners?: any[];
      applicants?: any[];
      BOIRExpTime?: any;
    } = { owners, applicants };
    if (data.user) {
      filteredData.user = data.user;
    }

    if (data.BOIRExpTime) {
      filteredData.BOIRExpTime = data.BOIRExpTime;
    }

    const newCsv = new this.csvDataModel({ ...filteredData });
    await newCsv.save();
  }
}
