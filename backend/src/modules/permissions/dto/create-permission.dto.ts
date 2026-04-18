export class CreatePermissionDto {
  permissionId: string;
  permissionName: string;
  description?: string;
  functionGroup: 'READER' | 'BOOK' | 'TRANSACTION' | 'REPORT' | 'SYSTEM';
}
