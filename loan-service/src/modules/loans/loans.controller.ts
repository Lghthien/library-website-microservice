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
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { ValidateBorrowDto } from './dto/validate-borrow.dto';
import { ReturnBookDto } from './dto/return-book.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('Q009') // Cho mượn sách
  create(@Body() createLoanDto: CreateLoanDto) {
    return this.loansService.create(createLoanDto);
  }

  /**
   * BM4 + QĐ4: Validate điều kiện cho mượn sách
   */
  @Post('validate-borrow')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('Q009')
  validateBorrow(@Body() validateBorrowDto: ValidateBorrowDto) {
    return this.loansService.validateBorrow(
      validateBorrowDto.readerId,
      validateBorrowDto.copyIds,
    );
  }

  /**
   * BM5 + QĐ5: Trả sách và tính tiền phạt
   */
  @Post(':loanId/return-book')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('Q010') // Nhận trả sách
  returnBook(
    @Param('loanId') loanId: string,
    @Body() returnBookDto: ReturnBookDto,
  ) {
    return this.loansService.returnBook(
      loanId,
      returnBookDto.copyId,
      returnBookDto.returnDate,
      returnBookDto.isLost,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('Q009')
  findAll(
    @Query('readerId') readerId?: string,
    @Query('status') status?: string,
  ) {
    // If query params provided, use filtered search
    if (readerId || status) {
      return this.loansService.findWithFilters(readerId, status);
    }
    return this.loansService.findAll();
  }

  @Get('reader/:readerId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('Q009')
  findByReader(@Param('readerId') readerId: string) {
    return this.loansService.findByReader(readerId);
  }

  @Get('overdue')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('Q009')
  findOverdueLoans() {
    return this.loansService.findOverdueLoans();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('Q009')
  findOne(@Param('id') id: string) {
    return this.loansService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('Q009')
  update(@Param('id') id: string, @Body() updateLoanDto: UpdateLoanDto) {
    return this.loansService.update(id, updateLoanDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('Q009')
  remove(@Param('id') id: string) {
    return this.loansService.remove(id);
  }
}
