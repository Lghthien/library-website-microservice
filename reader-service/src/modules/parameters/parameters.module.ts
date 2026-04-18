import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ParametersService } from './parameters.service';
import { ParametersController } from './parameters.controller';
import { Parameter, ParameterSchema } from './schema/parameter.schema';
import { AuditLogsModule } from '../audit_logs/audit-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Parameter.name, schema: ParameterSchema },
    ]),
    AuthModule,
    AuditLogsModule,
  ],
  controllers: [ParametersController],
  providers: [ParametersService],
  exports: [MongooseModule],
})
export class ParametersModule {}
