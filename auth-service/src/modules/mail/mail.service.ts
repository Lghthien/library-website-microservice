import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { SendVerificationDto } from './dto/send-verification.dto';
import { MailLog, MailLogDocument } from './schema/mail-log.schema';
import { User, UserDocument } from '../users/schema/user.schema';

@Injectable()
export class MailService {
  private transporter;

  constructor(
    @InjectModel(MailLog.name) private mailLogModel: Model<MailLogDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    // Cấu hình gửi mail (Dùng Gmail App Password của bạn)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'than.65.cvan@gmail.com',
        pass: 'fsyl afiy fzpr egzg',
      },
    });
  }

  async sendVerificationEmail(dto: SendVerificationDto) {
    const { email, name } = dto;

    // 1. Tìm user để lưu token
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Tạo token và thời gian hết hạn (15 phút)
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);

    user.verificationToken = token;
    user.verificationTokenExpires = expires;
    await user.save();

    // 3. Tạo link xác thực kèm token
    const verifyLink = `http://localhost:3000/auth/verify-account?token=${token}&email=${encodeURIComponent(email)}`;

    // 4. Template email chuyên nghiệp
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(to right, #2563eb, #1d4ed8); padding: 30px 20px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 18px; margin-bottom: 20px; color: #1f2937; }
          .message { margin-bottom: 30px; color: #4b5563; }
          .button-container { text-align: center; margin: 30px 0; }
          .button { background-color: #2563eb; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; transition: background-color 0.3s; }
          .button:hover { background-color: #1d4ed8; }
          .expiry-note { font-size: 13px; color: #ef4444; text-align: center; margin-top: 20px; font-style: italic; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thư Viện Số UIT</h1>
          </div>
          <div class="content">
            <p class="greeting">Xin chào <strong>${name}</strong>,</p>
            <p class="message">Cảm ơn bạn đã đăng ký tài khoản tại Thư Viện Số UIT. Để hoàn tất quá trình đăng ký và bảo mật tài khoản, vui lòng xác thực địa chỉ email của bạn bằng cách nhấn vào nút bên dưới.</p>
            
            <div class="button-container">
              <a href="${verifyLink}" class="button">Xác thực tài khoản ngay</a>
            </div>

            <p class="expiry-note">⚠️ Link xác thực này chỉ có hiệu lực trong vòng 15 phút.</p>
            
            <p class="message" style="font-size: 14px; margin-top: 30px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Thư Viện Số UIT. All rights reserved.</p>
            <p>Đây là email tự động, vui lòng không trả lời email này.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // 5. Gửi mail
      await this.transporter.sendMail({
        from: '"Thư viện số UIT" <than.65.cvan@gmail.com>',
        to: email,
        subject: '🔒 Xác thực tài khoản của bạn - Thư Viện Số UIT',
        html: htmlContent,
      });

      // 6. Lưu lịch sử thành công
      await this.mailLogModel.create({
        recipient: email,
        type: 'VERIFICATION',
        status: 'SUCCESS',
      });

      return { message: 'Email sent successfully' };
    } catch (error) {
      console.error('Mail Error:', error);

      // 7. Lưu lịch sử thất bại
      await this.mailLogModel.create({
        recipient: email,
        type: 'VERIFICATION',
        status: 'FAILED',
      });

      throw error;
    }
  }

  async sendOtpEmail(email: string, otp: string, name: string) {
    const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #2563eb; text-align: center;">Mã xác thực OTP</h2>
                <p>Xin chào <strong>${name}</strong>,</p>
                <p>Bạn đã yêu cầu đặt lại mật khẩu. Đây là mã OTP của bạn:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; background: #f1f5f9; padding: 10px 20px; border-radius: 8px;">${otp}</span>
                </div>
                <p>Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #64748b; text-align: center;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
            </div>
        `;

    try {
      await this.transporter.sendMail({
        from: '"Library System" <than.65.cvan@gmail.com>',
        to: email,
        subject: 'Mã xác thực OTP - Đặt lại mật khẩu',
        html: htmlContent,
      });

      await this.mailLogModel.create({
        recipient: email,
        type: 'OTP',
        status: 'SUCCESS',
      });
    } catch (error) {
      console.error('Mail Error:', error);
      await this.mailLogModel.create({
        recipient: email,
        type: 'OTP',
        status: 'FAILED',
      });
      throw error;
    }
  }
}
