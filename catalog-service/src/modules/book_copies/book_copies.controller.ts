import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BookCopiesService } from './book_copies.service';
import { CreateBookCopyDto } from './dto/create-book_copy.dto';
import { UpdateBookCopyDto } from './dto/update-book_copy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('book-copies')
export class BookCopiesController {
  constructor(private readonly bookCopiesService: BookCopiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q005') // Tiếp nhận sách (tạo bản copy)
  create(@Body() createBookCopyDto: CreateBookCopyDto) {
    return this.bookCopiesService.create(createBookCopyDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q008') // Tra cứu sách
  findAll() {
    return this.bookCopiesService.findAll();
  }

  @Get('book/:bookId')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q008')
  findByBook(@Param('bookId') bookId: string) {
    return this.bookCopiesService.findByBook(bookId);
  }

  @Get('available')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q008')
  findAvailable() {
    return this.bookCopiesService.findAvailable();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q008')
  findOne(@Param('id') id: string) {
    return this.bookCopiesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q010') // Nhận trả sách (cập nhật trạng thái)
  update(
    @Param('id') id: string,
    @Body() updateBookCopyDto: UpdateBookCopyDto,
  ) {
    return this.bookCopiesService.update(id, updateBookCopyDto);
  }

  @Patch(':id/return')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q010')
  markAsReturned(@Param('id') id: string) {
    return this.bookCopiesService.markAsReturned(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q007') // Xóa sách
  remove(@Param('id') id: string) {
    return this.bookCopiesService.remove(id);
  }
}
