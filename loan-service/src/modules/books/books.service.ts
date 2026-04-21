import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book, BookDocument } from './schema/book.schema';
import {
  Parameter,
  ParameterDocument,
} from '../parameters/schema/parameter.schema';
import {
  TitleBook,
  TitleBookDocument,
} from '../title_books/schema/title-book.schema';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Parameter.name)
    private parameterModel: Model<ParameterDocument>,
    @InjectModel(TitleBook.name)
    private titleBookModel: Model<TitleBookDocument>,
  ) {}

  async create(createBookDto: CreateBookDto) {
    // 1. Kiểm tra bắt buộc phải có publishYear
    if (!createBookDto.publishYear) {
      throw new BadRequestException(
        'Năm xuất bản là bắt buộc để kiểm tra Quy định 2',
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    // 2. Lấy tham số (8 năm)
    const maxIntervalParam = await this.parameterModel.findOne({
      paramName: 'QD2_PUBLISH_YEAR_DISTANCE',
    });
    const maxInterval = parseInt(maxIntervalParam?.paramValue || '8');

    // 3. Thực hiện kiểm tra QĐ2
    if (currentYear - createBookDto.publishYear > maxInterval) {
      throw new BadRequestException(
        `Năm xuất bản không được vượt quá ${maxInterval} năm so với năm hiện tại (${currentYear})`,
      );
    }

    // 4. Lưu sách (Đảm bảo các trường được gán đúng)
    const createdBook = new this.bookModel({
      titleId: new Types.ObjectId(createBookDto.titleId),
      publisher: createBookDto.publisher,
      publishYear: createBookDto.publishYear,
      price: createBookDto.price,
      importDate: createBookDto.importDate || now, // Ưu tiên ngày gửi lên hoặc ngày hiện tại
    });

    const savedBook = await createdBook.save();
    return savedBook.populate('titleId');
  }

  async findAll() {
    const books = await this.bookModel.find().populate('titleId').exec();
    // Filter out books whose titleId is deleted
    return books.filter((book) => {
      if (book.titleId && typeof book.titleId === 'object') {
        return !(book.titleId as any).isDeleted;
      }
      return true;
    });
  }

  async findOne(id: string) {
    return this.bookModel.findById(id).populate('titleId').exec();
  }

  async search(
    keyword?: string,
    categoryId?: string,
    authorId?: string,
    publishYear?: number,
  ) {
    const query: any = {};

    if (keyword) {
      query.titleId = new RegExp(keyword, 'i');
    }
    if (categoryId) {
      query.categoryId = categoryId;
    }
    if (publishYear) {
      query.publishYear = publishYear;
    }

    return this.bookModel.find(query).populate('titleId').exec();
  }

  async findByTitle(titleId: string) {
    // Convert titleId string to ObjectId
    return this.bookModel
      .find({ titleId: new Types.ObjectId(titleId) })
      .populate('titleId')
      .exec();
  }

  async advancedSearch(filters: {
    keyword?: string;
    categoryId?: string;
    authorId?: string;
    minYear?: number;
    maxYear?: number;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const query: any = {};

    if (filters.keyword) {
      query.$or = [
        { 'titleId.titleName': { $regex: filters.keyword, $options: 'i' } },
        { publisher: { $regex: filters.keyword, $options: 'i' } },
      ];
    }

    if (filters.categoryId) {
      query['titleId.categoryId'] = filters.categoryId;
    }

    if (filters.minYear !== undefined || filters.maxYear !== undefined) {
      query.publishYear = {};
      if (filters.minYear !== undefined)
        query.publishYear.$gte = filters.minYear;
      if (filters.maxYear !== undefined)
        query.publishYear.$lte = filters.maxYear;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) query.price.$gte = filters.minPrice;
      if (filters.maxPrice !== undefined) query.price.$lte = filters.maxPrice;
    }

    return this.bookModel
      .find(query)
      .populate({
        path: 'titleId',
        populate: ['categoryId', 'authorId'],
      })
      .exec();
  }

  async findByAvailability(isAvailable: boolean) {
    // This would require checking book copies, so we'll use aggregation
    const status = isAvailable ? 'available' : 'borrowed';
    return this.bookModel.aggregate([
      {
        $lookup: {
          from: 'bookcopy',
          localField: '_id',
          foreignField: 'bookId',
          as: 'copies',
        },
      },
      {
        $addFields: {
          hasAvailable: {
            $anyElementTrue: {
              $map: {
                input: '$copies',
                as: 'copy',
                in: { $eq: ['$$copy.status', 'available'] },
              },
            },
          },
        },
      },
      {
        $match: { hasAvailable: isAvailable },
      },
      {
        $lookup: {
          from: 'titlebook',
          localField: 'titleId',
          foreignField: '_id',
          as: 'titleId',
        },
      },
      { $unwind: '$titleId' },
      { $project: { copies: 0 } },
    ]);
  }

  async findRecentlyAdded(limit: number = 10) {
    return this.bookModel
      .find()
      .populate('titleId')
      .sort({ importDate: -1 })
      .limit(limit)
      .exec();
  }

  async update(id: string, updateBookDto: UpdateBookDto) {
    // Lấy dữ liệu hiện tại của sách trong DB
    const currentBook = await this.bookModel.findById(id);
    if (!currentBook) throw new NotFoundException('Không tìm thấy sách');

    // CHỈ KIỂM TRA QĐ2 NẾU:
    // Người dùng gửi lên publishYear MỚI và nó KHÁC với publishYear cũ trong DB
    if (
      updateBookDto.publishYear &&
      updateBookDto.publishYear !== currentBook.publishYear
    ) {
      const maxIntervalParam = await this.parameterModel.findOne({
        paramName: 'QD2_PUBLISH_YEAR_DISTANCE',
      });
      const maxInterval = parseInt(maxIntervalParam?.paramValue || '8');
      const currentYear = new Date().getFullYear();

      if (currentYear - updateBookDto.publishYear > maxInterval) {
        throw new BadRequestException(
          `Năm xuất bản mới (${updateBookDto.publishYear}) vi phạm quy định ${maxInterval} năm.`,
        );
      }
    }

    return this.bookModel
      .findByIdAndUpdate(id, updateBookDto, { new: true })
      .populate('titleId');
  }

  async remove(id: string) {
    return this.bookModel.findByIdAndDelete(id).exec();
  }
}
