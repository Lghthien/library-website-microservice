import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReaderTypesService } from './reader_types.service';
import { ReaderTypesController } from './reader_types.controller';
import { ReaderType, ReaderTypeSchema } from './schema/reader-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReaderType.name, schema: ReaderTypeSchema },
    ]),
  ],
  controllers: [ReaderTypesController],
  providers: [ReaderTypesService],
  exports: [MongooseModule],
})
export class ReaderTypesModule {}
