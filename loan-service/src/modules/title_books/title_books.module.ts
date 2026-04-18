import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TitleBooksService } from './title_books.service';
import { TitleBooksController } from './title_books.controller';
import { TitleBook, TitleBookSchema } from './schema/title-book.schema';
import { AuthorsModule } from '../authors/authors.module';
import { CategoriesModule } from '../categories/categories.module';
import { BooksModule } from '../books/books.module';
import { TitleAuthorsModule } from '../title_authors/title_authors.module';
import { BookCopiesModule } from '../book_copies/book_copies.module';

import { CatalogSchemasModule } from '../catalog-schemas.module';

@Module({
  imports: [
    CatalogSchemasModule,
    AuthorsModule,
    CategoriesModule,
    BooksModule,
    TitleAuthorsModule,
    BookCopiesModule,
  ],
  controllers: [TitleBooksController],
  providers: [TitleBooksService],
  exports: [CatalogSchemasModule],
})
export class TitleBooksModule {}
