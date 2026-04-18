import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { Loan, LoanSchema } from './schema/loan.schema';
import { Reader, ReaderSchema } from '../readers/schema/reader.schema';
import {
  Parameter,
  ParameterSchema,
} from '../parameters/schema/parameter.schema';
import {
  LoanDetail,
  LoanDetailSchema,
} from '../loans_details/schema/loan-detail.schema';
import {
  BookCopy,
  BookCopySchema,
} from '../book_copies/schema/book-copy.schema';
import {
  TitleBook,
  TitleBookSchema,
} from '../title_books/schema/title-book.schema';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Loan.name, schema: LoanSchema },
      { name: Reader.name, schema: ReaderSchema },
      { name: Parameter.name, schema: ParameterSchema },
      { name: LoanDetail.name, schema: LoanDetailSchema },
      { name: BookCopy.name, schema: BookCopySchema },
      { name: TitleBook.name, schema: TitleBookSchema }, // Added TitleBook
    ]),
    SharedModule,
  ],
  controllers: [LoansController],
  providers: [LoansService],
})
export class LoansModule {}
