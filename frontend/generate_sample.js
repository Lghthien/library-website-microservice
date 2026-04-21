/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const XLSX = require('xlsx');
const path = require('path');

// 1. Dá»¯ liá»‡u SÃ¡ch (Books)
// Using standard categories from seed: Thá»ƒ loáº¡i A, Thá»ƒ loáº¡i B, Thá»ƒ loáº¡i C
const booksData = [
    ["Title", "Author", "Category", "Price", "Quantity", "Publisher", "PublishYear"],
    ["Táº¯t ÄÃ¨n", "NgÃ´ Táº¥t Tá»‘", "Thá»ƒ loáº¡i A", 65000, 10, "NXB VÄƒn Há»c", 2019],
    ["Sá»‘ Äá»", "VÅ© Trá»ng Phá»¥ng", "Thá»ƒ loáº¡i B", 85000, 15, "NXB VÄƒn Há»c", 2020],
    ["LÃ£o Háº¡c", "Nam Cao", "Thá»ƒ loáº¡i C", 45000, 20, "NXB Kim Äá»“ng", 2018],
    ["Dáº¿ MÃ¨n PhiÃªu LÆ°u KÃ½", "TÃ´ HoÃ i", "Thá»ƒ loáº¡i A", 50000, 25, "NXB Kim Äá»“ng", 2021],
    ["Äáº¥t Rá»«ng PhÆ°Æ¡ng Nam", "ÄoÃ n Giá»i", "Thá»ƒ loáº¡i B", 90000, 12, "NXB Kim Äá»“ng", 2017]
];

// 2. Dá»¯ liá»‡u Äá»™c giáº£ (Readers)
// Only using "Loáº¡i X" and "Loáº¡i Y" as requested and matched with seed data
const readersData = [
    ["FullName", "Email", "Phone", "Address", "DOB", "Type"],
    ["Nguyá»…n VÄƒn An", "user_an_new@test.com", "0901234567", "123 LÃª Lá»£i, TP.HCM", "2000-01-01", "Loáº¡i X"],
    ["Tráº§n Thá»‹ BÃ¬nh", "user_binh_new@test.com", "0902345678", "456 Nguyá»…n Huá»‡, TP.HCM", "1995-05-15", "Loáº¡i Y"],
    ["LÃª VÄƒn CÆ°á»ng", "user_cuong_new@test.com", "0903456789", "789 Äiá»‡n BiÃªn Phá»§, TP.HCM", "2003-11-20", "Loáº¡i X"],
    ["Pháº¡m Thá»‹ Dung", "user_dung_new@test.com", "0904567890", "321 Hai BÃ  TrÆ°ng, TP.HCM", "1990-08-10", "Loáº¡i Y"],
    ["HoÃ ng VÄƒn Em", "user_em_new@test.com", "0905678901", "654 CÃ¡ch Máº¡ng ThÃ¡ng 8, TP.HCM", "2002-03-30", "Loáº¡i X"]
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
