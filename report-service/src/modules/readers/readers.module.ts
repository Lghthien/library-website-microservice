import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ReadersService } from './readers.service';
import { ReadersController } from './readers.controller';
import { Reader, ReaderSchema } from './schema/reader.schema';
import {
  ReaderType,
  ReaderTypeSchema,
} from '../reader_types/schema/reader-type.schema';
import {
  Parameter,
  ParameterSchema,
} from '../parameters/schema/parameter.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reader.name, schema: ReaderSchema },
      { name: ReaderType.name, schema: ReaderTypeSchema },
      { name: Parameter.name, schema: ParameterSchema },
    ]),
    AuthModule,
  ],
  controllers: [ReadersController],
  providers: [ReadersService],
  exports: [MongooseModule],
})
export class ReadersModule {}
