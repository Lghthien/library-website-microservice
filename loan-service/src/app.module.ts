import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { LoansModule } from './modules/loans/loans.module';
import { LoansDetailsModule } from './modules/loans_details/loans_details.module';
import { FineReceiptsModule } from './modules/fine_receipts/fine_receipts.module';
import { TitleBooksModule } from './modules/title_books/title_books.module';
import { BooksModule } from './modules/books/books.module';
import { BookCopiesModule } from './modules/book_copies/book_copies.module';
import { Book, BookSchema } from './modules/books/schema/book.schema';
import {
  TitleBook,
  TitleBookSchema,
} from './modules/title_books/schema/title-book.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/library',
    ),
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: TitleBook.name, schema: TitleBookSchema },
    ]),
    AuthModule,
    LoansModule,
    LoansDetailsModule,
    FineReceiptsModule,
    TitleBooksModule,
    BooksModule,
    BookCopiesModule,
  ],
})
export class AppModule {}
