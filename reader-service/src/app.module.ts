import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { ReadersModule } from './modules/readers/readers.module';
import { ReaderTypesModule } from './modules/reader_types/reader_types.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/library',
    ),
    AuthModule,
    ReadersModule,
    ReaderTypesModule,
  ],
})
export class AppModule {}
