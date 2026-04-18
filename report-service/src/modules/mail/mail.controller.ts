import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendVerificationDto } from './dto/send-verification.dto';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send-verification')
  sendVerification(@Body() dto: SendVerificationDto) {
    return this.mailService.sendVerificationEmail(dto);
  }
}
