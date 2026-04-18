import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../app.module';
import { User } from '../modules/users/schema/user.schema';
import { Parameter } from '../modules/parameters/schema/parameter.schema';
import { ReaderType } from '../modules/reader_types/schema/reader-type.schema';
import { Category } from '../modules/categories/schema/category.schema';
import { Author } from '../modules/authors/schema/author.schema';
import { Reader } from '../modules/readers/schema/reader.schema';
import { TitleBook } from '../modules/title_books/schema/title.schema';
import { TitleAuthor } from '../modules/title_authors/schema/title-author.schema';
import { Book } from '../modules/books/schema/book.schema';
import { BookCopy } from '../modules/book_copies/schema/book-copy.schema';
import { Loan } from '../modules/loans/schema/loan.schema';
import { LoanDetail } from '../modules/loans_details/schema/loan-detail.schema';
import { FineReceipt } from '../modules/fine_receipts/schema/fine-receipt.schema';
import { Permission } from '../modules/permissions/schema/permission.schema';
import { RolePermission } from '../modules/role_permissions/schema/role-permission.schema';
import { LoginHistory } from '../modules/login_history/schema/login-history.schema';
import { AuditLog } from '../modules/audit_logs/schema/audit-log.schema';
import { Notification } from '../modules/notifications/schema/notification.schema';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log(
      '\n🌟 ===== LIBRARY MANAGEMENT SYSTEM - ENHANCED SEED DATA (v2) =====',
    );
    console.log('🔗 Connecting to database...');
    console.log(
      'MongoDB URI:',
      process.env.MONGODB_URI || 'mongodb://localhost:27017/library',
    );
    console.log('');

    // Get all models
    const userModel = app.get(getModelToken(User.name));
    const parameterModel = app.get(getModelToken(Parameter.name));
    const readerTypeModel = app.get(getModelToken(ReaderType.name));
    const categoryModel = app.get(getModelToken(Category.name));
    const authorModel = app.get(getModelToken(Author.name));
    const readerModel = app.get(getModelToken(Reader.name));
    const titleBookModel = app.get(getModelToken(TitleBook.name));
    const titleAuthorModel = app.get(getModelToken(TitleAuthor.name));
    const bookModel = app.get(getModelToken(Book.name));
    const bookCopyModel = app.get(getModelToken(BookCopy.name));
    const loanModel = app.get(getModelToken(Loan.name));
    const loanDetailModel = app.get(getModelToken(LoanDetail.name));
    const fineReceiptModel = app.get(getModelToken(FineReceipt.name));
    const permissionModel = app.get(getModelToken(Permission.name));
    const rolePermissionModel = app.get(getModelToken(RolePermission.name));
    const loginHistoryModel = app.get(getModelToken(LoginHistory.name));
    const auditLogModel = app.get(getModelToken(AuditLog.name));
    const notificationModel = app.get(getModelToken(Notification.name));

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      userModel.deleteMany({}),
      parameterModel.deleteMany({}),
      readerTypeModel.deleteMany({}),
      categoryModel.deleteMany({}),
      authorModel.deleteMany({}),
      readerModel.deleteMany({}),
      titleBookModel.deleteMany({}),
      titleAuthorModel.deleteMany({}),
      bookModel.deleteMany({}),
      bookCopyModel.deleteMany({}),
      loanModel.deleteMany({}),
      loanDetailModel.deleteMany({}),
      fineReceiptModel.deleteMany({}),
      permissionModel.deleteMany({}),
      rolePermissionModel.deleteMany({}),
      loginHistoryModel.deleteMany({}),
      auditLogModel.deleteMany({}),
      notificationModel.deleteMany({}),
    ]);
    console.log('✅ Database cleared\n');

    // 1. Seed Users
    console.log('👥 Seeding users...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const users = await userModel.insertMany([
      {
        fullName: 'Nguyễn Văn Admin',
        email: 'admin@library.com',
        password: hashedPassword,
        phoneNumber: '0123456789',
        role: 'ADMIN',
        status: 'active',
        isVerified: true,
        createdByAdmin: false,
      },
      {
        fullName: 'Trần Thị Librarian',
        email: 'librarian@library.com',
        password: hashedPassword,
        phoneNumber: '0987654321',
        role: 'LIBRARIAN',
        status: 'active',
        isVerified: true,
        createdByAdmin: true,
      },
      {
        fullName: 'Lê Văn Thủ Thư',
        email: 'librarian2@library.com',
        password: hashedPassword,
        phoneNumber: '0912345678',
        role: 'LIBRARIAN',
        status: 'active',
        isVerified: true,
        createdByAdmin: true,
      },
    ]);
    console.log(`✅ Created ${users.length} users`);

    // 2. Seed Parameters (QĐ1-QĐ8)
    console.log('⚙️  Seeding parameters (QĐ1-QĐ8)...');
    const parameters = await parameterModel.insertMany([
      {
        paramName: 'QD1_MIN_AGE',
        paramValue: '18',
        description: 'Tuổi tối thiểu để lập thẻ độc giả (QĐ1)',
        dataType: 'number',
      },
      {
        paramName: 'QD1_MAX_AGE',
        paramValue: '55',
        description: 'Tuổi tối đa để lập thẻ độc giả (QĐ1)',
        dataType: 'number',
      },

      {
        paramName: 'QD2_PUBLISH_YEAR_DISTANCE', // Renamed for clarity
        paramValue: '8',
        description: 'Khoảng cách năm xuất bản tối đa (năm) - QĐ2',
        dataType: 'number',
      },
      {
        paramName: 'QD4_MAX_BORROW_QUANTITY', // Renamed from QD8_MAX_BOOKS_PER_LOAN
        paramValue: '5',
        description: 'Số lượng sách mượn tối đa - QĐ4',
        dataType: 'number',
      },
      {
        paramName: 'QD4_MAX_BORROW_DAYS', // Renamed from QD8 prefix
        paramValue: '4',
        description: 'Số ngày mượn tối đa - QĐ4',
        dataType: 'number',
      },
      {
        paramName: 'QD_FINE_PER_DAY', // Keep generic or move to QD4? Usually fine rules are separate but let's keep generic for now
        paramValue: '1000',
        description: 'Tiền phạt quá hạn mỗi ngày (VND)',
        dataType: 'number',
      },
      {
        paramName: 'QD_FINE_LOST_BOOK',
        paramValue: '50000',
        description: 'Tiền phạt làm mất sách (VND)',
        dataType: 'number',
      },
    ]);

    console.log(`✅ Created ${parameters.length} parameters`);

    // 3. Seed Reader Types
    console.log('📋 Seeding reader types (Loại X, Y)...');
    const readerTypes = await readerTypeModel.insertMany([
      { readerTypeName: 'Loại X', maxBorrowLimit: 5, cardValidityMonths: 6 },
      { readerTypeName: 'Loại Y', maxBorrowLimit: 5, cardValidityMonths: 9 },
    ]);
    console.log(`✅ Created ${readerTypes.length} reader types`);

    // 4. Seed Categories (A, B, C theo đề)
    console.log('📚 Seeding categories (A, B, C)...');
    const categories = await categoryModel.insertMany([
      { categoryName: 'Thể loại A' },
      { categoryName: 'Thể loại B' },
      { categoryName: 'Thể loại C' },
    ]);
    console.log(`✅ Created ${categories.length} categories`);

    // 5. Seed Authors (100 tác giả theo đề)
    console.log('✍️  Seeding authors (100 authors)...');
    const authorNames = [
      'Nguyễn Nhật Ánh',
      'Nam Cao',
      'Tô Hoài',
      'Ngô Tất Tố',
      'Vũ Trọng Phụng',
      'Hồ Thanh Phong',
      'Trần Đức Thảo',
      'Phạm Văn Đồng',
      'Lê Duẩn',
      'Võ Nguyên Giáp',
      'J.K. Rowling',
      'George Orwell',
      'Haruki Murakami',
      'Paulo Coelho',
      'Dan Brown',
      'Stephen King',
      'Agatha Christie',
      'Isaac Asimov',
      'Arthur C. Clarke',
      'Yuval Noah Harari',
      'Malcolm Gladwell',
      'Dale Carnegie',
      'Robert Kiyosaki',
      'Napoleon Hill',
      'Tony Robbins',
      'Simon Sinek',
      'Adam Grant',
      'Daniel Kahneman',
      'Nassim Taleb',
      'Ray Dalio',
      'Elon Musk',
      'Steve Jobs',
      'Bill Gates',
      'Mark Zuckerberg',
      'Jeff Bezos',
      'Warren Buffett',
      'Charlie Munger',
      'Peter Thiel',
      'Reid Hoffman',
      'Eric Schmidt',
      'Sheryl Sandberg',
      'Marissa Mayer',
      'Susan Wojcicki',
      'Ginni Rometty',
      'Satya Nadella',
      'Tim Cook',
      'Larry Page',
      'Sergey Brin',
      'Jack Ma',
      'Pony Ma',
      'Robin Li',
      'Lei Jun',
      'Zhang Yiming',
      'Colin Huang',
      'Wang Xing',
      'Masayoshi Son',
      'Hiroshi Mikitani',
      'Tadashi Yanai',
      'Akio Toyoda',
      'Kenichiro Yoshida',
      'Lee Kun-hee',
      'Jay Y. Lee',
      'Chung Mong-koo',
      'Shin Dong-bin',
      'Kim Beom-su',
      'Brian Chesky',
      'Travis Kalanick',
      'Garrett Camp',
      'Logan Green',
      'John Zimmer',
      'Drew Houston',
      'Arash Ferdowsi',
      'Stewart Butterfield',
      'Cal Henderson',
      'Daniel Ek',
      'Martin Lorentzon',
      'Reed Hastings',
      'Marc Randolph',
      'Patrick Collison',
      'John Collison',
      'Ben Silbermann',
      'Evan Sharp',
      'Bobby Murphy',
      'Evan Spiegel',
      'Kevin Systrom',
      'Mike Krieger',
      'Jan Koum',
      'Brian Acton',
      'Pavel Durov',
      'Nikolai Durov',
      'Jack Dorsey',
      'Biz Stone',
      'Evan Williams',
      'Noah Glass',
      'Dick Costolo',
      'Parag Agrawal',
      'Sundar Pichai',
      'Ruth Porat',
      'Diane Greene',
      'Thomas Kurian',
    ];
    const authors = await authorModel.insertMany(
      authorNames.map((name) => ({ authorName: name })),
    );
    console.log(`✅ Created ${authors.length} authors`);

    // 6. Seed Readers (30 độc giả)
    console.log('👤 Seeding readers (30 readers)...');
    const now = new Date();
    const readerData = [];
    const firstNames = [
      'Nguyễn',
      'Trần',
      'Lê',
      'Phạm',
      'Hoàng',
      'Vũ',
      'Đỗ',
      'Bùi',
      'Đinh',
      'Cao',
    ];
    const middleNames = [
      'Văn',
      'Thị',
      'Minh',
      'Hồng',
      'Thu',
      'Anh',
      'Đức',
      'Quốc',
      'Thanh',
      'Hải',
    ];
    const lastNames = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
      'An',
      'Bình',
      'Cường',
      'Dũng',
      'Em',
    ];

    for (let i = 0; i < 30; i++) {
      const firstName = firstNames[i % firstNames.length];
      const middleName =
        middleNames[Math.floor(i / firstNames.length) % middleNames.length];
      const lastName = lastNames[i];
      const age = 18 + Math.floor(Math.random() * 37); // 18-55
      const birthYear = now.getFullYear() - age;
      const readerType = readerTypes[i % 2]; // Xen kẽ X và Y

      // Một số độc giả có nợ, một số thẻ hết hạn
      const hasDebt = i % 7 === 0; // ~14% có nợ
      // Readers 10-19 will have active loans, so they should NOT have expired cards
      const hasActiveLoan = i >= 10 && i < 20;
      const isExpired = (i % 10 === 0) && !hasActiveLoan; // ~10% hết hạn, nhưng không bao gồm những người có phiếu mượn đang mở

      readerData.push({
        fullName: `${firstName} ${middleName} ${lastName}`,
        dateOfBirth: new Date(
          birthYear,
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28) + 1,
        ),
        address: `${Math.floor(Math.random() * 999) + 1} Đường ${['Nguyễn Huệ', 'Lê Lợi', 'Trần Hưng Đạo', 'Võ Văn Tần', 'Điện Biên Phủ'][i % 5]}, Q${(i % 10) + 1}, TP.HCM`,
        email: `reader${i + 1}@email.com`,
        phoneNumber: `09${Math.floor(Math.random() * 90000000) + 10000000}`, // Generate 09xxxxxxxx
        createdDate: isExpired
          ? new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000)
          : now,
        expiryDate: isExpired
          ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Hết hạn 30 ngày trước
          : new Date(
              now.getTime() +
                readerType.cardValidityMonths * 30 * 24 * 60 * 60 * 1000,
            ),
        totalDebt: hasDebt ? Math.floor(Math.random() * 50000) + 5000 : 0,
        readerTypeId: readerType._id,
      });
    }
    const readers = await readerModel.insertMany(readerData);
    console.log(`✅ Created ${readers.length} readers`);

    // 7. Seed Title Books (50 đầu sách)
    console.log('📖 Seeding title books (50 titles)...');
    const titleBooksData = [
      {
        title: 'Mắt Biếc',
        categoryId: categories[0]._id,
        publisher: 'NXB Trẻ',
        publishYear: 2020,
        isbn: '978-604-1-00001-1',
        lostCopies: 0,
        price: Math.floor(Math.random() * 150001) + 50000, // Random price 50k - 200k
      },
      {
        title: 'Chí Phèo',
        categoryId: categories[0]._id,
        publisher: 'NXB Văn Học',
        publishYear: 2019,
        isbn: '978-604-1-00002-8',
        lostCopies: 0,
        price: Math.floor(Math.random() * 150001) + 50000, // Random price 50k - 200k
      },
      {
        title: 'Dế Mèn Phiêu Lưu Ký',
        categoryId: categories[0]._id,
        publisher: 'NXB Kim Đồng',
        publishYear: 2021,
        isbn: '978-604-1-00003-5',
      },
      {
        title: 'Lập Trình Cơ Bản',
        categoryId: categories[1]._id,
        publisher: 'NXB ĐHQG',
        publishYear: 2022,
        isbn: '978-604-1-00004-2',
      },
      {
        title: 'Thuật Toán',
        categoryId: categories[1]._id,
        publisher: 'NXB Khoa Học',
        publishYear: 2023,
        isbn: '978-604-1-00005-9',
      },
      {
        title: 'Cơ Sở Dữ Liệu',
        categoryId: categories[1]._id,
        publisher: 'NXB Thống Kê',
        publishYear: 2022,
        isbn: '978-604-1-00006-6',
      },
      {
        title: 'Mạng Máy Tính',
        categoryId: categories[1]._id,
        publisher: 'NXB Bách Khoa',
        publishYear: 2021,
        isbn: '978-604-1-00007-3',
      },
      {
        title: 'Trí Tuệ Nhân Tạo',
        categoryId: categories[1]._id,
        publisher: 'NXB Khoa Học',
        publishYear: 2023,
        isbn: '978-604-1-00008-0',
      },
      {
        title: 'Lịch Sử Việt Nam',
        categoryId: categories[2]._id,
        publisher: 'NXB Giáo Dục',
        publishYear: 2020,
        isbn: '978-604-1-00009-7',
      },
      {
        title: 'Địa Lý Thế Giới',
        categoryId: categories[2]._id,
        publisher: 'NXB Giáo Dục',
        publishYear: 2021,
        isbn: '978-604-1-00010-3',
      },
    ];

    // Thêm 40 sách nữa
    for (let i = 10; i < 50; i++) {
      titleBooksData.push({
        title: `Sách Mẫu ${i + 1}`,
        categoryId: categories[i % 3]._id,
        publisher: ['NXB Trẻ', 'NXB Văn Học', 'NXB Khoa Học', 'NXB Giáo Dục'][
          i % 4
        ],
        publishYear: 2018 + (i % 6),
        isbn: `978-604-1-${String(i + 1).padStart(5, '0')}-${Math.floor(Math.random() * 10)}`,
        lostCopies: 0,
        price: Math.floor(Math.random() * 150001) + 50000,
      });
    }

    const titleBooks = await titleBookModel.insertMany(titleBooksData);
    console.log(`✅ Created ${titleBooks.length} title books`);

    // 8. Seed Title Authors (Liên kết sách-tác giả)
    console.log('🔗 Seeding title-author relationships...');
    const titleAuthorsData = [];
    for (let i = 0; i < titleBooks.length; i++) {
      // Mỗi sách có 1-3 tác giả
      const numAuthors = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numAuthors; j++) {
        const authorIndex = (i * 3 + j) % authors.length;
        titleAuthorsData.push({
          titleId: titleBooks[i]._id,
          authorId: authors[authorIndex]._id,
        });
      }
    }
    const titleAuthors = await titleAuthorModel.insertMany(titleAuthorsData);
    console.log(`✅ Created ${titleAuthors.length} title-author relationships`);

    // 9. Seed Books (Ấn bản - mỗi title có 1-2 ấn bản)
    console.log('📕 Seeding books (editions)...');
    const booksData = [];
    for (let i = 0; i < titleBooks.length; i++) {
      const numEditions = Math.random() > 0.7 ? 2 : 1; // 30% có 2 ấn bản
      for (let j = 0; j < numEditions; j++) {
        const currentYear = new Date().getFullYear();
        const publishYear = currentYear - Math.floor(Math.random() * 7); // Trong vòng 7 năm (QĐ2: 8 năm)

        booksData.push({
          publisher: titleBooks[i].publisher,
          publishYear: publishYear,
          importDate: new Date(
            publishYear,
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1,
          ),
          price: Math.floor(Math.random() * 500000) + 50000, // 50k-550k
          titleId: titleBooks[i]._id,
        });
      }
    }
    const books = await bookModel.insertMany(booksData);
    console.log(`✅ Created ${books.length} books`);

    // 10. Seed Book Copies
    console.log('📚 Seeding book copies (100+ copies)...');
    const bookCopiesData = [];
    let copyCounter = 1;

    for (let i = 0; i < books.length; i++) {
      const numCopies = Math.floor(Math.random() * 3) + 2; // 2-4 bản sao mỗi ấn bản
      for (let j = 0; j < numCopies; j++) {
        bookCopiesData.push({
          status: 1, // Mặc định available, sẽ update khi tạo loan
          bookId: books[i]._id,
        });
        copyCounter++;
      }
    }
    const bookCopies = await bookCopyModel.insertMany(bookCopiesData);
    console.log(`✅ Created ${bookCopies.length} book copies`);

    // 11. Seed Loans (50 phiếu mượn)
    console.log('📋 Seeding loans (50 loans)...');
    const loansData = [];
    const today = new Date();

    for (let i = 0; i < 50; i++) {
        // 0-29: Returned (Active=False)
        // 30-39: Active, Not Overdue (Mượn 1-3 ngày trước)
        // 40-49: Active, Overdue (Mượn 10-20 ngày trước)

        let daysAgo = 0;
        
        if (i < 30) {
             // Returned: Random 5-60 days ago
             daysAgo = 5 + Math.floor(Math.random() * 55);
        } else if (i < 40) {
            // Active, Not Overdue: 0-3 days ago (Max borrow is 4 days)
            daysAgo = Math.floor(Math.random() * 3);
        } else {
             // Active, Overdue: 10-20 days ago
             daysAgo = 10 + Math.floor(Math.random() * 10);
        }

      const borrowDate = new Date(
        today.getTime() - daysAgo * 24 * 60 * 60 * 1000,
      );

      loansData.push({
        borrowDate: borrowDate,
        readerId: readers[(i % (readers.length - 1)) + 1]._id,
      });
    }
    const loans = await loanModel.insertMany(loansData);
    console.log(`✅ Created ${loans.length} loans`);

    // 12. Seed Loan Details (Chi tiết mượn sách)
    console.log('📝 Seeding loan details (with overdue scenarios)...');
    const loanDetailsData = [];
    let copyIndex = 0;

    for (let i = 0; i < loans.length; i++) {
      const numBooks = Math.floor(Math.random() * 3) + 1; // 1-3 sách mỗi phiếu
      const borrowDate = loans[i].borrowDate;
      const maxBorrowDays = 4; // QĐ4: 4 ngày
      const expectedReturnDate = new Date(
        borrowDate.getTime() + maxBorrowDays * 24 * 60 * 60 * 1000,
      );

      for (let j = 0; j < numBooks && copyIndex < bookCopies.length; j++) {
        const copy = bookCopies[copyIndex];

        let returnDate = null;
        let overdueDays = 0;
        let fineAmount = 0;

        // Logic mới:
        // 0-29: Đã trả (Returned)
        // 30-49: Chưa trả (Active) -> Trong đó 40-49 là quá hạn (Overdue)
        const isReturned = i < 30;

        if (isReturned) {
          // Đã trả: 50% đúng hạn, 50% trễ
          const isLate = j % 2 === 0;
          if (isLate) {
            const lateDays = Math.floor(Math.random() * 10) + 1;
            returnDate = new Date(
              expectedReturnDate.getTime() + lateDays * 24 * 60 * 60 * 1000,
            );
            overdueDays = lateDays;
            fineAmount = lateDays * 1000;
          } else {
             returnDate = new Date(
              expectedReturnDate.getTime() -
                Math.floor(Math.random() * 2) * 24 * 60 * 60 * 1000,
            );
             overdueDays = 0;
             fineAmount = 0;
          }
           await bookCopyModel.updateOne({ _id: copy._id }, { status: 1 });
        } else {
          // Chưa trả (Active Loans)
          returnDate = null;

          // Check thực tế dựa trên borrowDate đã tạo ở bước 11
          if (today > expectedReturnDate) {
             overdueDays = Math.floor(
              (today.getTime() - expectedReturnDate.getTime()) /
                (24 * 60 * 60 * 1000),
            );
             fineAmount = overdueDays * 1000;
          }

          // Update copy status to borrowed
          await bookCopyModel.updateOne({ _id: copy._id }, { status: 0 });
        }

        loanDetailsData.push({
          loanId: loans[i]._id,
          copyId: copy._id,
          returnDate: returnDate,
          overdueDays: overdueDays,
          fineAmount: fineAmount,
        });

        copyIndex++;
      }
    }
    const loanDetails = await loanDetailModel.insertMany(loanDetailsData);
    console.log(`✅ Created ${loanDetails.length} loan details`);

    // Update reader totalDebt based on unpaid fines
    console.log('💰 Updating reader debts...');
    for (const reader of readers) {
      const readerLoans = loans.filter(
        (l) => l.readerId.toString() === reader._id.toString(),
      );
      const loanIds = readerLoans.map((l) => l._id);

      const unpaidFines = loanDetails.filter(
        (ld) =>
          loanIds.some((id) => id.toString() === ld.loanId.toString()) &&
          ld.returnDate === null &&
          ld.fineAmount > 0,
      );

      const totalDebt = unpaidFines.reduce((sum, ld) => sum + ld.fineAmount, 0);

      if (totalDebt > 0) {
        await readerModel.updateOne({ _id: reader._id }, { totalDebt });
      }
    }
    console.log('✅ Reader debts updated');

    // 13. Seed Fine Receipts
    console.log('💵 Seeding fine receipts (10 receipts)...');
    const fineReceiptsData = [];
    const readersWithDebt = readers.filter((r) => r.totalDebt > 0);

    for (let i = 0; i < Math.min(10, readersWithDebt.length); i++) {
      const reader = readersWithDebt[i];
      const amountPaid = Math.floor(
        reader.totalDebt * (0.5 + Math.random() * 0.5),
      ); // Trả 50-100%

      fineReceiptsData.push({
        paymentDate: new Date(
          today.getTime() -
            Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
        ),
        amountPaid: amountPaid,
        status: 'paid',
        notes: `Thu tiền phạt trả sách trễ`,
        readerId: reader._id,
      });
    }
    const fineReceipts = await fineReceiptModel.insertMany(fineReceiptsData);
    console.log(`✅ Created ${fineReceipts.length} fine receipts`);

    // 14. Seed Permissions
    console.log('🔐 Seeding permissions (Q001-Q018)...');
    const permissions = await permissionModel.insertMany([
      {
        permissionId: 'Q001',
        permissionName: 'Lập thẻ độc giả',
        description: 'BM1 - Quyền tạo thẻ độc giả mới',
        functionGroup: 'READER',
      },
      {
        permissionId: 'Q002',
        permissionName: 'Sửa thông tin độc giả',
        description: 'Quyền chỉnh sửa thông tin độc giả',
        functionGroup: 'READER',
      },
      {
        permissionId: 'Q003',
        permissionName: 'Xóa độc giả',
        description: 'Quyền xóa độc giả',
        functionGroup: 'READER',
      },
      {
        permissionId: 'Q004',
        permissionName: 'Tra cứu độc giả',
        description: 'Quyền tra cứu thông tin độc giả',
        functionGroup: 'READER',
      },
      {
        permissionId: 'Q005',
        permissionName: 'Tiếp nhận sách',
        description: 'BM2 - Quyền tiếp nhận sách mới',
        functionGroup: 'BOOK',
      },
      {
        permissionId: 'Q006',
        permissionName: 'Sửa thông tin sách',
        description: 'Quyền chỉnh sửa thông tin sách',
        functionGroup: 'BOOK',
      },
      {
        permissionId: 'Q007',
        permissionName: 'Xóa sách',
        description: 'Quyền xóa sách',
        functionGroup: 'BOOK',
      },
      {
        permissionId: 'Q008',
        permissionName: 'Tra cứu sách',
        description: 'BM3 - Quyền tra cứu sách',
        functionGroup: 'BOOK',
      },
      {
        permissionId: 'Q009',
        permissionName: 'Cho mượn sách',
        description: 'BM4 - Quyền lập phiếu mượn',
        functionGroup: 'TRANSACTION',
      },
      {
        permissionId: 'Q010',
        permissionName: 'Nhận trả sách',
        description: 'BM5 - Quyền nhận trả sách',
        functionGroup: 'TRANSACTION',
      },
      {
        permissionId: 'Q011',
        permissionName: 'Thu tiền phạt',
        description: 'BM6 - Quyền lập phiếu thu tiền',
        functionGroup: 'TRANSACTION',
      },
      {
        permissionId: 'Q012',
        permissionName: 'Xem báo cáo',
        description: 'BM7 - Quyền xem các báo cáo',
        functionGroup: 'REPORT',
      },
      {
        permissionId: 'Q013',
        permissionName: 'Xuất báo cáo',
        description: 'Quyền xuất báo cáo ra file',
        functionGroup: 'REPORT',
      },
      {
        permissionId: 'Q014',
        permissionName: 'Quản lý người dùng',
        description: 'Quyền quản lý tài khoản',
        functionGroup: 'SYSTEM',
      },
      {
        permissionId: 'Q015',
        permissionName: 'Thay đổi quy định',
        description: 'QĐ8 - Quyền thay đổi tham số hệ thống',
        functionGroup: 'SYSTEM',
      },
      {
        permissionId: 'Q016',
        permissionName: 'Quản lý thể loại',
        description: 'Quyền quản lý thể loại sách',
        functionGroup: 'SYSTEM',
      },
      {
        permissionId: 'Q017',
        permissionName: 'Quản lý tác giả',
        description: 'Quyền quản lý danh sách tác giả',
        functionGroup: 'SYSTEM',
      },
      {
        permissionId: 'Q018',
        permissionName: 'Xem nhật ký hệ thống',
        description: 'Quyền xem audit log',
        functionGroup: 'SYSTEM',
      },
    ]);
    console.log(`✅ Created ${permissions.length} permissions`);

    // 15. Seed Role Permissions
    console.log('🔑 Seeding role permissions...');
    const adminRolePermissions = permissions.map((p) => ({
      role: 'ADMIN',
      permissionId: p.permissionId,
    }));

    const librarianRolePermissions = permissions
      .filter(
        (p) =>
          !['Q014', 'Q015', 'Q016', 'Q017', 'Q018'].includes(p.permissionId),
      )
      .map((p) => ({
        role: 'LIBRARIAN',
        permissionId: p.permissionId,
      }));

    const rolePermissions = await rolePermissionModel.insertMany([
      ...adminRolePermissions,
      ...librarianRolePermissions,
    ]);
    console.log(
      `✅ Created ${rolePermissions.length} role-permission relationships`,
    );

    // 16. Seed Login History
    console.log('📊 Seeding login history...');
    const loginHistoryData = [];
    for (let i = 0; i < 20; i++) {
      const user = users[i % users.length];
      const daysAgo = Math.floor(Math.random() * 30);

      loginHistoryData.push({
        userId: user._id,
        email: user.email,
        loginTime: new Date(
          today.getTime() -
            daysAgo * 24 * 60 * 60 * 1000 -
            Math.floor(Math.random() * 24) * 60 * 60 * 1000,
        ),
        logoutTime:
          i % 5 === 0
            ? null
            : new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000),
        ipAddress: `192.168.1.${100 + (i % 50)}`,
        status: i % 10 === 0 ? 'FAILED' : 'SUCCESS',
        failureReason: i % 10 === 0 ? 'Invalid password' : null,
      });
    }
    const loginHistory = await loginHistoryModel.insertMany(loginHistoryData);
    console.log(`✅ Created ${loginHistory.length} login history records`);

    // 17. Seed Audit Logs
    console.log('📜 Seeding audit logs...');
    const auditLogsData = [
      {
        userId: users[0]._id,
        action: 'INSERT',
        tableName: 'users',
        recordId: users[1]._id.toString(),
        timestamp: new Date('2024-11-01T10:00:00'),
        description: 'Created librarian account',
      },
      {
        userId: users[1]._id,
        action: 'INSERT',
        tableName: 'readers',
        recordId: readers[0]._id.toString(),
        timestamp: new Date('2024-11-05T14:30:00'),
        description: 'BM1: Lập thẻ độc giả mới',
      },
      {
        userId: users[1]._id,
        action: 'INSERT',
        tableName: 'books',
        recordId: books[0]._id.toString(),
        timestamp: new Date('2024-11-08T09:00:00'),
        description: 'BM2: Tiếp nhận sách mới',
      },
      {
        userId: users[1]._id,
        action: 'INSERT',
        tableName: 'loans',
        recordId: loans[0]._id.toString(),
        timestamp: new Date('2024-11-10T11:00:00'),
        description: 'BM4: Lập phiếu mượn sách',
      },
      {
        userId: users[1]._id,
        action: 'UPDATE',
        tableName: 'loan_details',
        recordId: loanDetails[0]._id.toString(),
        timestamp: new Date('2024-11-14T15:00:00'),
        description: 'BM5: Nhận trả sách',
      },
      {
        userId: users[1]._id,
        action: 'INSERT',
        tableName: 'fine_receipts',
        recordId: fineReceipts[0]._id.toString(),
        timestamp: new Date('2024-11-25T13:00:00'),
        description: 'BM6: Thu tiền phạt',
      },
      {
        userId: users[0]._id,
        action: 'UPDATE',
        tableName: 'parameters',
        recordId: parameters[0]._id.toString(),
        timestamp: new Date('2024-12-01T16:00:00'),
        description: 'QĐ8: Thay đổi quy định',
      },
    ];
    const auditLogs = await auditLogModel.insertMany(auditLogsData);
    console.log(`✅ Created ${auditLogs.length} audit logs`);

    // 18. Seed Notifications
    console.log('🔔 Seeding notifications...');
    const notificationsData = [];

    // Thông báo quá hạn
    const overdueReaders = readers.slice(10, 15);
    for (const reader of overdueReaders) {
      notificationsData.push({
        readerId: reader._id,
        notificationType: 'QUA_HAN',
        title: 'Sách quá hạn',
        content:
          'Bạn có sách quá hạn cần trả. Vui lòng trả sách để tránh bị phạt thêm.',
        isRead: false,
        createdAt: new Date(
          today.getTime() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000,
        ),
      });
    }

    // Thông báo nợ tiền
    for (const reader of readersWithDebt.slice(0, 5)) {
      notificationsData.push({
        readerId: reader._id,
        notificationType: 'CO_NO',
        title: 'Thông báo nợ phí',
        content: `Bạn còn nợ ${reader.totalDebt.toLocaleString('vi-VN')} VND tiền phạt. Vui lòng thanh toán.`,
        isRead: Math.random() > 0.5,
        createdAt: new Date(
          today.getTime() -
            Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000,
        ),
      });
    }

    // Thông báo thẻ sắp hết hạn
    const expiringSoon = readers
      .filter((r) => {
        const daysUntilExpiry = Math.floor(
          (r.expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
        );
        return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
      })
      .slice(0, 5);

    for (const reader of expiringSoon) {
      const daysLeft = Math.floor(
        (reader.expiryDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
      );
      notificationsData.push({
        readerId: reader._id,
        notificationType: 'SAP_HET_HAN_THE',
        title: 'Thẻ sắp hết hạn',
        content: `Thẻ độc giả của bạn sẽ hết hạn sau ${daysLeft} ngày. Vui lòng gia hạn.`,
        isRead: false,
        createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      });
    }

    const notifications = await notificationModel.insertMany(notificationsData);
    console.log(`✅ Created ${notifications.length} notifications`);

    // Summary
    console.log('\n🎉 ===== DATABASE SEEDING COMPLETED SUCCESSFULLY! =====\n');
    console.log('📊 SUMMARY:');
    console.log('─'.repeat(60));
    console.log(`👥 Users:                ${users.length}`);
    console.log(`🔐 Permissions:          ${permissions.length}`);
    console.log(`🔑 Role Permissions:     ${rolePermissions.length}`);
    console.log(`⚙️  Parameters:           ${parameters.length}`);
    console.log(`📋 Reader Types:         ${readerTypes.length}`);
    console.log(`📚 Categories:           ${categories.length}`);
    console.log(`✍️  Authors:              ${authors.length}`);
    console.log(`👤 Readers:              ${readers.length}`);
    console.log(`📖 Title Books:          ${titleBooks.length}`);
    console.log(`🔗 Title Authors:        ${titleAuthors.length}`);
    console.log(`📕 Books (Editions):     ${books.length}`);
    console.log(`📚 Book Copies:          ${bookCopies.length}`);
    console.log(`📋 Loans:                ${loans.length}`);
    console.log(`📝 Loan Details:         ${loanDetails.length}`);
    console.log(`💵 Fine Receipts:        ${fineReceipts.length}`);
    console.log(`📊 Login History:        ${loginHistory.length}`);
    console.log(`📜 Audit Logs:           ${auditLogs.length}`);
    console.log(`🔔 Notifications:        ${notifications.length}`);
    console.log('─'.repeat(60));
    console.log('\n💡 TEST ACCOUNTS:');
    console.log('   Admin:     admin@library.com / admin123');
    console.log('   Librarian: librarian@library.com / admin123');
    console.log('\n📌 KEY FEATURES:');
    console.log('   ✅ BM1: Lập thẻ độc giả (30 readers)');
    console.log('   ✅ BM2: Tiếp nhận sách (50 titles, 100+ copies)');
    console.log('   ✅ BM3: Tra cứu sách');
    console.log('   ✅ BM4: Cho mượn sách (20 loans)');
    console.log('   ✅ BM5: Nhận trả sách (with overdue scenarios)');
    console.log('   ✅ BM6: Thu tiền phạt (10 receipts)');
    console.log('   ✅ BM7: Báo cáo thống kê');
    console.log('   ✅ QĐ1-QĐ8: All regulations configured');
    console.log('\n🎯 READY FOR TESTING!\n');
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();
