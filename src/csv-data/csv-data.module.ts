import { CompanyModule } from '@/company/company.module';
import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CsvDataController } from './csv-data.controller';
import { CsvDataService } from './csv-data.service';
import { CSVData, CSVDataSchema } from './schemas/csv-data.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CSVData.name, schema: CSVDataSchema }]),
    forwardRef(() => CompanyModule),
  ],
  providers: [CsvDataService],
  controllers: [CsvDataController],
  exports: [CsvDataService],
})
export class CsvDataModule {}
