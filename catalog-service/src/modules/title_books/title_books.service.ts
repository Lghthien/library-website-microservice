import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateTitleBookDto } from './dto/create-title_book.dto';
import { UpdateTitleBookDto } from './dto/update-title_book.dto';
import { TitleBook, TitleBookDocument } from './schema/title-book.schema';
import { Author, AuthorDocument } from '../authors/schema/author.schema';
import { Category, CategoryDocument } from '../categories/schema/category.schema';
import { TitleAuthor, TitleAuthorDocument } from '../title_authors/schema/title-author.schema';
import { Book, BookDocument } from '../books/schema/book.schema';
import { BookCopy, BookCopyDocument } from '../book_copies/schema/book-copy.schema';
import { BulkCreateBookDto } from './dto/bulk-create-book.dto';

@Injectable()
export class TitleBooksService {
  constructor(
    @InjectModel(TitleBook.name)
    private titleBookModel: Model<TitleBookDocument>,
    @InjectModel(Author.name)
    private authorModel: Model<AuthorDocument>,
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
    @InjectModel(TitleAuthor.name)
    private titleAuthorModel: Model<TitleAuthorDocument>,
    @InjectModel(Book.name)
    private bookModel: Model<BookDocument>,
    @InjectModel(BookCopy.name)
    private bookCopyModel: Model<BookCopyDocument>,
  ) {}

  create(createTitleBookDto: CreateTitleBookDto) {
    const createdTitleBook = new this.titleBookModel({
      title: createTitleBookDto.title,
      categoryId: new Types.ObjectId(createTitleBookDto.categoryId),
    });
    return createdTitleBook.save();
  }

  async bulkCreate(bulkData: BulkCreateBookDto[]) {
    const results = [];
    for (const item of bulkData) {
      // 1. Find or Create Category
      let category = await this.categoryModel.findOne({ categoryName: item.category });
      if (!category) {
        category = await this.categoryModel.create({ categoryName: item.category });
      }

      // 2. Find or Create TitleBook
      let titleBook = await this.titleBookModel.findOne({ title: item.title, isDeleted: { $ne: true } });
      if (!titleBook) {
        titleBook = await this.titleBookModel.create({
          title: item.title,
          categoryId: category._id,
          price: item.price || 0, // Assuming price handles nicely on TitleBook or needs to be propagated
          publisher: item.publisher,
          publishYear: item.publishYear,
        });
      }

      // 3. Find or Create Author and Link
      let author = await this.authorModel.findOne({ authorName: item.author });
      if (!author) {
        author = await this.authorModel.create({ authorName: item.author });
      }

      // Check link
      const existingLink = await this.titleAuthorModel.findOne({
        titleId: titleBook._id,
        authorId: author._id,
      });
      if (!existingLink) {
        await this.titleAuthorModel.create({
          titleId: titleBook._id,
          authorId: author._id,
        });
      }

      // 4. Check if book with exact same details already exists (duplicate detection)
      // Chỉ kiểm tra: titleId (bao gồm tên, tác giả, thể loại), publishYear, publisher
      // KHÔNG kiểm tra: price, importDate, quantity
      const existingBook = await this.bookModel.findOne({
        titleId: titleBook._id,
        publishYear: item.publishYear || new Date().getFullYear(),
        publisher: item.publisher || 'Unknown',
      });

      if (existingBook) {
        // Book already exists - return error status
        results.push({
          title: item.title,
          status: 'error',
          message: 'Sách này đã tồn tại với cùng thông tin (tên, tác giả, thể loại, năm xuất bản, nhà xuất bản). Vui lòng sử dụng chức năng "Nhập thêm bản sao" để tăng số lượng.'
        });
        continue; // Skip to next item
      }

      // 5. Create Book (Edition/Import Batch)
      const book = await this.bookModel.create({
        titleId: titleBook._id,
        publishYear: item.publishYear || new Date().getFullYear(),
        publisher: item.publisher || 'Unknown',
        importDate: new Date(),
        price: item.price || 0,
      });

      // 6. Create Copies
      const copies = [];
      for (let i = 0; i < item.quantity; i++) {
        copies.push({
          bookId: book._id,
          status: 1, // Available
        });
      }
      if (copies.length > 0) {
        await this.bookCopyModel.insertMany(copies);
      }
      
      // Update counts (Optional optimization: do this in bulk or aggregate later)
      // For now simple increment
      await this.titleBookModel.findByIdAndUpdate(titleBook._id, {
        $inc: {
           totalCopies: item.quantity,
           availableCopies: item.quantity
        }
      });

      results.push({ title: item.title, status: 'success' });
    }
    return results;
  }

  findAll() {
    return this.titleBookModel.find({ isDeleted: { $ne: true } }).populate('categoryId').exec();
  }

  findOne(id: string) {
    return this.titleBookModel.findOne({ _id: id, isDeleted: { $ne: true } }).populate('categoryId').exec();
  }

  update(id: string, updateTitleBookDto: UpdateTitleBookDto) {
    return this.titleBookModel
      .findByIdAndUpdate(id, updateTitleBookDto, { new: true })
      .populate('categoryId')
      .exec();
  }
  async checkDeleteConditions(titleId: string) {
    // Lấy tất cả books của title này
    const books = await this.bookModel.find({ titleId: new Types.ObjectId(titleId) }).exec();
    const bookIds = books.map(b => b._id);

    // Lấy tất cả copies của các books này
    const copies = await this.bookCopyModel.find({ bookId: { $in: bookIds } }).exec();

    // Kiểm tra số sách đang mượn (status = 0)
    const borrowedCount = copies.filter(c => c.status === 0).length;

    return {
      canDelete: borrowedCount === 0,
      borrowedCount
    };
  }
  async remove(id: string) {
    const titleBook = await this.titleBookModel.findById(id).exec();
    if (!titleBook) {
      return null;
    }
    
    // Soft delete: mark as deleted instead of removing from database
    titleBook.isDeleted = true;
    titleBook.deletedAt = new Date();
    await titleBook.save();
    
    return titleBook;
  }
}
