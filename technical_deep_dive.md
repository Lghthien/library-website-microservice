# 🚀 Phân tích Chuyên sâu Kiến trúc Hệ thống (Technical Deep Dive)

Tài liệu này cung cấp một cái nhìn chi tiết và chuyên môn về cách hệ thống Library Management được xây dựng, vận hành và phối hợp giữa các vi dịch vụ.

---

## 1. Kiến trúc Tổng thể & Gateway (The Entry Point)

Hệ thống sử dụng mô hình **API Gateway Pattern**. Đây là lớp bảo vệ và điều hướng duy nhất giữa Frontend và các Microservices.

### 🌐 API Gateway (`/gateway`)
Gateway không chứa logic nghiệp vụ mà hoạt động như một bộ điều hướng thông minh.
- **Proxy Engine**: Sử dụng `http-proxy-middleware` để chuyển tiếp các request HTTP.
- **GatewayRouterMiddleware**: Đây là thành phần trái tim của Gateway. Nó kiểm tra tiền tố của URL (ví dụ: `/api/books`) và quyết định gửi request đó đến Service nào dựa trên cấu hình trong `proxy.middleware.ts`.
- **Cơ chế xử lý Body**: Sử dụng `fixRequestBody` để đảm bảo dữ liệu JSON từ request gốc không bị mất khi đi qua proxy của Express.

---

## 2. Bảo mật & Phân quyền (`/auth-service`)

Dịch vụ này đóng vai trò là **Identity Provider** cho toàn hệ thống.

### 🔐 Cơ chế Xác thực
- **JWT (JSON Web Token)**: Hệ thống sử dụng Passport.js với chiến lược JWT. Token được tạo ra sau khi đăng nhập thành công và chứa thông tin định danh (`sub`), email và vai trò (`role`).
- **RBAC (Role-Based Access Control)**:
    - **RolesGuard**: Một Guard toàn cục kiểm tra xem người dùng có vai trò phù hợp (ADMIN, LIBRARIAN, READER) để truy cập endpoint hay không.
    - **RequirePermissions Decorator**: Một decorator tùy chỉnh cấp độ cao hơn, cho phép kiểm tra mã quyền cụ thể (ví dụ: `Q001` cho phép thêm sách) trước khi thực thi hàm trong Controller.

---

## 3. Quản lý Danh mục & Dữ liệu (`/catalog-service`)

Đây là dịch vụ phức tạp nhất về mặt dữ liệu, nơi lưu trữ tất cả thông tin về "thực thể" trong thư viện.

### 📚 Kiến trúc Centralized Schema
Một trong những cải tiến quan trọng nhất là **`CatalogSchemasModule`**. 
- **Vấn đề cũ**: Trước đây, các model như `Book` và `Author` được đăng nhập rời rạc ở nhiều nơi, dẫn đến việc Mongoose không thể thực hiện lệnh `.populate()` vì không tìm thấy schema liên quan.
- **Giải pháp**: Tất cả 6 Schema chính (`Book`, `BookCopy`, `TitleBook`, `Author`, `Category`, `TitleAuthor`) được tập hợp lại và đăng ký trong một Module Global. Điều này đảm bảo tính nhất quán của dữ liệu trên toàn hệ thống.

### 🖼️ Xử lý Media
Dịch vụ này quản lý việc tải lên ảnh bìa sách thông qua `Multer`. Ảnh được lưu vào thư mục `/uploads` và được ánh xạ qua `ServeStaticModule` để có thể truy cập qua URL từ Gateway.

---

## 4. Nghiệp vụ Mượn & Trả (`/loan-service`)

Đây là nơi thực thi các **Business Rules** cốt lõi của thư viện.

### 💸 Logic Mượn sách (`validateBorrow`)
Trước khi tạo một phiếu mượn, hệ thống thực hiện một chuỗi kiểm tra nghiêm ngặt:
1. **Thành viên**: Thẻ độc giả còn hạn không?
2. **Quá hạn**: Độc giả có đang nợ sách quá hạn chưa trả không?
3. **Số lượng**: Tổng số sách mượn có vượt quá giới hạn của `ReaderType` không?
4. **Trình trạng kho**: Cuốn sách cụ thể đó có đang ở trạng thái mượn được không?

### ⏱️ Tính phí phạt (`returnBook`)
Khi trả sách, hệ thống sử dụng dữ liệu từ `parameter-service` để tính toán:
- **Overdue Days**: Khoảng cách giữa ngày trả thực tế và ngày phải trả.
- **Fine Amount**: `Overdue Days` * `Đơn giá phạt/ngày`.
- **Lost Book**: Nếu sách bị báo mất, giá trị của sách (`price`) sẽ được cộng trực tiếp vào `totalDebt` của độc giả.

---

## 5. Các Dịch vụ Hỗ trợ

### 📊 Report Service
Sử dụng các câu lệnh **MongoDB Aggregation Pipeline** để tổng hợp dữ liệu từ các bộ sưu tập khác nhau (như số lượt mượn theo thể loại) để tạo ra các báo cáo thống kê theo tháng/quý.

### 🔔 Notification Service
Hoạt động như một **Audit Service**. Nó không chỉ gửi email mà còn lưu trữ `Audit Log` (Nhật ký hoạt động). Mọi hành động nhạy cảm như xóa sách, sửa quyền đều được ghi lại để quản trị viên theo dõi.

### ⚙️ Parameter Service
Lưu trữ các "Hằng số nghiệp vụ". Thay vì fix cứng số ngày được mượn là 4 ngày vào code, hệ thống truy vấn Parameter `QD4_MAX_BORROW_DAYS`. Điều này cho phép Thủ thư thay đổi quy định thư viện mà không cần khởi động lại hay sửa mã nguồn.

---

## 6. Cơ chế Ghi vết & Báo cáo (Audit & Intelligence)

### 📋 Hệ thống Audit Log
Hệ thống sử dụng một cơ chế tập trung để ghi lại lịch sử thay đổi:
- **Lưu trữ**: File `audit-logs.service.ts` cho thấy hệ thống lưu lại: người thực hiện (`userId`), hành động (`action`), bảng bị tác động (`tableName`), và cả giá trị trước/sau khi thay đổi (`oldValues`, `newValues`).
- **Ứng dụng**: Điều này cực kỳ quan trọng cho việc bảo mật và tra soát lỗi, cho phép quản trị viên xem lại chính xác ai đã thay đổi giá sách hoặc xóa phiếu mượn vào lúc nào.

---

## 💡 Kết luận
Hệ thống được thiết kế theo tư tưởng **Decoupling** (Tách biệt hoàn toàn). Mỗi dịch vụ có cơ sở dữ liệu và logic riêng, giúp giảm thiểu rủi ro khi một thành phần bị lỗi thì các thành phần khác vẫn hoạt động bình thường qua sự điều phối của API Gateway.
