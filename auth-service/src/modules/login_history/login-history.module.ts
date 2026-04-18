import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LoginHistory,
  LoginHistorySchema,
} from './schema/login-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoginHistory.name, schema: LoginHistorySchema },
    ]),
  ],
  exports: [
    MongooseModule.forFeature([
      { name: LoginHistory.name, schema: LoginHistorySchema },
    ]),
  ],
})
export class LoginHistoryModule {}
