import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { User, UserSchema } from '../users/schema/user.schema';
import {
  LoginHistory,
  LoginHistorySchema,
} from '../login_history/schema/login-history.schema';
import {
  RolePermission,
  RolePermissionSchema,
} from '../role_permissions/schema/role-permission.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: LoginHistory.name, schema: LoginHistorySchema },
      { name: RolePermission.name, schema: RolePermissionSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  exports: [MongooseModule, JwtModule],
})
export class SharedModule {}
