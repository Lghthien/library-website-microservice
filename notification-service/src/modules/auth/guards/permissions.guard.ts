import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RolePermission } from '../../role_permissions/schema/role-permission.schema';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(RolePermission.name)
    private rolePermissionModel: Model<RolePermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Kiểm tra xem user có các quyền yêu cầu không
    const userPermissions = await this.rolePermissionModel.find({
      role: user.role,
    });
    const userPermissionIds = userPermissions.map((p) => p.permissionId);

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissionIds.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'User does not have the required permissions',
      );
    }

    return true;
  }
}
