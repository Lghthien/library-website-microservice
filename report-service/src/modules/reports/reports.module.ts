import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Loan, LoanSchema } from '../loans/schema/loan.schema';
import { Reader, ReaderSchema } from '../readers/schema/reader.schema';
import { Book, BookSchema } from '../books/schema/book.schema';
import {
  FineReceipt,
  FineReceiptSchema,
} from '../fine_receipts/schema/fine-receipt.schema';
import { TitleBook, TitleBookSchema } from '../title_books/schema/title.schema';
import {
  LoanDetail,
  LoanDetailSchema,
} from '../loans_details/schema/loan-detail.schema';
import {
  Parameter,
  ParameterSchema,
} from '../parameters/schema/parameter.schema';
import {
  BookCopy,
  BookCopySchema,
} from '../book_copies/schema/book-copy.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Loan.name, schema: LoanSchema },
      { name: Reader.name, schema: ReaderSchema },
      { name: Book.name, schema: BookSchema },
      { name: FineReceipt.name, schema: FineReceiptSchema },
      { name: TitleBook.name, schema: TitleBookSchema },
      { name: LoanDetail.name, schema: LoanDetailSchema },
      { name: Parameter.name, schema: ParameterSchema },
      { name: BookCopy.name, schema: BookCopySchema },
    ]),
    AuthModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
