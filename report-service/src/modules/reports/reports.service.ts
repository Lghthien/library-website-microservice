import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Loan, LoanDocument } from '../loans/schema/loan.schema';
import { Reader, ReaderDocument } from '../readers/schema/reader.schema';
import { Book, BookDocument } from '../books/schema/book.schema';
import {
  FineReceipt,
  FineReceiptDocument,
} from '../fine_receipts/schema/fine-receipt.schema';
import {
  TitleBook,
  TitleBookDocument,
} from '../title_books/schema/title-book.schema';
import {
  Parameter,
  ParameterDocument,
} from '../parameters/schema/parameter.schema';
import {
  BookCopy,
  BookCopyDocument,
} from '../book_copies/schema/book-copy.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Loan.name) private loanModel: Model<LoanDocument>,
    @InjectModel(Reader.name) private readerModel: Model<ReaderDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(FineReceipt.name)
    private fineReceiptModel: Model<FineReceiptDocument>,
    @InjectModel(TitleBook.name)
    private titleBookModel: Model<TitleBookDocument>,
    @InjectModel(Parameter.name)
    private parameterModel: Model<ParameterDocument>,
    @InjectModel(BookCopy.name)
    private bookCopyModel: Model<BookCopyDocument>,
  ) {}

  // BM7.1: Thống kê mượn theo thể loại (Borrow statistics by category)
  async getBorrowStatisticsByCategory(
    startDate?: Date,
    endDate?: Date,
  ): Promise<Record<string, unknown>[]> {
    const matchStage: Record<string, unknown> = {};

    if (startDate || endDate) {
      (matchStage as any).borrowDate = {};
      if (startDate) (matchStage as any).borrowDate.$gte = new Date(startDate);
      if (endDate) (matchStage as any).borrowDate.$lte = new Date(endDate);
    }

    const stats = await this.loanModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'loandetails',
          localField: '_id',
          foreignField: 'loanId',
          as: 'loanDetail',
        },
      },
      { $unwind: '$loanDetail' },
      {
        $lookup: {
          from: 'bookcopies',
          localField: 'loanDetail.copyId',
          foreignField: '_id',
          as: 'bookCopy',
        },
      },
      { $unwind: '$bookCopy' },
      {
        $lookup: {
          from: 'books',
          localField: 'bookCopy.bookId',
          foreignField: '_id',
          as: 'book',
        },
      },
      { $unwind: '$book' },
      {
        $lookup: {
          from: 'titlebooks',
          localField: 'book.titleId',
          foreignField: '_id',
          as: 'title',
        },
      },
      { $unwind: '$title' },
      {
        $lookup: {
          from: 'categories',
          localField: 'title.categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          categoryName: { $first: '$category.categoryName' },
          borrowCount: { $sum: 1 },
          totalReaders: { $addToSet: '$readerId' },
        },
      },
      {
        $project: {
          categoryName: 1,
          borrowCount: 1,
          uniqueReaders: { $size: '$totalReaders' },
        },
      },
      { $sort: { borrowCount: -1 } },
    ]);

    return stats as unknown as Record<string, unknown>[];
  }

  // BM7.2: Báo cáo trả sách trễ hạn (Late returns / Overdue loans)
  async getOverdueLoans(
    startDate?: Date,
    endDate?: Date,
    viewDate?: Date,
  ): Promise<Record<string, unknown>[]> {
    // viewDate acts as the "As Of" date. Default to now if not provided.
    // If user provided endDate but not viewDate, they might mean "status at end of period",
    // but usually report viewing implies "current status" unless specific point-in-time is requested.
    // Let's default to NOW if viewDate is missing, to keep consistent with "System Date".
    const comparisonDate = viewDate ? new Date(viewDate) : new Date();

    // Ensure comparison includes the whole day (set to 23:59:59 if it's a date-only input, or just keep exact if it has time)
    // Actually, usually "Overdue on date X" checks status at END of date X.
    // So let's force comparisonDate to end of that day if it looks like a date-boundary.
    // But to be safe, let's just use the passed date if provided.

    // Get max borrow days from parameters
    const param = await this.parameterModel.findOne({
      paramName: 'QD4_MAX_BORROW_DAYS',
    });
    const maxDays = param ? parseInt(param.paramValue) : 4; // Default 4 days if not found

    // Build initial match stage for borrowDate filter
    const initialMatchStage: Record<string, unknown> = {};
    if (startDate || endDate) {
      (initialMatchStage as any).borrowDate = {};
      if (startDate)
        (initialMatchStage as any).borrowDate.$gte = new Date(startDate);
      if (endDate)
        (initialMatchStage as any).borrowDate.$lte = new Date(endDate);
    }

    const pipeline: any[] = [];

    // Add initial match if date filters exist
    if (Object.keys(initialMatchStage).length > 0) {
      pipeline.push({ $match: initialMatchStage });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'loandetails',
          localField: '_id',
          foreignField: 'loanId',
          as: 'loanDetail',
        },
      },
      { $unwind: '$loanDetail' },
      {
        $match: {
          $or: [
            { 'loanDetail.returnDate': null }, // Chưa trả
            { 'loanDetail.returnDate': { $gt: comparisonDate } }, // Hoặc trả SAU ngày xem báo cáo
          ],
        },
      },
      {
        $addFields: {
          dueDate: {
            $add: ['$borrowDate', maxDays * 24 * 60 * 60 * 1000],
          },
        },
      },
      {
        $match: {
          dueDate: { $lt: comparisonDate }, // Đã quá hạn so với ngày xem
        },
      },
      {
        $lookup: {
          from: 'readers',
          localField: 'readerId',
          foreignField: '_id',
          as: 'reader',
        },
      },
      { $unwind: '$reader' },
      {
        $lookup: {
          from: 'bookcopies',
          localField: 'loanDetail.copyId',
          foreignField: '_id',
          as: 'bookCopy',
        },
      },
      { $unwind: '$bookCopy' },
      {
        $lookup: {
          from: 'books',
          localField: 'bookCopy.bookId',
          foreignField: '_id',
          as: 'book',
        },
      },
      { $unwind: '$book' },
      {
        $lookup: {
          from: 'titlebooks',
          localField: 'book.titleId',
          foreignField: '_id',
          as: 'title',
        },
      },
      { $unwind: '$title' },
      {
        $addFields: {
          overdueDays: {
            $floor: {
              $divide: [
                { $subtract: [comparisonDate, '$dueDate'] },
                1000 * 60 * 60 * 24,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          readerName: '$reader.fullName',
          bookTitle: '$title.title',
          bookCopyId: '$bookCopy._id',
          borrowDate: 1,
          dueDate: 1,
          overdueDays: { $round: ['$overdueDays'] },
        },
      },
      { $sort: { overdueDays: -1 } },
    );

    const overdueLoans = await this.loanModel.aggregate(pipeline);

    return overdueLoans as unknown as Record<string, unknown>[];
  }

  // Dashboard statistics for admin/librarian
  async getDashboardStats() {
    const now = new Date();

    // Get max borrow days
    const param = await this.parameterModel.findOne({
      paramName: 'QD4_MAX_BORROW_DAYS',
    });
    const maxDays = param ? parseInt(param.paramValue) : 4;

    // Count overdue loans using aggregation
    const overdueAggregation = await this.loanModel.aggregate([
      {
        $lookup: {
          from: 'loandetails',
          localField: '_id',
          foreignField: 'loanId',
          as: 'details',
        },
      },
      { $unwind: '$details' },
      { $match: { 'details.returnDate': null } },
      {
        $addFields: {
          dueDate: { $add: ['$borrowDate', maxDays * 24 * 60 * 60 * 1000] },
        },
      },
      { $match: { dueDate: { $lt: now } } },
      { $count: 'count' },
    ]);
    const overdueCount = overdueAggregation[0]?.count || 0;

    const [
      activeReaders,
      expiredReaders,
      totalBooks,
      availableBooks,
      unpaidFinesTotal,
      fineReceiptCount,
    ] = await Promise.all([
      this.readerModel.countDocuments({ expiryDate: { $gte: now } }),
      this.readerModel.countDocuments({ expiryDate: { $lt: now } }),
      this.bookCopyModel.countDocuments(),
      this.bookCopyModel.countDocuments({ status: 1 }),
      this.readerModel.aggregate([
        { $group: { _id: null, total: { $sum: '$totalDebt' } } },
      ]),
      this.fineReceiptModel.countDocuments(),
    ]);

    const unpaidTotal = (unpaidFinesTotal[0]?.total as number) || 0;

    return {
      readers: {
        active: activeReaders,
        expired: expiredReaders,
        total: activeReaders + expiredReaders,
      },
      books: {
        total: totalBooks,
        available: availableBooks,
        borrowed: totalBooks - availableBooks,
      },
      loans: {
        overdue: overdueCount,
      },
      fines: {
        unpaidCount: fineReceiptCount,
        unpaidTotal: unpaidTotal,
      },
    };
  }

  // Reader statistics (number of borrows per reader)
  async getReaderStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<Record<string, unknown>[]> {
    const matchStage: Record<string, unknown> = {};

    if (startDate || endDate) {
      (matchStage as any).borrowDate = {};
      if (startDate) (matchStage as any).borrowDate.$gte = new Date(startDate);
      if (endDate) (matchStage as any).borrowDate.$lte = new Date(endDate);
    }

    const stats = await this.loanModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'loandetails',
          localField: '_id',
          foreignField: 'loanId',
          as: 'details',
        },
      },
      { $unwind: '$details' },
      {
        $lookup: {
          from: 'readers',
          localField: 'readerId',
          foreignField: '_id',
          as: 'reader',
        },
      },
      { $unwind: '$reader' },
      {
        $group: {
          _id: '$readerId',
          readerName: { $first: '$reader.fullName' },
          borrowCount: { $sum: 1 }, // Đếm số sách, không phải số phiếu
        },
      },
      { $sort: { borrowCount: -1 } },
      { $limit: 20 }, // Top 20 readers
    ]);

    return stats as unknown as Record<string, unknown>[];
  }

  // Fine collection statistics
  async getFineStatistics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<Record<string, number>> {
    const matchStage: Record<string, unknown> = { status: 'paid' };

    if (startDate || endDate) {
      (matchStage as any).paymentDate = {};
      if (startDate) (matchStage as any).paymentDate.$gte = new Date(startDate);
      if (endDate) (matchStage as any).paymentDate.$lte = new Date(endDate);
    }

    const stats = await this.fineReceiptModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amountPaid' },
          paymentCount: { $sum: 1 },
          averageAmount: { $avg: '$amountPaid' },
        },
      },
      {
        $project: {
          _id: 0,
          totalAmount: 1,
          paymentCount: 1,
          averageAmount: { $round: ['$averageAmount'] },
        },
      },
    ]);

    return (
      (stats[0] as Record<string, number>) || {
        totalAmount: 0,
        paymentCount: 0,
        averageAmount: 0,
      }
    );
  }

  // Books by category distribution
  async getBooksDistribution(): Promise<Record<string, unknown>[]> {
    const distribution = await this.titleBookModel.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category._id',
          categoryName: { $first: '$category.categoryName' },
          titleCount: { $sum: 1 },
        },
      },
      { $sort: { titleCount: -1 } },
    ]);

    return distribution as unknown as Record<string, unknown>[];
  }

  // Trend statistics (Last N months)
  async getTrendStatistics(months: number = 12) {
    const today = new Date();
    const startDate = new Date(
      today.getFullYear(),
      today.getMonth() - (months - 1),
      1,
    );

    // Get max borrow days
    const param = await this.parameterModel.findOne({
      paramName: 'QD4_MAX_BORROW_DAYS',
    });
    const maxDays = param ? parseInt(param.paramValue) : 4;

    // 1. Loans Trend (đếm từ loandetails để chính xác số lượng sách mượn)
    const loansTrend = await this.loanModel.aggregate([
      {
        $lookup: {
          from: 'loandetails',
          localField: '_id',
          foreignField: 'loanId',
          as: 'details',
        },
      },
      { $unwind: '$details' },
      {
        $match: {
          borrowDate: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$borrowDate' },
            year: { $year: '$borrowDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // 2. Returns Trend
    const returnsTrend = await this.loanModel.aggregate([
      {
        $lookup: {
          from: 'loandetails',
          localField: '_id',
          foreignField: 'loanId',
          as: 'details',
        },
      },
      { $unwind: '$details' },
      {
        $match: {
          'details.returnDate': { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$details.returnDate' },
            year: { $year: '$details.returnDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // 3. Overdue Trend
    const overdueTrend = await this.loanModel.aggregate([
      {
        $lookup: {
          from: 'loandetails',
          localField: '_id',
          foreignField: 'loanId',
          as: 'details',
        },
      },
      { $unwind: '$details' },
      {
        $addFields: {
          dueDate: {
            $add: ['$borrowDate', maxDays * 24 * 60 * 60 * 1000],
          },
        },
      },
      {
        $match: {
          dueDate: { $gte: startDate },
          $or: [
            { 'details.returnDate': null, dueDate: { $lt: today } },
            { $expr: { $gt: ['$details.returnDate', '$dueDate'] } },
          ],
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$dueDate' },
            year: { $year: '$dueDate' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Merge Data
    const result = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(
        today.getFullYear(),
        today.getMonth() - (months - 1) + i,
        1,
      );
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const label = `T${month}`;

      const loanData = loansTrend.find(
        (x) => x._id.month === month && x._id.year === year,
      );
      const returnData = returnsTrend.find(
        (x) => x._id.month === month && x._id.year === year,
      );
      const overdueData = overdueTrend.find(
        (x) => x._id.month === month && x._id.year === year,
      );

      result.push({
        month: label,
        fullDate: `${month}/${year}`,
        loans: loanData ? loanData.count : 0,
        returns: returnData ? returnData.count : 0,
        overdue: overdueData ? overdueData.count : 0,
      });
    }

    return result;
  }

  // Reader Age Distribution: Phân bố độ tuổi độc giả (Histogram)
  async getReaderAgeDistribution(): Promise<any[]> {
    const today = new Date();

    const ageDistribution = await this.readerModel.aggregate([
      {
        $addFields: {
          age: {
            $floor: {
              $divide: [
                { $subtract: [today, '$dateOfBirth'] },
                365.25 * 24 * 60 * 60 * 1000,
              ],
            },
          },
        },
      },
      {
        $bucket: {
          groupBy: '$age',
          boundaries: [0, 18, 25, 35, 100],
          default: 'Khác',
          output: {
            count: { $sum: 1 },
          },
        },
      },
    ]);

    // Format lại kết quả
    const result = ageDistribution.map((item) => {
      let ageGroup = '';
      if (item._id === 0) ageGroup = 'Dưới 18';
      else if (item._id === 18) ageGroup = '18-25';
      else if (item._id === 25) ageGroup = '25-35';
      else if (item._id === 35) ageGroup = 'Trên 35';
      else ageGroup = 'Khác';

      return {
        ageGroup,
        count: item.count,
      };
    });

    return result;
  }

  // Reader Debt Status: Tình trạng nợ (Stacked Bar Chart)
  async getReaderDebtStatus(): Promise<any> {
    const debtCategories = await this.readerModel.aggregate([
      {
        $lookup: {
          from: 'readertypes',
          localField: 'readerTypeId',
          foreignField: '_id',
          as: 'readerType',
        },
      },
      {
        $unwind: {
          path: '$readerType',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $addFields: {
          debtCategory: {
            $switch: {
              branches: [
                { case: { $eq: ['$totalDebt', 0] }, then: 'Không nợ' },
                { case: { $lt: ['$totalDebt', 50000] }, then: 'Dưới 50k' },
                { case: { $lt: ['$totalDebt', 100000] }, then: '50k-100k' },
              ],
              default: 'Trên 100k',
            },
          },
        },
      },
      {
        $group: {
          _id: {
            readerType: '$readerType.readerTypeName',
            debtCategory: '$debtCategory',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.readerType',
          debts: {
            $push: {
              category: '$_id.debtCategory',
              count: '$count',
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format lại dữ liệu cho stacked bar chart
    const debtOrder = ['Không nợ', 'Dưới 50k', '50k-100k', 'Trên 100k'];
    const result = debtCategories.map((item) => {
      const formatted: any = { readerType: item._id };

      // Khởi tạo tất cả categories với 0
      debtOrder.forEach((cat) => (formatted[cat] = 0));

      // Điền dữ liệu thực tế
      item.debts.forEach((debt: any) => {
        formatted[debt.category] = debt.count;
      });

      return formatted;
    });

    return result;
  }
}
