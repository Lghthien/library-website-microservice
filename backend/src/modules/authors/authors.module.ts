import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { AuthorsService } from './authors.service';
import { AuthorsController } from './authors.controller';
import { Author, AuthorSchema } from './schema/author.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Author.name, schema: AuthorSchema }]),
    AuthModule,
  ],
  controllers: [AuthorsController],
  providers: [AuthorsService],
  exports: [MongooseModule],
})
export class AuthorsModule {}
