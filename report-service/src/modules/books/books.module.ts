import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { Book, BookSchema } from './schema/book.schema';
import {
  Parameter,
  ParameterSchema,
} from '../parameters/schema/parameter.schema';
import {
  TitleBook,
  TitleBookSchema,
} from '../title_books/schema/title-book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),
    MongooseModule.forFeature([
      { name: Parameter.name, schema: ParameterSchema },
    ]),
    MongooseModule.forFeature([
      { name: TitleBook.name, schema: TitleBookSchema },
    ]),
    AuthModule,
  ],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [MongooseModule],
})
export class BooksModule {}
