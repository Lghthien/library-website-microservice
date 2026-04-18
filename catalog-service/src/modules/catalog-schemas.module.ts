import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from './books/schema/book.schema';
import { BookCopy, BookCopySchema } from './book_copies/schema/book-copy.schema';
import { TitleBook, TitleBookSchema } from './title_books/schema/title-book.schema';
import { Author, AuthorSchema } from './authors/schema/author.schema';
import { Category, CategorySchema } from './categories/schema/category.schema';
import { TitleAuthor, TitleAuthorSchema } from './title_authors/schema/title-author.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: BookCopy.name, schema: BookCopySchema },
      { name: TitleBook.name, schema: TitleBookSchema },
      { name: Author.name, schema: AuthorSchema },
      { name: Category.name, schema: CategorySchema },
      { name: TitleAuthor.name, schema: TitleAuthorSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class CatalogSchemasModule {}
