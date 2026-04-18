import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category, CategorySchema } from './schema/category.schema';

import { CatalogSchemasModule } from '../catalog-schemas.module';

@Module({
  imports: [
    CatalogSchemasModule,
    AuthModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CatalogSchemasModule],
})
export class CategoriesModule {}
