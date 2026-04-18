import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolePermissionsModule } from './modules/role_permissions/role-permissions.module';
import { LoginHistoryModule } from './modules/login_history/login-history.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/library',
    ),
    AuthModule,
    UsersModule,
    PermissionsModule,
    RolePermissionsModule,
    LoginHistoryModule,
  ],
})
export class AppModule {}
