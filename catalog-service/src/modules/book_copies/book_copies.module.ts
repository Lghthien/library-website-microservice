import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BookCopiesService } from './book_copies.service';
import { BookCopiesController } from './book_copies.controller';
import { BookCopy, BookCopySchema } from './schema/book-copy.schema';
import { TitleBook, TitleBookSchema } from '../title_books/schema/title-book.schema';

import { CatalogSchemasModule } from '../catalog-schemas.module';

@Module({
  imports: [
    CatalogSchemasModule,
    AuthModule,
  ],
  controllers: [BookCopiesController],
  providers: [BookCopiesService],
  exports: [CatalogSchemasModule, BookCopiesService],
})
export class BookCopiesModule {}
