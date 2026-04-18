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
import { FineReceiptsService } from './fine_receipts.service';
import { CreateFineReceiptDto } from './dto/create-fine_receipt.dto';
import { UpdateFineReceiptDto } from './dto/update-fine_receipt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('fine-receipts')
export class FineReceiptsController {
  constructor(private readonly fineReceiptsService: FineReceiptsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q011') // Thu tiền phạt (tạo phiếu thu)
  create(@Body() createFineReceiptDto: CreateFineReceiptDto) {
    return this.fineReceiptsService.create(createFineReceiptDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q011')
  findAll() {
    return this.fineReceiptsService.findAll();
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q011')
  search(
    @Query('keyword') keyword?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.fineReceiptsService.search(
      keyword,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('reader/:readerId')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q011')
  findByReader(@Param('readerId') readerId: string) {
    return this.fineReceiptsService.findByReader(readerId);
  }

  @Get('unpaid')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q011')
  findUnpaid() {
    return this.fineReceiptsService.findUnpaid();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q011')
  findOne(@Param('id') id: string) {
    return this.fineReceiptsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q011')
  update(
    @Param('id') id: string,
    @Body() updateFineReceiptDto: UpdateFineReceiptDto,
  ) {
    return this.fineReceiptsService.update(id, updateFineReceiptDto);
  }

  @Patch(':id/pay')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q011')
  markAsPaid(
    @Param('id') id: string,
    @Body() body: { paymentDate?: Date; notes?: string },
  ) {
    return this.fineReceiptsService.markAsPaid(
      id,
      body.paymentDate,
      body.notes,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('Q011')
  remove(@Param('id') id: string) {
    return this.fineReceiptsService.remove(id);
  }
}
