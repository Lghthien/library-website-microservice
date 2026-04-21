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
    // 1. KiÃƒÂ¡Ã‚Â»Ã†â€™m tra bÃƒÂ¡Ã‚ÂºÃ‚Â¯t buÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢c phÃƒÂ¡Ã‚ÂºÃ‚Â£i cÃƒÆ’Ã‚Â³ publishYear
    if (!createBookDto.publishYear) {
      throw new BadRequestException(
        'NÃƒâ€žÃ†â€™m xuÃƒÂ¡Ã‚ÂºÃ‚Â¥t bÃƒÂ¡Ã‚ÂºÃ‚Â£n lÃƒÆ’Ã‚Â  bÃƒÂ¡Ã‚ÂºÃ‚Â¯t buÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢c Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã†â€™ kiÃƒÂ¡Ã‚Â»Ã†â€™m tra Quy Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹nh 2',
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    // 2. LÃƒÂ¡Ã‚ÂºÃ‚Â¥y tham sÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ (8 nÃƒâ€žÃ†â€™m)
    const maxIntervalParam = await this.parameterModel.findOne({
      paramName: 'QD2_PUBLISH_YEAR_DISTANCE',
    });
    const maxInterval = parseInt(maxIntervalParam?.paramValue || '8');

    // 3. ThÃƒÂ¡Ã‚Â»Ã‚Â±c hiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡n kiÃƒÂ¡Ã‚Â»Ã†â€™m tra QÃƒâ€žÃ‚Â2
    if (currentYear - createBookDto.publishYear > maxInterval) {
      throw new BadRequestException(
        `NÃƒâ€žÃ†â€™m xuÃƒÂ¡Ã‚ÂºÃ‚Â¥t bÃƒÂ¡Ã‚ÂºÃ‚Â£n khÃƒÆ’Ã‚Â´ng Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£c vÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£t quÃƒÆ’Ã‚Â¡ ${maxInterval} nÃƒâ€žÃ†â€™m so vÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi nÃƒâ€žÃ†â€™m hiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡n tÃƒÂ¡Ã‚ÂºÃ‚Â¡i (${currentYear})`,
      );
    }

    // 4. LÃƒâ€ Ã‚Â°u sÃƒÆ’Ã‚Â¡ch (Ãƒâ€žÃ‚ÂÃƒÂ¡Ã‚ÂºÃ‚Â£m bÃƒÂ¡Ã‚ÂºÃ‚Â£o cÃƒÆ’Ã‚Â¡c trÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Âng Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£c gÃƒÆ’Ã‚Â¡n Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Âºng)
    const createdBook = new this.bookModel({
      titleId: new Types.ObjectId(createBookDto.titleId),
      publisher: createBookDto.publisher,
      publishYear: createBookDto.publishYear,
      price: createBookDto.price,
      importDate: createBookDto.importDate || now, // Ãƒâ€ Ã‚Â¯u tiÃƒÆ’Ã‚Âªn ngÃƒÆ’Ã‚Â y gÃƒÂ¡Ã‚Â»Ã‚Â­i lÃƒÆ’Ã‚Âªn hoÃƒÂ¡Ã‚ÂºÃ‚Â·c ngÃƒÆ’Ã‚Â y hiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡n tÃƒÂ¡Ã‚ÂºÃ‚Â¡i
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
    // LÃƒÂ¡Ã‚ÂºÃ‚Â¥y dÃƒÂ¡Ã‚Â»Ã‚Â¯ liÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡u hiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡n tÃƒÂ¡Ã‚ÂºÃ‚Â¡i cÃƒÂ¡Ã‚Â»Ã‚Â§a sÃƒÆ’Ã‚Â¡ch trong DB
    const currentBook = await this.bookModel.findById(id);
    if (!currentBook)
      throw new NotFoundException(
        'KhÃƒÆ’Ã‚Â´ng tÃƒÆ’Ã‚Â¬m thÃƒÂ¡Ã‚ÂºÃ‚Â¥y sÃƒÆ’Ã‚Â¡ch',
      );

    // CHÃƒÂ¡Ã‚Â»Ã‹â€  KIÃƒÂ¡Ã‚Â»Ã¢â‚¬Å¡M TRA QÃƒâ€žÃ‚Â2 NÃƒÂ¡Ã‚ÂºÃ‚Â¾U:
    // NgÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Âi dÃƒÆ’Ã‚Â¹ng gÃƒÂ¡Ã‚Â»Ã‚Â­i lÃƒÆ’Ã‚Âªn publishYear MÃƒÂ¡Ã‚Â»Ã…Â¡I vÃƒÆ’Ã‚Â  nÃƒÆ’Ã‚Â³ KHÃƒÆ’Ã‚ÂC vÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi publishYear cÃƒâ€¦Ã‚Â© trong DB
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
          `NÃƒâ€žÃ†â€™m xuÃƒÂ¡Ã‚ÂºÃ‚Â¥t bÃƒÂ¡Ã‚ÂºÃ‚Â£n mÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi (${updateBookDto.publishYear}) vi phÃƒÂ¡Ã‚ÂºÃ‚Â¡m quy Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹nh ${maxInterval} nÃƒâ€žÃ†â€™m.`,
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
