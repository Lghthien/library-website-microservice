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

import { CatalogSchemasModule } from '../catalog-schemas.module';

@Module({
  imports: [
    CatalogSchemasModule,
    MongooseModule.forFeature([
      { name: Parameter.name, schema: ParameterSchema },
    ]),
    AuthModule,
  ],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [CatalogSchemasModule, MongooseModule],
})
export class BooksModule {}
