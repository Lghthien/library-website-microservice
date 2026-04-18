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
import { ReadersService } from './readers.service';
import { CreateReaderDto } from './dto/create-reader.dto';
import { UpdateReaderDto } from './dto/update-reader.dto';
import { BulkCreateReaderDto } from './dto/bulk-create-reader.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('readers')
export class ReadersController {
  constructor(private readonly readersService: ReadersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q001') // Lập thẻ độc giả
  create(@Body() createReaderDto: CreateReaderDto) {
    return this.readersService.create(createReaderDto);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q001') // Assuming typical creation permission suffices
  bulkCreate(@Body() bulkData: BulkCreateReaderDto[]) {
    return this.readersService.bulkCreate(bulkData);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q004') // Tra cứu độc giả
  findAll() {
    return this.readersService.findAll();
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q004')
  search(@Query('keyword') keyword: string) {
    return this.readersService.searchByNameOrEmail(keyword);
  }

  @Get('advanced-search')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q004')
  advancedSearch(
    @Query('status') status?: string, // active, expired
    @Query('hasDebt') hasDebt?: string, // true, false
    @Query('readerTypeId') readerTypeId?: string,
    @Query('minDebt') minDebt?: string,
    @Query('maxDebt') maxDebt?: string,
  ) {
    return this.readersService.advancedSearch({
      status,
      hasDebt: hasDebt ? hasDebt === 'true' : undefined,
      readerTypeId,
      minDebt: minDebt ? parseInt(minDebt) : undefined,
      maxDebt: maxDebt ? parseInt(maxDebt) : undefined,
    });
  }

  @Get('expired')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q004')
  getExpiredCards() {
    return this.readersService.findExpiredCards();
  }

  @Get('with-debt')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q004')
  getReadersWithDebt() {
    return this.readersService.findReadersWithDebt();
  }

  // IMPORTANT: Specific routes like :id/renew MUST come BEFORE parameterized routes like :id
  @Patch(':id/renew')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q002') // Gia hạn thẻ độc giả
  renewCard(@Param('id') id: string, @Body() body?: { months?: number }) {
    return this.readersService.renewCard(id, body?.months);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q004')
  findOne(@Param('id') id: string) {
    return this.readersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q002') // Sửa thông tin độc giả
  update(@Param('id') id: string, @Body() updateReaderDto: UpdateReaderDto) {
    return this.readersService.update(id, updateReaderDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q003') // Xóa độc giả
  remove(@Param('id') id: string) {
    return this.readersService.remove(id);
  }
}
