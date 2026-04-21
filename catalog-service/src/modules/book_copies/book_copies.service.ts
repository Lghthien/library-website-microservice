import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateBookCopyDto } from './dto/create-book_copy.dto';
import { UpdateBookCopyDto } from './dto/update-book_copy.dto';
import { BookCopy, BookCopyDocument } from './schema/book-copy.schema';
import {
  TitleBook,
  TitleBookDocument,
} from '../title_books/schema/title-book.schema';

@Injectable()
export class BookCopiesService {
  constructor(
    @InjectModel(BookCopy.name) private bookCopyModel: Model<BookCopyDocument>,
    @InjectModel(TitleBook.name)
    private titleBookModel: Model<TitleBookDocument>,
  ) {}

  async create(createBookCopyDto: CreateBookCopyDto) {
    const createdBookCopy = new this.bookCopyModel({
      bookId: new Types.ObjectId(createBookCopyDto.bookId),
      status: createBookCopyDto.status,
    });
    return await createdBookCopy.save();
  }

  async findAll() {
    const copies = await this.bookCopyModel
      .find()
      .populate({
        path: 'bookId',
        populate: {
          path: 'titleId',
          populate: [
            { path: 'categoryId' },
            {
              path: 'authors',
              populate: { path: 'authorId' },
            },
          ],
        },
        strictPopulate: false,
      })
      .exec();

    // Filter out copies whose titleId is soft-deleted
    return copies.filter((copy) => {
      const titleId = (copy.bookId as any)?.titleId;
      return titleId && !(titleId as any).isDeleted;
    });
  }

  async findOne(id: string) {
    return await this.bookCopyModel
      .findById(id)
      .populate({
        path: 'bookId',
        populate: {
          path: 'titleId',
          populate: [
            { path: 'categoryId' },
            {
              path: 'authors',
              populate: { path: 'authorId' },
            },
          ],
        },
        strictPopulate: false,
      })
      .exec();
  }

  async findByBook(bookId: string) {
    // Convert bookId string to ObjectId
    const copies = await this.bookCopyModel
      .find({ bookId: new Types.ObjectId(bookId) })
      .populate({
        path: 'bookId',
        populate: {
          path: 'titleId',
          populate: [
            { path: 'categoryId' },
            {
              path: 'authors',
              populate: { path: 'authorId' },
            },
          ],
        },
        strictPopulate: false,
      })
      .exec();

    // Filter out copies whose titleId is soft-deleted
    return copies.filter((copy) => {
      const titleId = (copy.bookId as any)?.titleId;
      return titleId && !(titleId as any).isDeleted;
    });
  }

  async findAvailable() {
    const copies = await this.bookCopyModel
      .find({ status: 1 })
      .populate({
        path: 'bookId',
        populate: {
          path: 'titleId',
          populate: { path: 'categoryId' },
        },
      })
      .exec();

    // Filter out copies whose titleId is soft-deleted
    return copies.filter((copy) => {
      const titleId = (copy.bookId as any)?.titleId;
      return titleId && !(titleId as any).isDeleted;
    });
  }

  async update(id: string, updateBookCopyDto: UpdateBookCopyDto) {
    return await this.bookCopyModel
      .findByIdAndUpdate(id, updateBookCopyDto, { new: true })
      .populate({
        path: 'bookId',
        populate: {
          path: 'titleId',
          populate: { path: 'categoryId' },
        },
      })
      .exec();
  }

  async markAsReturned(id: string) {
    return await this.bookCopyModel
      .findByIdAndUpdate(
        id,
        { status: 1 }, // 1 = Available
        { new: true },
      )
      .populate({
        path: 'bookId',
        populate: {
          path: 'titleId',
          populate: { path: 'categoryId' },
        },
      })
      .exec();
  }

  async markAsBorrowed(id: string) {
    return await this.bookCopyModel
      .findByIdAndUpdate(
        id,
        { status: 0 }, // 0 = Borrowed
        { new: true },
      )
      .populate({
        path: 'bookId',
        populate: {
          path: 'titleId',
          populate: { path: 'categoryId' },
        },
      })
      .exec();
  }

  async remove(id: string) {
    return await this.bookCopyModel.findByIdAndDelete(id).exec();
  }
}
