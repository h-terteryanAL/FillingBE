import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';

export type UserDocument = User & Document;

enum RoleEnum {
  ADMIN = 'admin',
  USER = 'user',
}

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false })
  password: string;

  @Prop({ required: true, enum: RoleEnum, default: 'user' })
  role: string;

  @Prop({ default: null })
  oneTimePass: number | null;

  @Prop({ default: null })
  oneTimeExpiration: string | null;

  @Prop({ ref: 'Company', default: [] }) // Reference to Company model
  companies: ObjectId[];

  @Prop({ default: '' })
  refreshToken: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 });
