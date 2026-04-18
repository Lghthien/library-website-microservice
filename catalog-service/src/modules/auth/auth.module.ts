import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { SharedModule } from '../shared/shared.module';
import { MailModule } from '../mail/mail.module';
import { RolePermissionsModule } from '../role_permissions/role-permissions.module';

@Module({
  imports: [SharedModule, MailModule, RolePermissionsModule],
  providers: [AuthService, JwtAuthGuard, PermissionsGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, PermissionsGuard, SharedModule],
})
export class AuthModule {}
