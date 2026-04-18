# Library Management System - API Documentation

**Base URL:** `http://localhost:4000/api`  
**Version:** 1.0.0  
**Authentication:** JWT Bearer Token

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Readers](#readers)
4. [Books](#books)
5. [Loans](#loans)
6. [Reports](#reports)
7. [System](#system)

---

## Authentication

All API endpoints require authentication unless specified otherwise.

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Register User
Create new user account (public).

**Endpoint:** `POST /auth/register`  
**Auth Required:** No

**Request Body:**
```json
{
  "fullName": "string (required)",
  "email": "string (required, email)",
  "password": "string (required, min 6)",
  "phoneNumber": "string (optional)"
}
```

**Response:** `201 Created`
```json
{
  "_id": "string",
  "fullName": "string",
  "email": "string",
  "isVerified": false,
  "createdAt": "date"
}
```

---

### Login
Authenticate user and receive JWT token.

**Endpoint:** `POST /auth/login`  
**Auth Required:** No

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response:** `200 OK`
```json
{
  "access_token": "string",
  "user": {
    "_id": "string",
    "fullName": "string",
    "email": "string",
    "role": "ADMIN | LIBRARIAN | USER"
  }
}
```

---

### Verify Account
Verify email with OTP code.

**Endpoint:** `POST /auth/verify-account`  
**Auth Required:** No

**Request Body:**
```json
{
  "email": "string (required)",
  "otp": "string (required, 6 digits)"
}
```

**Response:** `200 OK`
```json
{
  "message": "Account verified successfully"
}
```

---

### Forgot Password
Request password reset OTP.

**Endpoint:** `POST /auth/forgot-password`  
**Auth Required:** No

**Request Body:**
```json
{
  "email": "string (required)"
}
```

**Response:** `200 OK`
```json
{
  "message": "OTP sent to email"
}
```

---

### Reset Password
Reset password with OTP.

**Endpoint:** `POST /auth/reset-password`  
**Auth Required:** No

**Request Body:**
```json
{
  "email": "string (required)",
  "otp": "string (required, 6 digits)",
  "newPassword": "string (required, min 6)"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset successfully"
}
```

---

## Users

### Get All Users
List all system users.

**Endpoint:** `GET /users`  
**Auth Required:** Yes  
**Permission:** `Q014` (Quản lý người dùng)

**Query Parameters:**
- `role` (optional): Filter by role (ADMIN, LIBRARIAN, USER)

**Response:** `200 OK`
```json
[
  {
    "_id": "string",
    "fullName": "string",
    "email": "string",
    "phoneNumber": "string",
    "role": "string",
    "status": "active | inactive",
    "isVerified": boolean,
    "createdAt": "date"
  }
]
```

---

### Get User by ID
Get single user details.

**Endpoint:** `GET /users/:id`  
**Auth Required:** Yes  
**Permission:** `Q014`

**Response:** `200 OK`
```json
{
  "_id": "string",
  "fullName": "string",
  "email": "string",
  "phoneNumber": "string",
  "role": "string",
  "status": "string",
  "isVerified": boolean,
  "createdByAdmin": boolean
}
```

---

### Create User (Admin)
Admin creates new user account.

**Endpoint:** `POST /users`  
**Auth Required:** Yes  
**Permission:** `Q014`

**Request Body:**
```json
{
  "fullName": "string (required)",
  "email": "string (required)",
  "password": "string (required)",
  "phoneNumber": "string (optional)",
  "role": "LIBRARIAN | USER (required)"
}
```

**Response:** `201 Created`

---

### Update User
Update user information.

**Endpoint:** `PATCH /users/:id`  
**Auth Required:** Yes  
**Permission:** `Q014`

**Request Body:**
```json
{
  "fullName": "string (optional)",
  "phoneNumber": "string (optional)",
  "role": "string (optional)"
}
```

**Response:** `200 OK`

---

### Lock User Account
Lock user account.

**Endpoint:** `PATCH /users/:id/lock`  
**Auth Required:** Yes  
**Permission:** `Q014`

**Response:** `200 OK`

---

### Unlock User Account
Unlock user account.

**Endpoint:** `PATCH /users/:id/unlock`  
**Auth Required:** Yes  
**Permission:** `Q014`

**Response:** `200 OK`

---

### Delete User
Delete user account.

**Endpoint:** `DELETE /users/:id`  
**Auth Required:** Yes  
**Permission:** `Q014`

**Response:** `200 OK`

---

## Readers

### Get All Readers
List all library readers.

**Endpoint:** `GET /readers`  
**Auth Required:** Yes  
**Permission:** `Q004` (Tra cứu độc giả)

**Response:** `200 OK`
```json
[
  {
    "_id": "string",
    "fullName": "string",
    "dateOfBirth": "date",
    "address": "string",
    "email": "string",
    "phoneNumber": "string",
    "createdDate": "date",
    "expiryDate": "date",
    "totalDebt": number,
    "readerTypeId": {
      "_id": "string",
      "readerTypeName": "string",
      "maxBorrowLimit": number
    }
  }
]
```

---

### Search Readers
Search readers by keyword.

**Endpoint:** `GET /readers/search?keyword={keyword}`  
**Auth Required:** Yes  
**Permission:** `Q004`

**Query Parameters:**
- `keyword` (required): Search term (name, email, phone)

**Response:** `200 OK`

---

### Advanced Search Readers
Advanced search with filters.

**Endpoint:** `GET /readers/advanced-search`  
**Auth Required:** Yes  
**Permission:** `Q004`

**Query Parameters:**
- `fullName` (optional): Reader name
- `email` (optional): Email address
- `phoneNumber` (optional): Phone number
- `readerTypeId` (optional): Reader type ID
- `isExpired` (optional): true/false
- `hasDebt` (optional): true/false

**Response:** `200 OK`

---

### Get Expired Readers
List readers with expired cards.

**Endpoint:** `GET /readers/expired`  
**Auth Required:** Yes  
**Permission:** `Q004`

**Response:** `200 OK`

---

### Get Readers with Debt
List readers with outstanding debt.

**Endpoint:** `GET /readers/with-debt`  
**Auth Required:** Yes  
**Permission:** `Q004`

**Response:** `200 OK`

---

### Create Reader (BM1)
Create new library reader card.

**Endpoint:** `POST /readers`  
**Auth Required:** Yes  
**Permission:** `Q001` (Lập thẻ độc giả)

**Request Body:**
```json
{
  "fullName": "string (required)",
  "dateOfBirth": "date (required)",
  "address": "string (optional)",
  "email": "string (required, email)",
  "phoneNumber": "string (optional)",
  "readerTypeId": "string (required, mongoId)"
}
```

**Validations:**
- Age must be between `QD1_MIN_AGE` and `QD1_MAX_AGE`
- Card validity: `QD8_CARD_VALIDITY_MONTHS`

**Response:** `201 Created`

---

### Update Reader
Update reader information.

**Endpoint:** `PATCH /readers/:id`  
**Auth Required:** Yes  
**Permission:** `Q002` (Sửa thông tin độc giả)

**Request Body:**
```json
{
  "fullName": "string (optional)",
  "address": "string (optional)",
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

**Response:** `200 OK`

---

### Renew Reader Card
Renew reader card validity.

**Endpoint:** `PATCH /readers/:id/renew`  
**Auth Required:** Yes  
**Permission:** `Q002` (Sửa thông tin độc giả)

**Request Body:**
```json
{
  "months": "number (optional, default: QD8_CARD_VALIDITY_MONTHS parameter or 6)"
}
```

**Response:** `200 OK`

---

### Delete Reader
Delete reader.

**Endpoint:** `DELETE /readers/:id`  
**Auth Required:** Yes  
**Permission:** `Q003` (Xóa độc giả)

**Response:** `200 OK`

---

## Books

### Get All Book Copies
List all book copies.

**Endpoint:** `GET /book-copies`  
**Auth Required:** Yes  
**Permission:** `Q008` (Tra cứu sách)

**Response:** `200 OK`
```json
[
  {
    "_id": "string",
    "status": 0 | 1,
    "bookId": {
      "_id": "string",
      "publisher": "string",
      "publishYear": number,
      "price": number,
      "titleId": {
        "_id": "string",
        "title": "string",
        "categoryId": {...},
        "isbn": "string"
      }
    }
  }
]
```

---

### Search Books (BM3)
Search books by keyword.

**Endpoint:** `GET /books/search?keyword={keyword}`  
**Auth Required:** Yes  
**Permission:** `Q008`

**Response:** `200 OK`

---

### Create Book (BM2)
Receive new book into library.

**Endpoint:** `POST /books`  
**Auth Required:** Yes  
**Permission:** `Q005` (Tiếp nhận sách)

**Request Body:**
```json
{
  "titleId": "string (required)",
  "publisher": "string (required)",
  "publishYear": number (required),
  "price": number (required)",
  "numberOfCopies": number (optional, default 1)
}
```

**Validations:**
- Publication year must be within `QD8_PUBLICATION_YEAR_GAP` years

**Response:** `201 Created`

---

### Get All Title Books
List all book titles.

**Endpoint:** `GET /title-books`  
**Auth Required:** Yes

**Response:** `200 OK`

---

### Create Title Book
Create new book title.

**Endpoint:** `POST /title-books`  
**Auth Required:** Yes  
**Permission:** `Q005`

**Request Body:**
```json
{
  "title": "string (required)",
  "categoryId": "string (required)",
  "isbn": "string (optional)"
}
```

**Response:** `201 Created`

---

### Get All Categories
List all book categories.

**Endpoint:** `GET /categories`  
**Auth Required:** Yes

**Response:** `200 OK`
```json
[
  {
    "_id": "string",
    "categoryName": "string"
  }
]
```

---

### Create Category
Create new category.

**Endpoint:** `POST /categories`  
**Auth Required:** Yes  
**Permission:** `Q016` (Quản lý thể loại)

**Request Body:**
```json
{
  "categoryName": "string (required, unique)"
}
```

**Response:** `201 Created`

---

### Get All Authors
List all authors.

**Endpoint:** `GET /authors`  
**Auth Required:** Yes

**Response:** `200 OK`
```json
[
  {
    "_id": "string",
    "authorName": "string"
  }
]
```

---

### Create Author
Create new author.

**Endpoint:** `POST /authors`  
**Auth Required:** Yes  
**Permission:** `Q017` (Quản lý tác giả)

**Request Body:**
```json
{
  "authorName": "string (required, unique)"
}
```

**Response:** `201 Created`

---

## Loans

### Create Loan (BM4)
Create new loan (borrow books).

**Endpoint:** `POST /loans`  
**Auth Required:** Yes  
**Permission:** `Q009` (Cho mượn sách)

**Request Body:**
```json
{
  "readerId": "string (required, mongoId)",
  "bookIds": ["string (required, array of copy IDs, min 1)"]
}
```

**Validations (QĐ4):**
- Reader card must not be expired
- Reader must not have overdue books
- Reader must not exceed `maxBorrowLimit` for their reader type
- Books must be available (status = 1)

**Response:** `201 Created`
```json
{
  "_id": "string",
  "borrowDate": "date",
  "readerId": {...}
}
```

---

### Validate Borrow
Check if reader can borrow books (pre-validation).

**Endpoint:** `POST /loans/validate-borrow`  
**Auth Required:** Yes  
**Permission:** `Q009`

**Request Body:**
```json
{
  "readerId": "string (required)",
  "copyIds": ["string (required, array)"]
}
```

**Response:** `200 OK`
```json
{
  "canBorrow": boolean,
  "errors": [
    {
      "code": "CARD_EXPIRED | HAS_OVERDUE | EXCEED_LIMIT | BOOK_UNAVAILABLE",
      "message": "string"
    }
  ],
  "reader": {
    "fullName": "string",
    "_id": "string",
    "currentBorrowCount": number,
    "maxBorrowLimit": number,
    "hasOverdueBooks": boolean
  }
}
```

---

### Return Book (BM5)
Return borrowed book and calculate fine.

**Endpoint:** `POST /loans/:loanId/return-book`  
**Auth Required:** Yes  
**Permission:** `Q010` (Nhận trả sách)

**Request Body:**
```json
{
  "copyId": "string (required)",
  "returnDate": "date (optional, default now)"
}
```

**Fine Calculation (QĐ5):**
- Max borrow days: `QD8_MAX_BORROW_DAYS`
- Fine per day: `QD8_FINE_PER_DAY` VND
- Overdue days = `returnDate - (borrowDate + maxDays)`
- Fine = `overdueDays * finePerDay`

**Response:** `200 OK`
```json
{
  "success": true,
  "loanDetail": {
    "copyId": "string",
    "bookTitle": "string",
    "borrowDate": "date",
    "returnDate": "date",
    "expectedReturnDate": "date",
    "overdueDays": number,
    "fineAmount": number
  },
  "reader": {
    "fullName": "string",
    "totalDebt": number,
    "newDebt": number
  }
}
```

---

### Get All Loans
List all loans.

**Endpoint:** `GET /loans`  
**Auth Required:** Yes  
**Permission:** `Q009`

**Response:** `200 OK`

---

### Get Overdue Loans
List overdue loans.

**Endpoint:** `GET /loans/overdue`  
**Auth Required:** Yes  
**Permission:** `Q009`

**Response:** `200 OK`

---

### Get Loan Details
Get all loan details (individual book items in loans).

**Endpoint:** `GET /loans-details`  
**Auth Required:** Yes  
**Permission:** `Q009`

**Response:** `200 OK`
```json
[
  {
    "_id": "string",
    "loanId": {...},
    "copyId": {...},
    "returnDate": "date | null",
    "overdueDays": number,
    "fineAmount": number
  }
]
```

---

## Reports

### Dashboard Statistics
Get dashboard overview.

**Endpoint:** `GET /reports/dashboard`  
**Auth Required:** Yes  
**Permission:** `Q012` (Xem báo cáo)

**Response:** `200 OK`
```json
{
  "books": {
    "total": number,
    "available": number,
    "borrowed": number
  },
  "readers": {
    "total": number,
    "active": number,
    "expired": number
  },
  "loans": {
    "active": number,
    "overdue": number,
    "returned": number
  },
  "fines": {
    "total": number,
    "paid": number,
    "pending": number
  }
}
```

---

### Borrow by Category Report (BM7)
Statistics of books borrowed by category.

**Endpoint:** `GET /reports/borrow-by-category?month={month}&year={year}`  
**Auth Required:** Yes  
**Permission:** `Q012`

**Query Parameters:**
- `month` (required): 1-12
- `year` (required): e.g., 2024

**Response:** `200 OK`
```json
[
  {
    "categoryName": "string",
    "totalBorrowed": number,
    "percentage": number
  }
]
```

---

### Overdue Loans Report
List of overdue loans.

**Endpoint:** `GET /reports/overdue-loans`  
**Auth Required:** Yes  
**Permission:** `Q012`

**Response:** `200 OK`

---

### Reader Statistics
Reader statistics by type.

**Endpoint:** `GET /reports/reader-statistics?month={month}&year={year}`  
**Auth Required:** Yes  
**Permission:** `Q012`

**Response:** `200 OK`

---

### Fine Statistics
Fine collection statistics.

**Endpoint:** `GET /reports/fine-statistics?month={month}&year={year}`  
**Auth Required:** Yes  
**Permission:** `Q012`

**Response:** `200 OK`

---

### Books Distribution
Books distribution by category.

**Endpoint:** `GET /reports/books-distribution`  
**Auth Required:** Yes  
**Permission:** `Q012`

**Response:** `200 OK`

---

### Trend Report
Loan/return trends over time.

**Endpoint:** `GET /reports/trend?period={daily|weekly|monthly}`  
**Auth Required:** Yes  
**Permission:** `Q012`

**Response:** `200 OK`

---

## System

### Get All Parameters
Get system parameters (regulations).

**Endpoint:** `GET /parameters`  
**Auth Required:** Yes

**Response:** `200 OK`
```json
[
  {
    "_id": "string",
    "paramName": "QD1_MIN_AGE | QD1_MAX_AGE | QD8_*",
    "paramValue": "string",
    "description": "string",
    "dataType": "number | string"
  }
]
```

---

### Get Parameter by Name
Get specific parameter.

**Endpoint:** `GET /parameters/name/:paramName`  
**Auth Required:** Yes

**Response:** `200 OK`

---

### Update Parameter (QĐ8)
Update system parameter.

**Endpoint:** `PATCH /parameters/name/:paramName`  
**Auth Required:** Yes  
**Permission:** `Q015` (Thay đổi quy định)

**Request Body:**
```json
{
  "paramValue": "string (required)"
}
```

**Audit Logging:**
- Creates audit log with old and new values
- UserId from JWT token
- Action: UPDATE, Table: parameters

**Response:** `200 OK`

---

### Get Audit Logs
Get system audit logs.

**Endpoint:** `GET /audit-logs?userId={userId}&tableName={table}&action={action}`  
**Auth Required:** Yes  
**Permission:** `Q014`

**Query Parameters:**
- `userId` (optional): Filter by user
- `tableName` (optional): Filter by table
- `action` (optional): CREATE | UPDATE | DELETE

**Response:** `200 OK`
```json
[
  {
    "_id": "string",
    "userId": {...},
    "action": "string",
    "tableName": "string",
    "recordId": "string",
    "description": "string",
    "oldValues": object,
    "newValues": object,
    "createdAt": "date"
  }
]
```

---

### Get Notifications
Get user notifications.

**Endpoint:** `GET /notifications`  
**Auth Required:** Yes

**Response:** `200 OK`
```json
[
  {
    "_id": "string",
    "userId": "string",
    "type": "info | warning | error",
    "title": "string",
    "message": "string",
    "isRead": boolean,
    "createdAt": "date"
  }
]
```

---

### Get Unread Notifications
Get unread notifications only.

**Endpoint:** `GET /notifications/unread`  
**Auth Required:** Yes

**Response:** `200 OK`

---

### Get Unread Count
Get count of unread notifications.

**Endpoint:** `GET /notifications/unread/count`  
**Auth Required:** Yes

**Response:** `200 OK`
```json
{
  "count": number
}
```

---

### Mark as Read
Mark notification as read.

**Endpoint:** `PATCH /notifications/:id/read`  
**Auth Required:** Yes

**Response:** `200 OK`

---

### Mark All as Read
Mark all notifications as read.

**Endpoint:** `PATCH /notifications/read-all`  
**Auth Required:** Yes

**Response:** `200 OK`

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Error description",
  "errors": [...]  // Optional validation errors
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Permissions Reference

| Code | Permission Name | Description |
|------|----------------|-------------|
| Q001 | Lập thẻ độc giả | BM1 - Create reader cards |
| Q002 | Sửa thông tin độc giả | Edit reader information |
| Q003 | Xóa độc giả | Delete readers |
| Q004 | Tra cứu độc giả | Search readers |
| Q005 | Tiếp nhận sách | BM2 - Receive new books |
| Q006 | Sửa thông tin sách | Edit book information |
| Q007 | Xóa sách | Delete books |
| Q008 | Tra cứu sách | BM3 - Search books |
| Q009 | Cho mượn sách | BM4 - Lend books |
| Q010 | Nhận trả sách | BM5 - Return books |
| Q011 | Thu tiền phạt | BM6 - Collect fines |
| Q012 | Xem báo cáo | BM7 - View reports |
| Q013 | Xuất báo cáo | Export reports |
| Q014 | Quản lý người dùng | Manage users |
| Q015 | Thay đổi quy định | QĐ8 - Change regulations |
| Q016 | Quản lý thể loại | Manage categories |
| Q017 | Quản lý tác giả | Manage authors |
| Q018 | Quản lý loại độc giả | Manage reader types |

---

## Parameters (Regulations) Reference

| Parameter Name | Description | Default |
|---------------|-------------|---------|
| QD1_MIN_AGE | Min age for reader card | 18 |
| QD1_MAX_AGE | Max age for reader card | 55 |
| QD8_CARD_VALIDITY_MONTHS | Card validity (months) | 6 |
| QD8_CATEGORY_LIMIT | Max categories | 3 |
| QD8_PUBLICATION_YEAR_GAP | Max book age (years) | 8 |
| QD8_MAX_BOOKS_PER_LOAN | Max books per loan | 5 |
| QD8_MAX_BORROW_DAYS | Max borrow days | 4 |
| QD8_FINE_PER_DAY | Fine per overdue day (VND) | 1000 |

---

© 2024 Library Management System
