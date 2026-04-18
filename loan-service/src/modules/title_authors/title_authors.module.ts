import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TitleAuthorsService } from './title_authors.service';
import { TitleAuthorsController } from './title_authors.controller';
import { TitleAuthor, TitleAuthorSchema } from './schema/title-author.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TitleAuthor.name, schema: TitleAuthorSchema },
    ]),
  ],
  controllers: [TitleAuthorsController],
  providers: [TitleAuthorsService],
  exports: [MongooseModule],
})
export class TitleAuthorsModule {}
