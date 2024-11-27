import { Prop, Schema } from '@nestjs/mongoose';

@Schema({ _id: false })
export class UserCSV {
  @Prop({ required: false })
  firstName?: string;

  @Prop({ required: false })
  email?: string;

  @Prop({ required: false })
  lastName?: string;
}
