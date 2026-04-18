import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('public-register')
  async publicRegister(@Body() registerDto: RegisterDto) {
    return this.authService.publicRegister(registerDto);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string; token: string }) {
    return this.authService.verifyEmail(body.email, body.token);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Request() req) {
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    return this.authService.login(loginDto, ipAddress);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Request() req) {
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userId = req.user.sub;
    return this.authService.logout(userId, ipAddress);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req,
  ) {
    const userId = req.user.sub;
    return this.authService.changePassword(userId, changePasswordDto);
  }

  @Post('reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async resetPassword(
    @Body() body: { userId: string; newPassword: string },
    @Request() req,
  ) {
    const adminId = req.user.sub;
    return this.authService.resetPassword(
      adminId,
      body.userId,
      body.newPassword,
    );
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @Post('reset-password-with-otp')
  async resetPasswordWithOtp(
    @Body() body: { email: string; otp: string; newPassword: string },
  ) {
    return this.authService.resetPasswordWithOtp(
      body.email,
      body.otp,
      body.newPassword,
    );
  }
}
