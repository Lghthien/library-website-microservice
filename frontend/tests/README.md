# 🤖 Automated Frontend Tests

## 📋 Tổng Quan

Bộ test tự động cho **Library Management System Frontend** sử dụng Playwright.

**Thông tin đăng nhập:**
- Email: `admin@library.com`
- Password: `admin123`

---

## ✅ Test Coverage (39 tests)

### 1. Dashboard (4 tests)
- Dashboard hiển thị sau login
- Hiển thị card thống kê
- Loading state
- Thời gian hệ thống

### 2. Quản Lý Độc Giả (15 tests)
**UI Tests:**
- Trang danh sách hiển thị
- Button "Lập thẻ độc giả"
- Tìm kiếm độc giả
- Filter theo loại
- Form có đầy đủ trường
- Cảnh báo QĐ1 (tuổi 18-55)

**Validation Tests:**
- Form rỗng không submit được
- Email không hợp lệ
- Tuổi dưới 18
- Tuổi trên 55

**CRUD Tests:**
- Thêm độc giả thành công
- Sửa thông tin độc giả
- Xóa độc giả
- Hiển thị tổng số

### 3. Quản Lý Sách (20 tests)
**UI Tests:**
- Trang danh sách hiển thị
- Button "Tiếp nhận sách"
- Tìm kiếm sách
- Filter theo thể loại
- Form có đầy đủ trường
- Cảnh báo QĐ2 (năm XB)
- Định dạng VNĐ

**Validation Tests:**
- Form rỗng không submit được
- Năm xuất bản quá cũ (> 8 năm)
- Năm xuất bản trong tương lai
- Giá sách = 0
- Giá sách âm
- Giá sách quá lớn (> 100 triệu)

**CRUD Tests:**
- Thêm sách thành công
- SearchableInput cho tác giả
- Sửa thông tin sách
- Xóa sách
- Badge trạng thái sách
- Hiển thị tổng số

---

## 🚀 Cách Chạy

### 1. Cài đặt Playwright (lần đầu)

```powershell
npm install --save-dev @playwright/test
npx playwright install
```

### 2. Đảm bảo servers đang chạy

```powershell
# Terminal 1 - Backend (port 4000)
cd backend
npm run start:dev

# Terminal 2 - Frontend (port 3000)
cd frontend
npm run dev
```

### 3. Chạy tests

```powershell
# Chạy tất cả
npm test

# Chạy với UI (khuyến nghị)
npm run test:ui

# Chạy test cụ thể
npx playwright test 01-dashboard
npx playwright test 02-readers
npx playwright test 03-books

# Xem báo cáo
npm run test:report
```

---

## 📁 Cấu Trúc

```
tests/
├── helpers/
│   └── auth.ts              # Login/Logout helpers
├── 01-dashboard.spec.ts     # 4 tests - Dashboard
├── 02-readers.spec.ts       # 15 tests - Readers (UI + Validation + CRUD)
└── 03-books.spec.ts         # 20 tests - Books (UI + Validation + CRUD)
```

---

## 🎯 Test Categories

### UI Tests
Kiểm tra giao diện hiển thị đúng, buttons, forms, tables

### Validation Tests
Kiểm tra các quy định nghiệp vụ:
- **QĐ1:** Tuổi độc giả từ 18-55
- **QĐ2:** Năm xuất bản sách không quá 8 năm
- **Giá sách:** Không âm, không quá 100 triệu
- **Email:** Format hợp lệ

### CRUD Tests
Kiểm tra thêm, sửa, xóa dữ liệu

---

## 🎨 Kết Quả Mong Đợi

```
Running 39 tests using 1 worker

  ✓ 01-dashboard.spec.ts:4 passed (8s)
  ✓ 02-readers.spec.ts:15 passed (45s)
  ✓ 03-books.spec.ts:20 passed (60s)

  39 passed (2m)
```

---

## 🔧 Lưu Ý

1. **Backend API:** Port **4000** (không phải 3001)
2. **Login redirect:** `/portal/dashboard`
3. **Account test:** Cần có `admin@library.com` / `admin123` trong database
4. **Data test:** Nên có một số độc giả và sách để CRUD tests hoạt động đầy đủ
5. **Validation tests:** Sẽ kiểm tra nhưng không thực sự submit (để tránh tạo data rác)

---

## 💡 Tips

- Dùng `npm run test:ui` để xem tests chạy trực tiếp
- Click vào test bất kỳ để xem chi tiết
- Screenshots và videos tự động lưu khi test fail
- Dùng `--headed` để debug: `npx playwright test --headed`

---

**Happy Testing! 🚀**
