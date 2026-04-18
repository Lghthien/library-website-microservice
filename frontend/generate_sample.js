const XLSX = require('xlsx');
const path = require('path');

// 1. Dữ liệu Sách (Books)
// Using standard categories from seed: Thể loại A, Thể loại B, Thể loại C
const booksData = [
    ["Title", "Author", "Category", "Price", "Quantity", "Publisher", "PublishYear"],
    ["Tắt Đèn", "Ngô Tất Tố", "Thể loại A", 65000, 10, "NXB Văn Học", 2019],
    ["Số Đỏ", "Vũ Trọng Phụng", "Thể loại B", 85000, 15, "NXB Văn Học", 2020],
    ["Lão Hạc", "Nam Cao", "Thể loại C", 45000, 20, "NXB Kim Đồng", 2018],
    ["Dế Mèn Phiêu Lưu Ký", "Tô Hoài", "Thể loại A", 50000, 25, "NXB Kim Đồng", 2021],
    ["Đất Rừng Phương Nam", "Đoàn Giỏi", "Thể loại B", 90000, 12, "NXB Kim Đồng", 2017]
];

// 2. Dữ liệu Độc giả (Readers)
// Only using "Loại X" and "Loại Y" as requested and matched with seed data
const readersData = [
    ["FullName", "Email", "Phone", "Address", "DOB", "Type"],
    ["Nguyễn Văn An", "user_an_new@test.com", "0901234567", "123 Lê Lợi, TP.HCM", "2000-01-01", "Loại X"],
    ["Trần Thị Bình", "user_binh_new@test.com", "0902345678", "456 Nguyễn Huệ, TP.HCM", "1995-05-15", "Loại Y"],
    ["Lê Văn Cường", "user_cuong_new@test.com", "0903456789", "789 Điện Biên Phủ, TP.HCM", "2003-11-20", "Loại X"],
    ["Phạm Thị Dung", "user_dung_new@test.com", "0904567890", "321 Hai Bà Trưng, TP.HCM", "1990-08-10", "Loại Y"],
    ["Hoàng Văn Em", "user_em_new@test.com", "0905678901", "654 Cách Mạng Tháng 8, TP.HCM", "2002-03-30", "Loại X"]
];

// Function to create and save a workbook
const createExcelFile = (data, sheetName, fileName) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    const outputPath = path.resolve(__dirname, fileName);
    XLSX.writeFile(wb, outputPath);
    console.log(`Successfully created: ${outputPath}`);
};

// Execute
try {
    createExcelFile(booksData, "Books", "sample_books.xlsx");
    createExcelFile(readersData, "Readers", "sample_readers.xlsx");
    console.log("Done!");
} catch (error) {
    console.error("Error creating files:", error);
}
