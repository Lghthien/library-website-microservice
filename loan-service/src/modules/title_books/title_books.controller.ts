import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TitleBooksService } from './title_books.service';
import { CreateTitleBookDto } from './dto/create-title_book.dto';
import { UpdateTitleBookDto } from './dto/update-title_book.dto';
import { BulkCreateBookDto } from './dto/bulk-create-book.dto';

@Controller('title-books')
export class TitleBooksController {
  constructor(private readonly titleBooksService: TitleBooksService) {}

  @Post()
  create(@Body() createTitleBookDto: CreateTitleBookDto) {
    return this.titleBooksService.create(createTitleBookDto);
  }

  @Post('bulk')
  bulkCreate(@Body() bulkData: BulkCreateBookDto[]) {
    return this.titleBooksService.bulkCreate(bulkData);
  }

  @Get()
  findAll() {
    return this.titleBooksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.titleBooksService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTitleBookDto: UpdateTitleBookDto,
  ) {
    return this.titleBooksService.update(id, updateTitleBookDto);
  }

  @Get(':id/check-delete')
  async checkDelete(@Param('id') id: string) {
    return this.titleBooksService.checkDeleteConditions(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.titleBooksService.remove(id);
  }
}
