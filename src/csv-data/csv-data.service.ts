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
    const filteredData: {
      user?: any;
      owners?: any[];
      BOIRExpTime?: any;
    } = { owners };
    if (data.owner) {
      filteredData.owners = data.owners;
    }

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
