import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TitleAuthorsService } from './title_authors.service';
import { CreateTitleAuthorDto } from './dto/create-title_author.dto';
import { UpdateTitleAuthorDto } from './dto/update-title_author.dto';

@Controller('title-authors')
export class TitleAuthorsController {
  constructor(private readonly titleAuthorsService: TitleAuthorsService) {}

  @Post()
  create(@Body() createTitleAuthorDto: CreateTitleAuthorDto) {
    return this.titleAuthorsService.create(createTitleAuthorDto);
  }

  @Get()
  findAll() {
    return this.titleAuthorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.titleAuthorsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTitleAuthorDto: UpdateTitleAuthorDto,
  ) {
    return this.titleAuthorsService.update(id, updateTitleAuthorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.titleAuthorsService.remove(id);
  }
}
