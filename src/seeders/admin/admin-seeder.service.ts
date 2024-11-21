import { User } from '@/user/schema/user.schema';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';

@Injectable()
export class SeederService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {}

  async seed() {
    const email = this.configService.get<string>('ADMIN.email');
    const adminUser = await this.userModel.findOne({ email });

    if (!adminUser) {
      const password = this.configService.get<string>('ADMIN.password');
      const firstName = this.configService.get<string>('ADMIN.firstName');
      const lastName = this.configService.get<string>('ADMIN.lastName');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      await this.userModel.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'admin',
      });
    }
  }
}
