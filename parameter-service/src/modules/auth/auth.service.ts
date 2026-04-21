import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schema/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginHistory } from '../login_history/schema/login-history.schema';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(LoginHistory.name)
    private loginHistoryModel: Model<LoginHistory>,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async publicRegister(registerDto: RegisterDto) {
    const { email, password, fullName, phoneNumber } = registerDto;

    // Kiá»ƒm tra email Ä‘Ã£ tá»“n táº¡i
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash máº­t kháº©u
    const hashedPassword = await bcrypt.hash(password, 10);

    // Táº¡o user má»›i (Máº·c Ä‘á»‹nh lÃ  LIBRARIAN vÃ  status lÃ  locked)
    const newUser = await this.userModel.create({
      email,
      password: hashedPassword,
      fullName,
      phoneNumber,
      role: 'LIBRARIAN',
      status: 'locked',
      isVerified: false,
    });

    // Gá»­i email xÃ¡c thá»±c
    await this.mailService.sendVerificationEmail({
      email: newUser.email,
      name: newUser.fullName,
    });

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      userId: newUser._id,
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, fullName, phoneNumber, role } = registerDto;

    // Kiá»ƒm tra email Ä‘Ã£ tá»“n táº¡i
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash máº­t kháº©u
    const hashedPassword = await bcrypt.hash(password, 10);

    // Táº¡o user má»›i
    const newUser = await this.userModel.create({
      email,
      password: hashedPassword,
      fullName,
      phoneNumber,
      role,
      status: 'active',
    });

    return {
      message: 'User registered successfully',
      userId: newUser._id,
    };
  }

  async login(loginDto: LoginDto, ipAddress: string) {
    const { email, password } = loginDto;

    // TÃ¬m user
    const user = await this.userModel.findOne({ email });
    if (!user) {
      const failedHistory = new this.loginHistoryModel({
        userId: null,
        email: email,
        ipAddress,
        status: 'FAILED',
        failureReason: 'User not found',
        loginTime: new Date(),
      });
      await failedHistory.save();
      throw new UnauthorizedException('Invalid email or password');
    }

    // Kiá»ƒm tra máº­t kháº©u
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const failedHistory = new this.loginHistoryModel({
        userId: user._id,
        ipAddress,
        status: 'FAILED',
        failureReason: 'Invalid password',
        loginTime: new Date(),
      });
      await failedHistory.save();
      throw new UnauthorizedException('Invalid email or password');
    }

    // Kiá»ƒm tra tráº¡ng thÃ¡i user
    if (user.status !== 'active') {
      let reason = 'User account is locked';
      if (user.status === 'pending') {
        reason = 'User account is pending approval';
      }

      const failedHistory = new this.loginHistoryModel({
        userId: user._id,
        ipAddress,
        status: 'FAILED',
        failureReason: reason,
        loginTime: new Date(),
      });
      await failedHistory.save();
      throw new UnauthorizedException(reason);
    }

    // Ghi láº¡i lá»‹ch sá»­ Ä‘Äƒng nháº­p thÃ nh cÃ´ng
    const successHistory = new this.loginHistoryModel({
      userId: user._id,
      ipAddress,
      status: 'SUCCESS',
      loginTime: new Date(),
    });
    await successHistory.save();

    // Cáº­p nháº­t lastLogin cho user
    user.lastLogin = new Date();
    await user.save();

    // Táº¡o JWT token
    const token = this.jwtService.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    });

    return {
      message: 'Login successful',
      access_token: token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async logout(userId: string, _ipAddress: string) {
    // Cáº­p nháº­t logoutTime trong login history
    await this.loginHistoryModel.updateOne(
      { userId: userId as any, logoutTime: { $exists: false } },
      { logoutTime: new Date() },
    );

    return {
      message: 'Logout successful',
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Kiá»ƒm tra máº­t kháº©u hiá»‡n táº¡i
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash máº­t kháº©u má»›i
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cáº­p nháº­t máº­t kháº©u
    await this.userModel.updateOne(
      { _id: userId },
      { password: hashedPassword },
    );

    return {
      message: 'Password changed successfully',
    };
  }

  async resetPassword(adminId: string, userId: string, newPassword: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userModel.updateOne(
      { _id: userId },
      { password: hashedPassword },
    );

    return {
      message: 'Password reset successfully by admin',
    };
  }

  async verifyEmail(email: string, token: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.verificationToken !== token) {
      throw new BadRequestException('Invalid verification token');
    }

    if (
      user.verificationTokenExpires &&
      user.verificationTokenExpires < new Date()
    ) {
      throw new BadRequestException('Verification token expired');
    }

    user.isVerified = true;

    // Náº¿u Ä‘Æ°á»£c táº¡o bá»Ÿi Admin -> Active luÃ´n
    let status = 'pending';
    if (user.createdByAdmin) {
      user.status = 'active';
      status = 'active';
    } else {
      // Náº¿u tá»± Ä‘Äƒng kÃ½ -> Pending chá» duyá»‡t
      user.status = 'pending';
      status = 'pending';
    }

    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    return {
      message: 'Email verified successfully',
      status: status,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 5); // 5 minutes

    user.otp = otp;
    user.otpExpires = expires;
    await user.save();

    await this.mailService.sendOtpEmail(user.email, otp, user.fullName);

    return {
      message: 'OTP sent to email',
    };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (user.otpExpires && user.otpExpires < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    return {
      message: 'OTP verified successfully',
    };
  }

  async resetPasswordWithOtp(email: string, otp: string, newPassword: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (user.otpExpires && user.otpExpires < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    return {
      message: 'Password reset successfully',
    };
  }
}
