# Backend API Tests

Comprehensive E2E tests for Library Management System API

## 📋 Test Coverage

### Test Files

| File | Description | Test Count | Coverage |
|------|-------------|------------|----------|
| `auth.e2e-spec.ts` | Authentication & Authorization | 8 tests | Login, Register, Profile |
| `readers.e2e-spec.ts` | BM1: Lập thẻ độc giả + QĐ1 | 12 tests | CRUD, Age validation |
| `books.e2e-spec.ts` | BM2/BM3: Tiếp nhận & Tra cứu sách + QĐ2 | 14 tests | CRUD, Search, Validation |
| `loans.e2e-spec.ts` | BM4/BM5: Mượn & Trả sách + QĐ4/QĐ5 | 11 tests | Validate, Borrow, Return, Fine calculation |
| `fine-receipts.e2e-spec.ts` | BM6: Thu tiền phạt + QĐ6 | 9 tests | Create, Search, Payment validation |
| `reports.e2e-spec.ts` | BM7: Báo cáo thống kê | 8 tests | Dashboard, Category stats, Overdue reports |
| `parameters.e2e-spec.ts` | QĐ8: Thay đổi quy định | 14 tests | View, Update regulations |

**Total: 76 E2E tests**

## 🚀 Running Tests

### Prerequisites

1. **Start MongoDB:**
   ```bash
   # Make sure MongoDB is running
   mongod
   ```

2. **Seed Database:**
   ```bash
   cd backend
   npm run seed
   ```

3. **Start Backend Server:**
   ```bash
   npm run start:dev
   ```

### Run All Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with coverage
npm run test:cov

# Run in watch mode
npm run test:watch
```

### Run Specific Test File

```bash
# Run authentication tests
npm run test:e2e -- auth.e2e-spec.ts

# Run readers tests
npm run test:e2e -- readers.e2e-spec.ts

# Run loans tests
npm run test:e2e -- loans.e2e-spec.ts
```

### Run Tests in Debug Mode

```bash
npm run test:debug
```

## 📊 Test Details

### 1. Authentication Tests (`auth.e2e-spec.ts`)

**Tests:**
- ✅ Login with valid credentials
- ✅ Login with invalid email
- ✅ Login with invalid password
- ✅ Login with missing credentials
- ✅ Get profile with valid token
- ✅ Get profile without token
- ✅ Get profile with invalid token
- ✅ Register new user as admin

**Validates:**
- JWT token generation
- Password hashing
- Role-based access control

---

### 2. Readers Tests (`readers.e2e-spec.ts`)

**Tests:**
- ✅ Get all readers
- ✅ Create reader with valid data (BM1)
- ✅ Fail with age < 18 (QĐ1)
- ✅ Fail with age > 55 (QĐ1)
- ✅ Fail with missing fields
- ✅ Fail with invalid email
- ✅ Search readers by keyword
- ✅ Get expired readers
- ✅ Get readers with debt
- ✅ Get reader by ID
- ✅ Update reader information
- ✅ Delete reader

**Validates:**
- BM1: Lập thẻ độc giả
- QĐ1: Age limits (18-55)
- QĐ1: Card validity (6 months)
- Reader type assignment

---

### 3. Books Tests (`books.e2e-spec.ts`)

**Tests:**
- ✅ Get all books (BM3)
- ✅ Create book with valid data (BM2)
- ✅ Fail with old publish year (QĐ2)
- ✅ Fail with future publish year (QĐ2)
- ✅ Fail with negative price
- ✅ Fail with excessive price
- ✅ Search books by keyword
- ✅ Search books by category
- ✅ Advanced search with filters
- ✅ Get available books
- ✅ Get recently added books
- ✅ Get book by ID
- ✅ Update book information
- ✅ Delete book

**Validates:**
- BM2: Tiếp nhận sách mới
- BM3: Tra cứu sách
- QĐ2: Publication year gap (8 years)
- Price validation

---

### 4. Loans Tests (`loans.e2e-spec.ts`)

**Tests:**
- ✅ Validate borrow conditions (BM4)
- ✅ Fail validation with non-existent reader
- ✅ Fail validation with empty copyIds
- ✅ Create new loan (BM4)
- ✅ Add book to loan
- ✅ Return book and calculate fine (BM5)
- ✅ Fail to return already returned book
- ✅ Fail with non-existent loan
- ✅ Get all loans
- ✅ Get loans by reader
- ✅ Get overdue loans

**Validates:**
- BM4: Cho mượn sách
- QĐ4: Borrow conditions (card validity, no overdue, limit)
- BM5: Nhận trả sách
- QĐ5: Fine calculation (1,000 VND/day)
- New API: `POST /loans/validate-borrow`
- New API: `POST /loans/:loanId/return-book`

---

### 5. Fine Receipts Tests (`fine-receipts.e2e-spec.ts`)

**Tests:**
- ✅ Get all fine receipts
- ✅ Create fine receipt (BM6)
- ✅ Fail with amount > debt (QĐ6)
- ✅ Fail with negative amount
- ✅ Fail with missing fields
- ✅ Get receipts by reader
- ✅ Search receipts by date
- ✅ Get unpaid receipts
- ✅ Mark receipt as paid

**Validates:**
- BM6: Lập phiếu thu tiền phạt
- QĐ6: Amount validation (not exceed debt)
- Payment tracking

---

### 6. Reports Tests (`reports.e2e-spec.ts`)

**Tests:**
- ✅ Get dashboard statistics
- ✅ Get borrow by category (BM7.1)
- ✅ Filter by date range
- ✅ Get overdue loans report (BM7.2)
- ✅ Get reader statistics
- ✅ Get fine statistics
- ✅ Get books distribution
- ✅ Get borrowing trend

**Validates:**
- BM7.1: Báo cáo thống kê mượn theo thể loại
- BM7.2: Báo cáo sách trả trễ
- Dashboard metrics
- Date range filtering

---

### 7. Parameters Tests (`parameters.e2e-spec.ts`)

**Tests:**
- ✅ Get all parameters
- ✅ Librarian can view parameters
- ✅ Get parameter by name
- ✅ Admin can update parameter (QĐ8)
- ✅ Librarian cannot update parameter
- ✅ Update QD1_MIN_AGE
- ✅ Update QD1_MAX_AGE
- ✅ Update QD8_CARD_VALIDITY_MONTHS
- ✅ Update QD8_PUBLICATION_YEAR_GAP
- ✅ Update QD8_MAX_BOOKS_PER_LOAN
- ✅ Update QD8_MAX_BORROW_DAYS
- ✅ Update QD8_FINE_PER_DAY
- ✅ Admin can create parameter
- ✅ Librarian cannot create parameter

**Validates:**
- QĐ8: Thay đổi quy định
- Admin-only access
- All regulation parameters

---

## 🔧 Configuration

### Jest Configuration

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": ["**/*.(t|j)s"],
  "coverageDirectory": "../coverage",
  "testEnvironment": "node"
}
```

### E2E Configuration (`test/jest-e2e.json`)

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

## 📝 Test Accounts

Use these accounts for testing:

```typescript
// Admin Account
{
  email: 'admin@library.com',
  password: 'admin123',
  role: 'ADMIN'
}

// Librarian Account
{
  email: 'librarian@library.com',
  password: 'admin123',
  role: 'LIBRARIAN'
}
```

## 🎯 Test Scenarios

### Scenario 1: Complete Borrow & Return Flow

1. Login as librarian
2. Validate borrow conditions
3. Create loan
4. Add books to loan
5. Return books (on time)
6. Verify no fine

### Scenario 2: Overdue & Fine Flow

1. Login as librarian
2. Create loan (backdated)
3. Return books (late)
4. Verify fine calculation
5. Create fine receipt
6. Verify debt update

### Scenario 3: Regulation Changes

1. Login as admin
2. Update QD8_MAX_BORROW_DAYS
3. Update QD8_FINE_PER_DAY
4. Verify changes applied
5. Test with new values

## 🐛 Troubleshooting

### Tests Failing?

1. **Check MongoDB:**
   ```bash
   # Verify MongoDB is running
   mongosh
   ```

2. **Re-seed Database:**
   ```bash
   npm run seed
   ```

3. **Clear Test Database:**
   ```bash
   # In MongoDB shell
   use library
   db.dropDatabase()
   ```

4. **Check Backend Server:**
   ```bash
   # Make sure server is running on port 4000
   curl http://localhost:4000/api
   ```

### Common Issues

**Issue:** `ECONNREFUSED`
- **Solution:** Start backend server first

**Issue:** `401 Unauthorized`
- **Solution:** Check if seed data exists (test accounts)

**Issue:** `404 Not Found`
- **Solution:** Verify API routes in controllers

**Issue:** `Timeout`
- **Solution:** Increase Jest timeout in test file

## 📚 Resources

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest](https://github.com/visionmedia/supertest)

---

**Last Updated:** 2025-12-21  
**Test Framework:** Jest + Supertest  
**Total Tests:** 76 E2E tests
