import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoansDetailsService } from './loans_details.service';
import { LoansDetailsController } from './loans_details.controller';
import { LoanDetail, LoanDetailSchema } from './schema/loan-detail.schema';
import { BookCopiesModule } from '../book_copies/book_copies.module';
import { ReadersModule } from '../readers/readers.module';
import { Loan, LoanSchema } from '../loans/schema/loan.schema';
import {
  Parameter,
  ParameterSchema,
} from '../parameters/schema/parameter.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LoanDetail.name, schema: LoanDetailSchema },
      { name: Loan.name, schema: LoanSchema }, // Thêm để lấy dueDate
      { name: Parameter.name, schema: ParameterSchema }, // Thêm để lấy QD8_FINE_PER_DAY
    ]),
    BookCopiesModule,
    ReadersModule,
  ],
  controllers: [LoansDetailsController],
  providers: [LoansDetailsService],
  exports: [MongooseModule],
})
export class LoansDetailsModule {}
