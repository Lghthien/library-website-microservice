import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthorsService } from './authors.service';
import { AuthorsController } from './authors.controller';
import { Author, AuthorSchema } from './schema/author.schema';

import { CatalogSchemasModule } from '../catalog-schemas.module';

@Module({
  imports: [CatalogSchemasModule, AuthModule],
  controllers: [AuthorsController],
  providers: [AuthorsService],
  exports: [CatalogSchemasModule],
})
export class AuthorsModule {}
