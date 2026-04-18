-- ====================================================
-- LIBRARY MANAGEMENT SYSTEM - DATABASE SCRIPT (MySQL)
-- Database: library_management
-- ====================================================
-- Create Database
DROP DATABASE IF EXISTS library_management;
CREATE DATABASE library_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE library_management;
-- ====================================================
-- 1. USERS TABLE (Nhân viên)
-- ====================================================
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    fullName VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phoneNumber VARCHAR(20),
    role ENUM('ADMIN', 'LIBRARIAN') NOT NULL DEFAULT 'LIBRARIAN',
    status ENUM('active', 'locked', 'pending') NOT NULL DEFAULT 'locked',
    isVerified BOOLEAN DEFAULT FALSE,
    verificationToken VARCHAR(500),
    verificationTokenExpires DATETIME,
    createdByAdmin BOOLEAN DEFAULT FALSE,
    lastLogin DATETIME,
    otp VARCHAR(6),
    otpExpires DATETIME,
    avatar VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_code (code),
    INDEX idx_role (role),
    INDEX idx_status (status)
);
-- ====================================================
-- 2. PARAMETERS TABLE (Tham số hệ thống)
-- ====================================================
CREATE TABLE parameters (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    paramName VARCHAR(100) NOT NULL UNIQUE,
    paramValue TEXT NOT NULL,
    description TEXT,
    dataType VARCHAR(50),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_paramName (paramName)
);
-- ====================================================
-- 3. READER TYPES TABLE (Loại độc giả)
-- ====================================================
CREATE TABLE reader_types (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    readerTypeName VARCHAR(100) NOT NULL,
    maxBorrowLimit INT DEFAULT 5,
    cardValidityMonths INT DEFAULT 6,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_readerTypeName (readerTypeName)
);
-- ====================================================
-- 4. READERS TABLE (Độc giả)
-- ====================================================
CREATE TABLE readers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    fullName VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    dateOfBirth DATE NOT NULL,
    address TEXT,
    email VARCHAR(255),
    createdDate DATE NOT NULL,
    expiryDate DATE NOT NULL,
    totalDebt DECIMAL(12, 2) DEFAULT 0,
    readerTypeId BIGINT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (readerTypeId) REFERENCES reader_types(id),
    INDEX idx_code (code),
    INDEX idx_email (email),
    INDEX idx_readerTypeId (readerTypeId),
    INDEX idx_expiryDate (expiryDate)
);
-- ====================================================
-- 5. CATEGORIES TABLE (Thể loại sách)
-- ====================================================
CREATE TABLE categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    categoryName VARCHAR(200) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categoryName (categoryName)
);
-- ====================================================
-- 6. AUTHORS TABLE (Tác giả)
-- ====================================================
CREATE TABLE authors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    authorName VARCHAR(255) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_authorName (authorName)
);
-- ====================================================
-- 7. TITLE BOOKS TABLE (Đầu sách)
-- ====================================================
CREATE TABLE title_books (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    titleName VARCHAR(500) NOT NULL,
    categoryId BIGINT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoryId) REFERENCES categories(id),
    INDEX idx_titleName (titleName),
    INDEX idx_categoryId (categoryId)
);
-- ====================================================
-- 8. TITLE AUTHORS TABLE (Mối quan hệ giữa đầu sách và tác giả)
-- ====================================================
CREATE TABLE title_authors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    titleId BIGINT NOT NULL,
    authorId BIGINT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (titleId) REFERENCES title_books(id),
    FOREIGN KEY (authorId) REFERENCES authors(id),
    UNIQUE KEY unique_title_author (titleId, authorId),
    INDEX idx_titleId (titleId),
    INDEX idx_authorId (authorId)
);
-- ====================================================
-- 9. BOOKS TABLE (Sách - bản để xuất bản)
-- ====================================================
CREATE TABLE books (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    publisher VARCHAR(255),
    publishYear INT,
    importDate DATE NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    titleId BIGINT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (titleId) REFERENCES title_books(id),
    INDEX idx_titleId (titleId),
    INDEX idx_publishYear (publishYear),
    INDEX idx_importDate (importDate)
);
-- ====================================================
-- 10. BOOK COPIES TABLE (Bản sao sách)
-- ====================================================
CREATE TABLE book_copies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    status INT DEFAULT 1,
    -- 0 = Borrowed, 1 = Available
    code VARCHAR(100) UNIQUE,
    bookId BIGINT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bookId) REFERENCES books(id),
    INDEX idx_bookId (bookId),
    INDEX idx_status (status),
    INDEX idx_code (code)
);
-- ====================================================
-- 11. LOANS TABLE (Phiếu mượn)
-- ====================================================
CREATE TABLE loans (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    borrowDate DATE NOT NULL,
    code VARCHAR(50) UNIQUE,
    readerId BIGINT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (readerId) REFERENCES readers(id),
    INDEX idx_readerId (readerId),
    INDEX idx_borrowDate (borrowDate),
    INDEX idx_code (code)
);
-- ====================================================
-- 12. LOAN DETAILS TABLE (Chi tiết phiếu mượn)
-- ====================================================
CREATE TABLE loan_details (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    loanId BIGINT NOT NULL,
    copyId BIGINT NOT NULL,
    returnDate DATE,
    fineAmount DECIMAL(12, 2) DEFAULT 0,
    overdueDays INT DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (loanId) REFERENCES loans(id),
    FOREIGN KEY (copyId) REFERENCES book_copies(id),
    UNIQUE KEY unique_loan_copy (loanId, copyId),
    INDEX idx_loanId (loanId),
    INDEX idx_copyId (copyId),
    INDEX idx_returnDate (returnDate)
);
-- ====================================================
-- 13. FINE RECEIPTS TABLE (Phiếu thu tiền phạt)
-- ====================================================
CREATE TABLE fine_receipts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    paymentDate DATE NOT NULL,
    amountPaid DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'paid',
    notes TEXT,
    readerId BIGINT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (readerId) REFERENCES readers(id),
    INDEX idx_readerId (readerId),
    INDEX idx_paymentDate (paymentDate),
    INDEX idx_code (code),
    INDEX idx_status (status)
);
-- ====================================================
-- 14. PERMISSIONS TABLE (Quyền hạn)
-- ====================================================
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    permissionId VARCHAR(50) NOT NULL UNIQUE,
    permissionName VARCHAR(255) NOT NULL,
    description TEXT,
    functionGroup ENUM(
        'READER',
        'BOOK',
        'TRANSACTION',
        'REPORT',
        'SYSTEM'
    ) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_permissionId (permissionId),
    INDEX idx_functionGroup (functionGroup)
);
-- ====================================================
-- 15. ROLE PERMISSIONS TABLE (Gán quyền cho vai trò)
-- ====================================================
CREATE TABLE role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role VARCHAR(50) NOT NULL,
    permissionId VARCHAR(50) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_role_permission (role, permissionId),
    INDEX idx_role (role),
    INDEX idx_permissionId (permissionId)
);
-- ====================================================
-- 16. LOGIN HISTORY TABLE (Lịch sử đăng nhập)
-- ====================================================
CREATE TABLE login_histories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    userId BIGINT,
    email VARCHAR(255),
    loginTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    logoutTime DATETIME,
    ipAddress VARCHAR(45),
    status ENUM('SUCCESS', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
    failureReason VARCHAR(255),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    INDEX idx_userId (userId),
    INDEX idx_email (email),
    INDEX idx_loginTime (loginTime),
    INDEX idx_status (status)
);
-- ====================================================
-- 17. AUDIT LOGS TABLE (Nhật ký kiểm toán)
-- ====================================================
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    userId BIGINT,
    action VARCHAR(255) NOT NULL,
    entityType VARCHAR(100),
    entityId BIGINT,
    oldValue LONGTEXT,
    newValue LONGTEXT,
    ipAddress VARCHAR(45),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_userId (userId),
    INDEX idx_entityType (entityType),
    INDEX idx_createdAt (createdAt)
);
-- ====================================================
-- 18. NOTIFICATIONS TABLE (Thông báo)
-- ====================================================
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    userId BIGINT,
    readerId BIGINT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    isRead BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (readerId) REFERENCES readers(id),
    INDEX idx_userId (userId),
    INDEX idx_readerId (readerId),
    INDEX idx_isRead (isRead),
    INDEX idx_createdAt (createdAt)
);
-- ====================================================
-- 19. MAIL LOGS TABLE (Nhật ký gửi email)
-- ====================================================
CREATE TABLE mail_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body LONGTEXT,
    status VARCHAR(50),
    sentAt DATETIME,
    errorMessage TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_recipient (recipient),
    INDEX idx_status (status),
    INDEX idx_sentAt (sentAt)
);
-- ====================================================
-- SEED DATA
-- ====================================================
-- Insert Reader Types
INSERT INTO reader_types (
        readerTypeName,
        maxBorrowLimit,
        cardValidityMonths
    )
VALUES ('Sinh viên', 5, 12),
    ('Giảng viên', 10, 24),
    ('Nhân viên', 5, 12),
    ('Khách vãng lai', 2, 1);
-- Insert Categories
INSERT INTO categories (categoryName)
VALUES ('Công nghệ thông tin'),
    ('Khoa học tự nhiên'),
    ('Lịch sử - Địa lý'),
    ('Văn học'),
    ('Kinh tế - Quản lý'),
    ('Sức khỏe'),
    ('Nghệ thuật');
-- Insert Authors
INSERT INTO authors (authorName)
VALUES ('Nguyễn Du'),
    ('Bạch Vân'),
    ('Hạ Long'),
    ('Trần Văn Thạch'),
    ('Tôn Thất Tập'),
    ('Trần Minh Tiến'),
    ('Steve Jobs'),
    ('Bill Gates');
-- Insert Permissions (READER - Quản lý độc giả)
INSERT INTO permissions (
        permissionId,
        permissionName,
        description,
        functionGroup
    )
VALUES (
        'Q001',
        'Lập thẻ độc giả',
        'Tạo mới thẻ độc giả',
        'READER'
    ),
    (
        'Q002',
        'Sửa thông tin độc giả',
        'Chỉnh sửa thông tin độc giả',
        'READER'
    ),
    (
        'Q003',
        'Xóa độc giả',
        'Xóa thông tin độc giả',
        'READER'
    ),
    (
        'Q004',
        'Xem danh sách độc giả',
        'Xem danh sách tất cả độc giả',
        'READER'
    ),
    (
        'Q005',
        'Gia hạn thẻ',
        'Gia hạn hạn thẻ độc giả',
        'READER'
    ),
    (
        'Q006',
        'Tính toán tiền phạt',
        'Tính toán tiền phạt quá hạn',
        'READER'
    );
-- Insert Permissions (BOOK - Quản lý sách)
INSERT INTO permissions (
        permissionId,
        permissionName,
        description,
        functionGroup
    )
VALUES (
        'Q007',
        'Nhập sách',
        'Nhập sách mới vào kho',
        'BOOK'
    ),
    (
        'Q008',
        'Sửa thông tin sách',
        'Chỉnh sửa thông tin sách',
        'BOOK'
    ),
    (
        'Q009',
        'Xóa sách',
        'Xóa sách khỏi hệ thống',
        'BOOK'
    ),
    (
        'Q010',
        'Xem danh sách sách',
        'Xem danh sách tất cả sách',
        'BOOK'
    );
-- Insert Permissions (TRANSACTION - Giao dịch mượn trả)
INSERT INTO permissions (
        permissionId,
        permissionName,
        description,
        functionGroup
    )
VALUES (
        'Q011',
        'Lập phiếu mượn',
        'Tạo phiếu mượn sách',
        'TRANSACTION'
    ),
    (
        'Q012',
        'Trả sách',
        'Xác nhận trả sách',
        'TRANSACTION'
    ),
    (
        'Q013',
        'Xem phiếu mượn',
        'Xem danh sách phiếu mượn',
        'TRANSACTION'
    );
-- Insert Permissions (REPORT - Báo cáo)
INSERT INTO permissions (
        permissionId,
        permissionName,
        description,
        functionGroup
    )
VALUES (
        'Q014',
        'Xem báo cáo',
        'Xem báo cáo thống kê',
        'REPORT'
    ),
    (
        'Q015',
        'Xuất báo cáo',
        'Xuất báo cáo ra file',
        'REPORT'
    );
-- Insert Permissions (SYSTEM - Hệ thống)
INSERT INTO permissions (
        permissionId,
        permissionName,
        description,
        functionGroup
    )
VALUES (
        'Q016',
        'Quản lý người dùng',
        'Quản lý tài khoản người dùng',
        'SYSTEM'
    ),
    (
        'Q017',
        'Quản lý quyền hạn',
        'Quản lý quyền hạn trong hệ thống',
        'SYSTEM'
    ),
    (
        'Q018',
        'Xem nhật ký',
        'Xem nhật ký hoạt động',
        'SYSTEM'
    ),
    (
        'Q019',
        'Cấu hình hệ thống',
        'Cấu hình các tham số hệ thống',
        'SYSTEM'
    );
-- Insert Role Permissions for ADMIN
INSERT INTO role_permissions (role, permissionId)
VALUES ('ADMIN', 'Q001'),
    ('ADMIN', 'Q002'),
    ('ADMIN', 'Q003'),
    ('ADMIN', 'Q004'),
    ('ADMIN', 'Q005'),
    ('ADMIN', 'Q006'),
    ('ADMIN', 'Q007'),
    ('ADMIN', 'Q008'),
    ('ADMIN', 'Q009'),
    ('ADMIN', 'Q010'),
    ('ADMIN', 'Q011'),
    ('ADMIN', 'Q012'),
    ('ADMIN', 'Q013'),
    ('ADMIN', 'Q014'),
    ('ADMIN', 'Q015'),
    ('ADMIN', 'Q016'),
    ('ADMIN', 'Q017'),
    ('ADMIN', 'Q018'),
    ('ADMIN', 'Q019');
-- Insert Role Permissions for LIBRARIAN
INSERT INTO role_permissions (role, permissionId)
VALUES ('LIBRARIAN', 'Q001'),
    ('LIBRARIAN', 'Q002'),
    ('LIBRARIAN', 'Q004'),
    ('LIBRARIAN', 'Q005'),
    ('LIBRARIAN', 'Q006'),
    ('LIBRARIAN', 'Q007'),
    ('LIBRARIAN', 'Q008'),
    ('LIBRARIAN', 'Q010'),
    ('LIBRARIAN', 'Q011'),
    ('LIBRARIAN', 'Q012'),
    ('LIBRARIAN', 'Q013'),
    ('LIBRARIAN', 'Q014');
-- Insert System Parameters
INSERT INTO parameters (paramName, paramValue, description, dataType)
VALUES (
        'QD1_MIN_AGE',
        '15',
        'Tuổi tối thiểu đăng ký độc giả',
        'number'
    ),
    (
        'QD1_MAX_AGE',
        '70',
        'Tuổi tối đa đăng ký độc giả',
        'number'
    ),
    (
        'QD8_CARD_VALIDITY_MONTHS',
        '12',
        'Thời hạn thẻ độc giả (tháng)',
        'number'
    ),
    (
        'QD8_CATEGORY_LIMIT',
        '3',
        'Số lượng thể loại tối đa',
        'number'
    ),
    (
        'QD8_PUBLICATION_YEAR_GAP',
        '50',
        'Khoảng cách năm xuất bản',
        'number'
    ),
    (
        'QD8_MAX_BOOKS_PER_LOAN',
        '5',
        'Số sách mượn tối đa mỗi lần',
        'number'
    ),
    (
        'QD8_MAX_BORROW_DAYS',
        '30',
        'Số ngày mượn tối đa',
        'number'
    ),
    (
        'QD8_FINE_PER_DAY',
        '5000',
        'Tiền phạt mỗi ngày quá hạn (VND)',
        'number'
    );
-- ====================================================
-- SAMPLE DATA (Optional - For testing)
-- ====================================================
-- Insert Title Books (Đầu sách)
INSERT INTO title_books (titleName, categoryId)
VALUES (
        'Truyện Kiều',
        (
            SELECT id
            FROM categories
            WHERE categoryName = 'Văn học'
        )
    ),
    (
        'Lập trình web với Node.js',
        (
            SELECT id
            FROM categories
            WHERE categoryName = 'Công nghệ thông tin'
        )
    ),
    (
        'Quản lý dự án phần mềm',
        (
            SELECT id
            FROM categories
            WHERE categoryName = 'Công nghệ thông tin'
        )
    ),
    (
        'Lịch sử Việt Nam',
        (
            SELECT id
            FROM categories
            WHERE categoryName = 'Lịch sử - Địa lý'
        )
    ),
    (
        'Các nguyên lý kinh tế',
        (
            SELECT id
            FROM categories
            WHERE categoryName = 'Kinh tế - Quản lý'
        )
    );
-- Insert Title Authors (Liên kết đầu sách và tác giả)
INSERT INTO title_authors (titleId, authorId)
VALUES (1, 1),
    (2, 6),
    (3, 5),
    (4, 2),
    (5, 3);
-- Insert Books (Sách)
INSERT INTO books (
        publisher,
        publishYear,
        importDate,
        price,
        titleId
    )
VALUES (
        'Nhà xuất bản Văn học',
        2020,
        '2023-01-15',
        85000,
        1
    ),
    (
        'Nhà xuất bản Thông tin',
        2021,
        '2023-02-20',
        120000,
        2
    ),
    (
        'Nhà xuất bản Công nghệ',
        2022,
        '2023-03-10',
        150000,
        3
    ),
    (
        'Nhà xuất bản Giáo dục',
        2019,
        '2023-01-05',
        95000,
        4
    ),
    (
        'Nhà xuất bản Kinh tế',
        2020,
        '2023-04-12',
        110000,
        5
    );
-- Insert Book Copies (Bản sao sách)
INSERT INTO book_copies (code, status, bookId)
VALUES ('BC001001', 1, 1),
    ('BC001002', 1, 1),
    ('BC001003', 1, 1),
    ('BC002001', 1, 2),
    ('BC002002', 0, 2),
    ('BC003001', 1, 3),
    ('BC003002', 1, 3),
    ('BC004001', 1, 4),
    ('BC005001', 1, 5),
    ('BC005002', 1, 5);
-- ====================================================
-- VIEWS (Tùy chọn - Để tạo các view hữu ích)
-- ====================================================
-- View: Danh sách độc giả với loại độc giả
CREATE VIEW reader_details AS
SELECT r.id,
    r.code,
    r.fullName,
    r.email,
    rt.readerTypeName,
    r.expiryDate,
    r.totalDebt,
    r.createdDate
FROM readers r
    JOIN reader_types rt ON r.readerTypeId = rt.id;
-- View: Danh sách sách với thông tin đầy đủ
CREATE VIEW book_details AS
SELECT b.id,
    tb.titleName,
    c.categoryName,
    b.publisher,
    b.publishYear,
    b.price,
    b.importDate,
    COUNT(DISTINCT bc.id) as totalCopies,
    SUM(
        CASE
            WHEN bc.status = 1 THEN 1
            ELSE 0
        END
    ) as availableCopies
FROM books b
    JOIN title_books tb ON b.titleId = tb.id
    JOIN categories c ON tb.categoryId = c.id
    LEFT JOIN book_copies bc ON b.id = bc.bookId
GROUP BY b.id,
    tb.titleName,
    c.categoryName,
    b.publisher,
    b.publishYear,
    b.price,
    b.importDate;
-- View: Danh sách sách đang mượn
CREATE VIEW borrowed_books AS
SELECT ld.id,
    r.code as readerCode,
    r.fullName as readerName,
    tb.titleName as bookTitle,
    l.borrowDate,
    ld.returnDate,
    DATEDIFF(CURDATE(), ld.returnDate) as overdueDays
FROM loan_details ld
    JOIN loans l ON ld.loanId = l.id
    JOIN readers r ON l.readerId = r.id
    JOIN book_copies bc ON ld.copyId = bc.id
    JOIN books b ON bc.bookId = b.id
    JOIN title_books tb ON b.titleId = tb.id
WHERE ld.returnDate IS NULL;
-- ====================================================
-- END OF DATABASE SCRIPT
-- ====================================================