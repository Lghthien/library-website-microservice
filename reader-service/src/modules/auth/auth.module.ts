import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SharedModule } from '../shared/shared.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [SharedModule, MailModule],
  providers: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, SharedModule],
})
export class AuthModule {}
