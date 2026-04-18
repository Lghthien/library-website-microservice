import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('books')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q005') // Tiếp nhận sách
  create(@Body() createBookDto: CreateBookDto) {
    return this.booksService.create(createBookDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q008') // Tra cứu sách
  findAll() {
    return this.booksService.findAll();
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q008')
  search(
    @Query('keyword') keyword?: string,
    @Query('categoryId') categoryId?: string,
    @Query('authorId') authorId?: string,
    @Query('publishYear') publishYear?: number,
  ) {
    return this.booksService.search(keyword, categoryId, authorId, publishYear);
  }

  @Get('advanced-search')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q008')
  advancedSearch(
    @Query('keyword') keyword?: string,
    @Query('categoryId') categoryId?: string,
    @Query('authorId') authorId?: string,
    @Query('minYear') minYear?: string,
    @Query('maxYear') maxYear?: string,
    @Query('status') status?: string, // available, borrowed
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.booksService.advancedSearch({
      keyword,
      categoryId,
      authorId,
      minYear: minYear ? parseInt(minYear) : undefined,
      maxYear: maxYear ? parseInt(maxYear) : undefined,
      status,
      minPrice: minPrice ? parseInt(minPrice) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
    });
  }

  @Get('by-availability')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q008')
  getByAvailability(@Query('available') available: string = 'true') {
    return this.booksService.findByAvailability(available === 'true');
  }

  @Get('recently-added')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q008')
  getRecentlyAdded(@Query('limit') limit: string = '10') {
    return this.booksService.findRecentlyAdded(parseInt(limit));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q008')
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q006') // Sửa thông tin sách
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.booksService.update(id, updateBookDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q007') // Xóa sách
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}
