# 🧪 Frontend Testing Guide

## 📋 Tổng Quan

Thư mục này chứa 2 script test để kiểm tra frontend của Library Management System:

1. **`test-frontend.ps1`** - Test toàn diện (bao gồm build)
2. **`quick-check.ps1`** - Kiểm tra nhanh (không build)

---

## 🚀 Cách Sử Dụng

### Option 1: Test Toàn Diện (Khuyến nghị)

```powershell
# Chạy test đầy đủ (bao gồm TypeScript, ESLint, và Build)
.\test-frontend.ps1
```

**Thời gian:** ~3-5 phút  
**Kiểm tra:**
- ✅ Node.js & NPM version
- ✅ Dependencies (node_modules)
- ✅ TypeScript type checking
- ✅ ESLint linting
- ✅ Configuration files
- ✅ Next.js build test

**Output:** 
- Hiển thị kết quả chi tiết trên console
- Tạo file báo cáo: `test-report-YYYY-MM-DD-HHmmss.txt`

---

### Option 2: Kiểm Tra Nhanh

```powershell
# Chạy kiểm tra nhanh (không build)
.\quick-check.ps1
```

**Thời gian:** ~30 giây  
**Kiểm tra:**
- ✅ TypeScript errors
- ✅ ESLint errors
- ✅ Console statements (console.log, etc.)

---

## 📊 Hiểu Kết Quả Test

### ✅ PASS (Màu xanh)
- Không có lỗi
- Code sẵn sàng để deploy

### ⚠ WARNING (Màu vàng)
- Có cảnh báo nhỏ
- Nên xem xét nhưng không chặn deploy
- VD: ESLint warnings, console.log statements

### ❌ FAIL (Màu đỏ)
- Có lỗi nghiêm trọng
- **PHẢI SỬA** trước khi deploy
- VD: TypeScript errors, Build failures

---

## 🔧 Sửa Lỗi Thường Gặp

### 1. TypeScript Errors

```bash
# Xem chi tiết lỗi TypeScript
npx tsc --noEmit
```

**Lỗi thường gặp:**
- Missing types: `npm install --save-dev @types/[package-name]`
- Type mismatch: Kiểm tra kiểu dữ liệu trong code
- Implicit any: Thêm type annotation

### 2. ESLint Errors

```bash
# Xem chi tiết lỗi ESLint
npm run lint

# Tự động fix một số lỗi
npm run lint -- --fix
```

### 3. Build Errors

```bash
# Build để xem lỗi chi tiết
npm run build

# Clear cache nếu build lỗi lạ
rm -rf .next
npm run build
```

### 4. Dependencies Issues

```bash
# Cài lại dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Checklist Trước Khi Commit

- [ ] Chạy `.\quick-check.ps1` - Tất cả PASS
- [ ] Chạy `.\test-frontend.ps1` - Tất cả PASS
- [ ] Xóa tất cả `console.log` không cần thiết
- [ ] Kiểm tra code đã format đúng
- [ ] Test thủ công các tính năng mới

---

## 🎯 Best Practices

### 1. Chạy Quick Check Thường Xuyên
```powershell
# Trước mỗi lần commit
.\quick-check.ps1
```

### 2. Chạy Full Test Trước Khi Push
```powershell
# Trước khi push lên Git
.\test-frontend.ps1
```

### 3. Kiểm Tra Build Định Kỳ
```powershell
# Ít nhất 1 lần/ngày hoặc trước khi merge
npm run build
```

---

## 🐛 Troubleshooting

### Script không chạy được?

1. **Kiểm tra PowerShell Execution Policy:**
```powershell
# Xem policy hiện tại
Get-ExecutionPolicy

# Cho phép chạy script (nếu cần)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

2. **Chạy từ thư mục frontend:**
```powershell
cd frontend
.\test-frontend.ps1
```

### Build quá lâu?

- Sử dụng `quick-check.ps1` cho kiểm tra nhanh
- Build chỉ cần chạy trước khi deploy hoặc merge

### Lỗi "command not found"?

- Đảm bảo đã cài Node.js và NPM
- Chạy `npm install` trước khi test

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. Đọc error message cẩn thận
2. Kiểm tra file báo cáo `test-report-*.txt`
3. Google error message cụ thể
4. Hỏi team member

---

## 🔄 Workflow Khuyến Nghị

```
1. Code feature mới
   ↓
2. .\quick-check.ps1 (kiểm tra nhanh)
   ↓
3. Fix errors (nếu có)
   ↓
4. Test thủ công
   ↓
5. .\test-frontend.ps1 (test đầy đủ)
   ↓
6. Commit & Push
```

---

## 📈 Metrics

Script sẽ kiểm tra:
- **Code Quality:** TypeScript + ESLint
- **Build Status:** Next.js build success
- **Dependencies:** Package integrity
- **Configuration:** Required files

**Mục tiêu:** 100% tests PASS trước mỗi deployment! 🎯
