import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateLoansDetailDto } from './dto/create-loans_detail.dto';
import { UpdateLoansDetailDto } from './dto/update-loans_detail.dto';
import { LoanDetail, LoanDetailDocument } from './schema/loan-detail.schema';
import { BookCopiesService } from '../book_copies/book_copies.service';
import { Reader, ReaderDocument } from '../readers/schema/reader.schema';
import {
  Parameter,
  ParameterDocument,
} from '../parameters/schema/parameter.schema';
import { Loan, LoanDocument } from '../loans/schema/loan.schema';

// Helper function to create Date in Vietnam timezone (UTC+7)
function getVietnamDate(dateInput?: string | Date): Date {
  const date = dateInput ? new Date(dateInput) : new Date();
  // Convert to Vietnam timezone
  const vietnamTimeString = date.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
  return new Date(vietnamTimeString);
}

@Injectable()
export class LoansDetailsService {
  constructor(
    @InjectModel(LoanDetail.name)
    private loanDetailModel: Model<LoanDetailDocument>,
    @InjectModel(Reader.name) private readerModel: Model<ReaderDocument>,
    @InjectModel(Loan.name) private loanModel: Model<LoanDocument>, // Thêm LoanModel
    @InjectModel(Parameter.name)
    private parameterModel: Model<ParameterDocument>, // Thêm ParameterModel
    private readonly bookCopiesService: BookCopiesService,
  ) {}

  async create(createLoansDetailDto: CreateLoansDetailDto) {
    // Convert string IDs to ObjectId
    const createdLoanDetail = new this.loanDetailModel({
      loanId: new Types.ObjectId(createLoansDetailDto.loanId),
      copyId: new Types.ObjectId(createLoansDetailDto.copyId),
      returnDate: null, // Mặc định là null khi mới tạo
      fineAmount: 0,
      overdueDays: 0,
    });
    await this.bookCopiesService.markAsBorrowed(createLoansDetailDto.copyId);
    return createdLoanDetail.save();
  }

  async returnBook(id: string) {
    const loanDetail = await this.loanDetailModel.findById(id);
    if (loanDetail) {
      await this.bookCopiesService.markAsReturned(loanDetail.copyId.toString());
      loanDetail.returnDate = getVietnamDate();
      return loanDetail.save();
    }
    return null;
  }

  findAll() {
    return this.loanDetailModel
      .find()
      .populate('loanId')
      .populate({
        path: 'copyId',
        populate: {
          path: 'bookId',
          populate: {
            path: 'titleId',
            select: 'title price categoryId authors', // Explicitly select price
            populate: [
              { path: 'categoryId' },
              {
                path: 'authors',
                populate: { path: 'authorId' },
              },
            ],
          },
        },
        strictPopulate: false,
      })
      .exec();
  }

  findOne(id: string) {
    return this.loanDetailModel
      .findById(id)
      .populate('loanId')
      .populate({
        path: 'copyId',
        populate: {
          path: 'bookId',
          populate: {
            path: 'titleId',
            select: 'title price categoryId authors', // Explicitly select price
            populate: [
              { path: 'categoryId' },
              {
                path: 'authors',
                populate: { path: 'authorId' },
              },
            ],
          },
        },
        strictPopulate: false,
      })
      .exec();
  }

  async update(id: string, updateLoansDetailDto: UpdateLoansDetailDto) {
    // 1. Tìm thông tin chi tiết và "lôi" luôn thông tin Phiếu mượn gốc ra (populate)
    const loanDetail = await this.loanDetailModel
      .findById(id)
      .populate('loanId');
    if (!loanDetail)
      throw new NotFoundException('Không tìm thấy bản ghi mượn sách');

    // 2. Kiểm tra nếu người dùng thực hiện TRẢ SÁCH (có truyền returnDate)
    if (updateLoansDetailDto.returnDate) {
      const loan = loanDetail.loanId as any; // Đây là thông tin từ bảng Loan
      const actualReturnDate = getVietnamDate(updateLoansDetailDto.returnDate);

      // Calculate Due Date based on BorrowDate + Parameter
      // (Originally it tried loan.dueDate which doesn't exist in Schema based on my review)
      const maxDaysParam = await this.parameterModel.findOne({
        paramName: 'QD4_MAX_BORROW_DAYS',
      });
      const maxDays = maxDaysParam ? parseInt(maxDaysParam.paramValue) : 4;

      // Tính ngày hẹn trả - chỉ lấy ngày/tháng/năm, bỏ giờ
      const borrowDate = getVietnamDate(loan.borrowDate);
      const dueDateTemp = new Date(borrowDate);
      dueDateTemp.setDate(dueDateTemp.getDate() + maxDays);
      
      // Tạo Date object chỉ từ year/month/day (không có giờ)
      const dueDate = new Date(
        dueDateTemp.getFullYear(),
        dueDateTemp.getMonth(),
        dueDateTemp.getDate()
      );

      // Tạo ngày trả chỉ từ year/month/day
      const returnDateTemp = getVietnamDate(actualReturnDate);
      const returnDateOnly = new Date(
        returnDateTemp.getFullYear(),
        returnDateTemp.getMonth(),
        returnDateTemp.getDate()
      );

      // 3. Tính số ngày trễ (chỉ dựa trên ngày, không tính giờ)
      const diffTime = returnDateOnly.getTime() - dueDate.getTime();
      const overdueDays = Math.max(
        0,
        Math.floor(diffTime / (1000 * 60 * 60 * 24)),
      );

      // 4. Lấy giá tiền phạt từ bảng tham số (Ví dụ: QD8_FINE_PER_DAY = 5000) - Assuming logic follows QD8 naming or QD_FINE_PER_DAY
      // Seed says QD_FINE_PER_DAY but code used QD8_FINE_PER_DAY. I will check logic or fallback.
      // previous implementation used QD8_FINE_PER_DAY, seed.ts had QD_FINE_PER_DAY in comments but might be inconsistent.
      // I will search for QD_FINE_PER_DAY if QD8 not found, or default 1000.
      let fineParam = await this.parameterModel.findOne({
        paramName: 'QD8_FINE_PER_DAY',
      });
      if (!fineParam) {
        fineParam = await this.parameterModel.findOne({
          paramName: 'QD_FINE_PER_DAY',
        });
      }
      const fineRate = parseInt(fineParam?.paramValue || '1000'); // Default to 1000 per seed default

      // 5. Tự động tính tiền phạt và gán vào DTO
      const totalFine = overdueDays * fineRate;
      updateLoansDetailDto.fineAmount = totalFine;
      (updateLoansDetailDto as any).overdueDays = overdueDays;

      // 6. Cộng dồn nợ vào thẻ Độc giả (Reader)
      if (totalFine > 0) {
        await this.readerModel.findByIdAndUpdate(loan.readerId, {
          $inc: { totalDebt: totalFine },
        });
      }

      // 7. Cập nhật trạng thái sách trong kho là "Sẵn sàng"
      await this.bookCopiesService.markAsReturned(loanDetail.copyId.toString());

      // NOTE: KHÔNG tự động xóa phiếu mượn khi tất cả sách được trả
      // Giữ lại lịch sử phiếu mượn để phục vụ tra cứu và báo cáo
      // Backend sẽ tự động đánh dấu status = 'returned' trong findAll()
    }

    // Cuối cùng mới lưu vào Database (Normal case)
    return this.loanDetailModel
      .findByIdAndUpdate(id, updateLoansDetailDto, { new: true })
      .exec();
  }

  remove(id: string) {
    return this.loanDetailModel.findByIdAndDelete(id).exec();
  }
}
