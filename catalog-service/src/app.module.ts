import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { BooksModule } from './modules/books/books.module';
import { TitleBooksModule } from './modules/title_books/title_books.module';
import { BookCopiesModule } from './modules/book_copies/book_copies.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { AuthorsModule } from './modules/authors/authors.module';
import { TitleAuthorsModule } from './modules/title_authors/title_authors.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/library',
    ),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    BooksModule,
    TitleBooksModule,
    BookCopiesModule,
    CategoriesModule,
    AuthorsModule,
    TitleAuthorsModule,
  ],
})
export class AppModule {}
