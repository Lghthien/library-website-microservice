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
import { TitleBook, TitleBookDocument } from '../title_books/schema/title-book.schema';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
    @InjectModel(Parameter.name)
    private parameterModel: Model<ParameterDocument>,
    @InjectModel(TitleBook.name) private titleBookModel: Model<TitleBookDocument>,
  ) {}

  async create(createBookDto: CreateBookDto) {
    // 1. KiÃ¡Â»Æ’m tra bÃ¡ÂºÂ¯t buÃ¡Â»â„¢c phÃ¡ÂºÂ£i cÃƒÂ³ publishYear
    if (!createBookDto.publishYear) {
      throw new BadRequestException(
        'NÃ„Æ’m xuÃ¡ÂºÂ¥t bÃ¡ÂºÂ£n lÃƒÂ  bÃ¡ÂºÂ¯t buÃ¡Â»â„¢c Ã„â€˜Ã¡Â»Æ’ kiÃ¡Â»Æ’m tra Quy Ã„â€˜Ã¡Â»â€¹nh 2',
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    // 2. LÃ¡ÂºÂ¥y tham sÃ¡Â»â€˜ (8 nÃ„Æ’m)
    const maxIntervalParam = await this.parameterModel.findOne({
      paramName: 'QD2_PUBLISH_YEAR_DISTANCE',
    });
    const maxInterval = parseInt(maxIntervalParam?.paramValue || '8');

    // 3. ThÃ¡Â»Â±c hiÃ¡Â»â€¡n kiÃ¡Â»Æ’m tra QÃ„Â2
    if (currentYear - createBookDto.publishYear > maxInterval) {
      throw new BadRequestException(
        `NÃ„Æ’m xuÃ¡ÂºÂ¥t bÃ¡ÂºÂ£n khÃƒÂ´ng Ã„â€˜Ã†Â°Ã¡Â»Â£c vÃ†Â°Ã¡Â»Â£t quÃƒÂ¡ ${maxInterval} nÃ„Æ’m so vÃ¡Â»â€ºi nÃ„Æ’m hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i (${currentYear})`,
      );
    }

    // 4. LÃ†Â°u sÃƒÂ¡ch (Ã„ÂÃ¡ÂºÂ£m bÃ¡ÂºÂ£o cÃƒÂ¡c trÃ†Â°Ã¡Â»Âng Ã„â€˜Ã†Â°Ã¡Â»Â£c gÃƒÂ¡n Ã„â€˜ÃƒÂºng)
    const createdBook = new this.bookModel({
      titleId: new Types.ObjectId(createBookDto.titleId),
      publisher: createBookDto.publisher,
      publishYear: createBookDto.publishYear,
      price: createBookDto.price,
      importDate: createBookDto.importDate || now, // Ã†Â¯u tiÃƒÂªn ngÃƒÂ y gÃ¡Â»Â­i lÃƒÂªn hoÃ¡ÂºÂ·c ngÃƒÂ y hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i
    });

    const savedBook = await createdBook.save();
    return savedBook.populate('titleId');
  }

  async findAll() {
    const books = await this.bookModel.find().populate('titleId').exec();
    // Filter out books whose titleId is deleted
    return books.filter(book => {
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
    // LÃ¡ÂºÂ¥y dÃ¡Â»Â¯ liÃ¡Â»â€¡u hiÃ¡Â»â€¡n tÃ¡ÂºÂ¡i cÃ¡Â»Â§a sÃƒÂ¡ch trong DB
    const currentBook = await this.bookModel.findById(id);
    if (!currentBook) throw new NotFoundException('KhÃƒÂ´ng tÃƒÂ¬m thÃ¡ÂºÂ¥y sÃƒÂ¡ch');

    // CHÃ¡Â»Ë† KIÃ¡Â»â€šM TRA QÃ„Â2 NÃ¡ÂºÂ¾U:
    // NgÃ†Â°Ã¡Â»Âi dÃƒÂ¹ng gÃ¡Â»Â­i lÃƒÂªn publishYear MÃ¡Â»Å¡I vÃƒÂ  nÃƒÂ³ KHÃƒÂC vÃ¡Â»â€ºi publishYear cÃ…Â© trong DB
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
          `NÃ„Æ’m xuÃ¡ÂºÂ¥t bÃ¡ÂºÂ£n mÃ¡Â»â€ºi (${updateBookDto.publishYear}) vi phÃ¡ÂºÂ¡m quy Ã„â€˜Ã¡Â»â€¹nh ${maxInterval} nÃ„Æ’m.`,
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
