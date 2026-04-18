import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { MailLog, MailLogSchema } from './schema/mail-log.schema';
import { User, UserSchema } from '../users/schema/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MailLog.name, schema: MailLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
