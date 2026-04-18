import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ReaderTypesService } from './reader_types.service';
import { CreateReaderTypeDto } from './dto/create-reader_type.dto';
import { UpdateReaderTypeDto } from './dto/update-reader_type.dto';

@Controller('reader-types')
export class ReaderTypesController {
  constructor(private readonly readerTypesService: ReaderTypesService) {}

  @Post()
  create(@Body() createReaderTypeDto: CreateReaderTypeDto) {
    return this.readerTypesService.create(createReaderTypeDto);
  }

  @Get()
  findAll() {
    return this.readerTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.readerTypesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateReaderTypeDto: UpdateReaderTypeDto,
  ) {
    return this.readerTypesService.update(id, updateReaderTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.readerTypesService.remove(id);
  }
}
