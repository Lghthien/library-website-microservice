import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BookCopiesService } from './book_copies.service';
import { BookCopiesController } from './book_copies.controller';
import { BookCopy, BookCopySchema } from './schema/book-copy.schema';
import {
  TitleBook,
  TitleBookSchema,
} from '../title_books/schema/title-book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BookCopy.name, schema: BookCopySchema },
      { name: TitleBook.name, schema: TitleBookSchema },
    ]),
    AuthModule,
  ],
  controllers: [BookCopiesController],
  providers: [BookCopiesService],
  exports: [MongooseModule, BookCopiesService],
})
export class BookCopiesModule {}
