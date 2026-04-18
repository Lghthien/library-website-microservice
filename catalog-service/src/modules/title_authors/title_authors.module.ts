import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TitleAuthorsService } from './title_authors.service';
import { TitleAuthorsController } from './title_authors.controller';
import { TitleAuthor, TitleAuthorSchema } from './schema/title-author.schema';

import { CatalogSchemasModule } from '../catalog-schemas.module';

@Module({
  imports: [
    CatalogSchemasModule,
  ],
  controllers: [TitleAuthorsController],
  providers: [TitleAuthorsService],
  exports: [CatalogSchemasModule],
})
export class TitleAuthorsModule {}
