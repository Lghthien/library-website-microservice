import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { Loan, LoanDocument } from './schema/loan.schema';
import { Reader, ReaderDocument } from '../readers/schema/reader.schema';
import {
  TitleBook,
  TitleBookDocument,
} from '../title_books/schema/title-book.schema';
import {
  LoanDetail,
  LoanDetailDocument,
} from '../loans_details/schema/loan-detail.schema';
import {
  BookCopy,
  BookCopyDocument,
} from '../book_copies/schema/book-copy.schema';
import {
  Parameter,
  ParameterDocument,
} from '../parameters/schema/parameter.schema';

// Helper function to create Date in Vietnam timezone (UTC+7)
function getVietnamDate(dateInput?: string | Date): Date {
  const date = dateInput ? new Date(dateInput) : new Date();
  // Convert to Vietnam timezone
  const vietnamTimeString = date.toLocaleString('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  return new Date(vietnamTimeString);
}

@Injectable()
export class LoansService {
  constructor(
    @InjectModel(Loan.name) private loanModel: Model<LoanDocument>,
    @InjectModel(Reader.name) private readerModel: Model<ReaderDocument>,
    @InjectModel(LoanDetail.name)
    private loanDetailModel: Model<LoanDetailDocument>,
    @InjectModel(BookCopy.name) private bookCopyModel: Model<BookCopyDocument>,
    @InjectModel(TitleBook.name)
    private titleBookModel: Model<TitleBookDocument>, // Injected TitleBook
    @InjectModel(Parameter.name)
    private parameterModel: Model<ParameterDocument>,
  ) {}

  async create(createLoanDto: CreateLoanDto) {
    // Validate before creating loan
    const validation = await this.validateBorrow(
      createLoanDto.readerId,
      createLoanDto.bookIds,
    );

    if (!validation.canBorrow) {
      throw new BadRequestException({
        message: 'Không thể tạo phiếu mượn',
        errors: validation.errors,
      });
    }

    // Convert readerId string to ObjectId
    const createdLoan = new this.loanModel({
      readerId: new Types.ObjectId(createLoanDto.readerId),
      borrowDate: getVietnamDate(),
    });
    return (await createdLoan.save()).populate('readerId');
  }

  async findAll() {
    // 1. Get all loans with readers
    const loans = await this.loanModel
      .find()
      .populate('readerId')
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean()
      .exec();

    // 2. Get all loan IDs
    const loanIds = loans.map((loan) => loan._id);

    // 3. Get ALL loan details for these loans in ONE query
    const allLoanDetails = await this.loanDetailModel
      .find({ loanId: { $in: loanIds } })
      .populate({
        path: 'copyId',
        select: 'bookId',
        populate: {
          path: 'bookId',
          select: 'titleId',
          populate: {
            path: 'titleId',
            select: 'title price', // Select minimal fields needed
          },
        },
      })
      .lean()
      .exec();

    // 4. Group details by loanId
    const detailsMap = new Map();
    allLoanDetails.forEach((detail) => {
      const lid = detail.loanId.toString();
      if (!detailsMap.has(lid)) {
        detailsMap.set(lid, []);
      }
      detailsMap.get(lid).push(detail);
    });

    // 5. Get Parameters for calculations (Batch get)
    const [maxDaysParam, fineParam, fineParamQD8] = await Promise.all([
      this.parameterModel.findOne({ paramName: 'QD4_MAX_BORROW_DAYS' }).lean(),
      this.parameterModel.findOne({ paramName: 'QD_FINE_PER_DAY' }).lean(),
      this.parameterModel.findOne({ paramName: 'QD8_FINE_PER_DAY' }).lean(),
    ]);

    const maxBorrowDays = maxDaysParam ? parseInt(maxDaysParam.paramValue) : 4;
    const finePerDay = fineParamQD8
      ? parseInt(fineParamQD8.paramValue)
      : fineParam
        ? parseInt(fineParam.paramValue)
        : 1000;

    const todayTemp = getVietnamDate();
    const today = new Date(
      todayTemp.getFullYear(),
      todayTemp.getMonth(),
      todayTemp.getDate(),
    );

    // 6. Enrich loans (Memory processing)
    const enrichedLoans = loans.map((loan) => {
      // Get associated details
      const loanDetails = detailsMap.get(loan._id.toString()) || [];

      // Calculate Due Date
      const borrowDate = getVietnamDate(loan.borrowDate);
      const dueDateTemp = getVietnamDate(borrowDate);
      dueDateTemp.setDate(dueDateTemp.getDate() + maxBorrowDays);
      const dueDate = new Date(
        dueDateTemp.getFullYear(),
        dueDateTemp.getMonth(),
        dueDateTemp.getDate(),
      );

      // Check status
      // A loan is "Returned" if all its details have a returnDate
      const allReturned =
        loanDetails.length > 0 && loanDetails.every((d) => d.returnDate);

      // A loan is "Overdue" if NOT returned AND today > dueDate
      // Note: If partially returned, check if remaining items are overdue
      const isOverdue = !allReturned && today > dueDate;

      let status = 'active'; // Default
      if (allReturned) {
        status = 'returned';
      } else if (isOverdue) {
        status = 'overdue';
      }

      // Calculate fines
      let totalFine = 0;
      let overdueDays = 0;

      if (isOverdue) {
        // Calculate overdue days
        const diffTime = today.getTime() - dueDate.getTime();
        overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Only count fines for books NOT yet returned
        const notReturnedCount = loanDetails.filter(
          (d) => !d.returnDate,
        ).length;
        // Estimated potential fine (if they returned today)
        const estimatedFine = overdueDays * finePerDay * notReturnedCount;
        totalFine += estimatedFine;
      }

      // Add existing fines from books that were actually returned late or lost
      const existingFines = loanDetails.reduce(
        (sum, d) => sum + (d.fineAmount || 0),
        0,
      );
      totalFine += existingFines;

      // Find latest return date
      let latestReturnDate: Date | undefined;
      if (allReturned) {
        loanDetails.forEach((d) => {
          if (d.returnDate) {
            const rDate = new Date(d.returnDate);
            if (!latestReturnDate || rDate > latestReturnDate) {
              latestReturnDate = rDate;
            }
          }
        });
      }

      return {
        _id: loan._id,
        readerId: loan.readerId,
        borrowDate: borrowDate.toLocaleDateString('vi-VN'),
        dueDate: dueDate.toLocaleDateString('vi-VN'),
        returnDate: latestReturnDate
          ? latestReturnDate.toLocaleDateString('vi-VN')
          : undefined,
        status,
        overdueDays: status === 'overdue' ? overdueDays : 0,
        totalFine, // This field maps to 'fineAmount' in frontend expected interface? Standardize on totalFine or fineAmount.
        // Frontend uses: overdueDays, fineAmount, bookCount, status, etc.
        fineAmount: totalFine,
        bookCount: loanDetails.length,
        loanDetails, // Include details if frontend needs deep dive
      };
    });

    return enrichedLoans;
  }

  async findWithFilters(readerId?: string, status?: string) {
    const query: any = {};

    // Convert readerId string to ObjectId for proper querying
    if (readerId) {
      query.readerId = new Types.ObjectId(readerId);
    }

    // Populate loan details to check status
    const loans = await this.loanModel
      .find(query)
      .populate('readerId')
      .populate({
        path: 'loanDetails',
        populate: {
          path: 'copyId',
          populate: {
            path: 'bookId',
            populate: {
              path: 'titleId',
              select: 'title publisher publishYear isbn',
            },
          },
        },
      })
      .exec();

    // Filter by status if provided
    if (status === 'borrowing') {
      // Only return loans that have unreturned books
      return loans.filter((loan) => {
        const loanDetails = (loan as any).loanDetails || [];
        return loanDetails.some((detail: any) => !detail.returnDate);
      });
    }

    return loans;
  }

  async findByReader(readerId: string) {
    // Convert readerId string to ObjectId
    return this.loanModel
      .find({ readerId: new Types.ObjectId(readerId) })
      .populate('readerId')
      .exec();
  }

  async findOverdueLoans() {
    return this.loanModel
      .find({ dueDate: { $lt: new Date() } })
      .populate('readerId')
      .exec();
  }

  async search(keyword: string) {
    const query: any = {};
    if (keyword) {
      query.$or = [];
    }
    return this.loanModel.find(query).populate('readerId').exec();
  }

  async findOne(id: string) {
    return this.loanModel.findById(id).populate('readerId').exec();
  }

  async update(id: string, updateLoanDto: UpdateLoanDto) {
    return this.loanModel
      .findByIdAndUpdate(id, updateLoanDto, { new: true })
      .populate('readerId')
      .exec();
  }

  async remove(id: string) {
    return this.loanModel.findByIdAndDelete(id).exec();
  }

  /**
   * BM4 + QĐ4: Validate điều kiện cho mượn sách
   */
  async validateBorrow(readerId: string, copyIds: string[]) {
    const errors: Array<{ code: string; message: string }> = [];

    // 1. Kiểm tra reader tồn tại
    const reader = await this.readerModel
      .findById(readerId)
      .populate('readerTypeId');
    if (!reader) {
      throw new NotFoundException('Không tìm thấy độc giả');
    }

    // 2. Kiểm tra thẻ còn hạn
    const now = getVietnamDate();
    if (now > getVietnamDate(reader.expiryDate)) {
      errors.push({
        code: 'CARD_EXPIRED',
        message: `Thẻ đã hết hạn từ ${getVietnamDate(reader.expiryDate).toLocaleDateString('vi-VN')}`,
      });
    }

    // 3. Lấy tất cả phiếu mượn của độc giả (convert readerId to ObjectId)
    const readerLoans = await this.loanModel
      .find({ readerId: new Types.ObjectId(readerId) })
      .exec();
    const loanIds = readerLoans.map((l) => l._id);

    // 4. Kiểm tra có sách quá hạn chưa trả
    // 4. Kiểm tra có sách quá hạn chưa trả
    const maxBorrowDaysParam = await this.parameterModel.findOne({
      paramName: 'QD4_MAX_BORROW_DAYS',
    });
    const maxBorrowDays = maxBorrowDaysParam
      ? parseInt(maxBorrowDaysParam.paramValue)
      : 4;

    const overdueDetails = await this.loanDetailModel
      .find({
        loanId: { $in: loanIds },
        returnDate: null,
      })
      .populate({
        path: 'loanId',
        select: 'borrowDate',
      });

    const hasOverdue = overdueDetails.some((detail) => {
      const loan = detail.loanId as any;
      const expectedReturnDate = getVietnamDate(loan.borrowDate);
      expectedReturnDate.setDate(expectedReturnDate.getDate() + maxBorrowDays);
      return now > expectedReturnDate;
    });

    if (hasOverdue) {
      errors.push({
        code: 'HAS_OVERDUE',
        message: 'Độc giả có sách quá hạn chưa trả',
      });
    }

    // 5. Kiểm tra số sách đang mượn
    const currentBorrowCount = await this.loanDetailModel.countDocuments({
      loanId: { $in: loanIds },
      returnDate: null,
    });

    // Sử dụng maxBorrowLimit từ readerType thay vì parameter toàn cục
    const readerType = reader.readerTypeId as any;
    const maxBorrowLimit = readerType?.maxBorrowLimit || 5;

    if (currentBorrowCount + copyIds.length > maxBorrowLimit) {
      errors.push({
        code: 'EXCEED_LIMIT',
        message: `Vượt quá số sách cho phép mượn (${maxBorrowLimit}). Hiện đang mượn ${currentBorrowCount} cuốn`,
      });
    }

    // 6. Kiểm tra sách có sẵn để mượn
    const copies = await this.bookCopyModel.find({ _id: { $in: copyIds } });

    if (copies.length !== copyIds.length) {
      errors.push({
        code: 'BOOK_NOT_FOUND',
        message: 'Một số sách không tồn tại trong hệ thống',
      });
    }

    const unavailableCopies = copies.filter((c) => c.status === 0);
    if (unavailableCopies.length > 0) {
      errors.push({
        code: 'BOOK_UNAVAILABLE',
        message: `${unavailableCopies.length} sách đang được mượn bởi người khác`,
      });
    }

    return {
      canBorrow: errors.length === 0,
      errors,
      reader: {
        fullName: reader.fullName,
        _id: reader._id,
        expiryDate: reader.expiryDate,
        currentBorrowCount,
        maxBorrowLimit,
        hasOverdueBooks: hasOverdue,
        totalDebt: reader.totalDebt,
      },
    };
  }

  /**
   * BM5 + QĐ5: Trả sách và tính tiền phạt
   */
  async returnBook(
    loanId: string,
    copyId: string,
    returnDateStr?: string,
    isLost?: boolean,
  ) {
    const actualReturnDate = returnDateStr
      ? getVietnamDate(returnDateStr)
      : getVietnamDate();

    // 1. Tìm loan detail
    const loanDetail = await this.loanDetailModel
      .findOne({
        loanId: new Types.ObjectId(loanId),
        copyId: new Types.ObjectId(copyId),
      })
      .populate('loanId');

    if (!loanDetail) {
      throw new NotFoundException('Không tìm thấy sách trong phiếu mượn');
    }

    if (loanDetail.returnDate) {
      throw new BadRequestException('Sách đã được trả trước đó');
    }

    // 2. Lấy thông tin loan
    const loan = loanDetail.loanId as any;

    // 3. Lấy thông tin sách (để lấy giá và cập nhật trạng thái)
    const bookCopy = await this.bookCopyModel.findById(copyId).populate({
      path: 'bookId',
      populate: { path: 'titleId' },
    });

    if (!bookCopy) {
      throw new NotFoundException('Không tìm thấy thông tin sách');
    }

    const bookInfo = bookCopy.bookId as any;
    const titleInfo = bookInfo?.titleId;

    // 4. Lấy MAX_BORROW_DAYS từ parameters
    const maxDaysParam = await this.parameterModel.findOne({
      paramName: 'QD4_MAX_BORROW_DAYS',
    });
    const maxDays = maxDaysParam ? parseInt(maxDaysParam.paramValue) : 4;

    // 5. Tính ngày dự kiến trả
    const borrowDate = getVietnamDate(loan.borrowDate);
    const expectedReturnDateTemp = new Date(borrowDate);
    expectedReturnDateTemp.setDate(expectedReturnDateTemp.getDate() + maxDays);

    // Tạo Date object chỉ từ year/month/day
    const expectedReturnDate = new Date(
      expectedReturnDateTemp.getFullYear(),
      expectedReturnDateTemp.getMonth(),
      expectedReturnDateTemp.getDate(),
    );

    const returnTemp = getVietnamDate(actualReturnDate);
    const normalizedReturnDate = new Date(
      returnTemp.getFullYear(),
      returnTemp.getMonth(),
      returnTemp.getDate(),
    );

    // 6. Tính số ngày quá hạn
    const overdueDays = Math.max(
      0,
      Math.floor(
        (normalizedReturnDate.getTime() - expectedReturnDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    // 7. Tính tiền phạt
    let finePerDayParam = await this.parameterModel.findOne({
      paramName: 'QD8_FINE_PER_DAY',
    });
    // Fallback if QD8 is not found
    if (!finePerDayParam) {
      finePerDayParam = await this.parameterModel.findOne({
        paramName: 'QD_FINE_PER_DAY',
      });
    }

    const finePerDay = finePerDayParam
      ? parseInt(finePerDayParam.paramValue)
      : 1000;

    let fineAmount = overdueDays * finePerDay;

    // Nếu mất sách, cộng thêm giá trị sách vào tiền phạt
    if (isLost) {
      // Use book price if available, otherwise title price, otherwise default 0
      const bookPrice = bookInfo?.price || titleInfo?.price || 0;
      fineAmount += bookPrice;
    }

    // 8. Update loan_detail
    loanDetail.returnDate = actualReturnDate;
    loanDetail.overdueDays = overdueDays;
    loanDetail.fineAmount = fineAmount;
    await loanDetail.save();

    // 9. Update book_copy status and TitleBook lost count
    const newStatus = isLost ? 2 : 1; // 2 = Lost, 1 = Available
    await this.bookCopyModel.updateOne({ _id: copyId }, { status: newStatus });

    if (isLost && titleInfo) {
      await this.titleBookModel.updateOne(
        { _id: titleInfo._id },
        { $inc: { lostCopies: 1 } },
      );
    }

    // 10. Update reader totalDebt
    const reader = await this.readerModel.findById(loan.readerId);
    if (reader) {
      reader.totalDebt = (reader.totalDebt || 0) + fineAmount;
      await reader.save();
    }

    // 11. Check if all books in this loan are returned
    const remainingActiveDetails = await this.loanDetailModel.countDocuments({
      loanId: new Types.ObjectId(loanId),
      returnDate: null,
    });

    console.log(
      `Loan ${loanId} - Remaining active details: ${remainingActiveDetails}`,
    );

    if (remainingActiveDetails === 0) {
      // All books returned!
      // Do NOT delete Loan and LoanDetails to preserve history.
      console.log(`Loan ${loanId} fully returned. Keeping record for history.`);
    }

    return {
      success: true,
      loanDetail: {
        copyId: bookCopy?._id,
        bookTitle: titleInfo?.title || 'N/A',
        borrowDate: loan.borrowDate,
        returnDate: actualReturnDate,
        expectedReturnDate,
        overdueDays,
        fineAmount,
      },
      reader: {
        fullName: reader?.fullName,
        totalDebt: reader?.totalDebt || 0,
        newDebt: fineAmount,
      },
      isLoanDeleted: remainingActiveDetails === 0,
    };
  }
}
