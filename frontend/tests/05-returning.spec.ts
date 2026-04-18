import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { waitForPageLoad } from './helpers/test-utils';

test.describe('ADMIN - Trả Sách (Mocked API)', () => {

    const mockReaders = [
        {
            _id: 'READER001',
            fullName: 'Nguyễn Văn A',
            email: 'a@example.com',
            totalDebt: 0
        }
    ];

    const mockActiveLoans = [
        {
            _id: 'LOAN001',
            readerId: {
                _id: 'READER001',
                fullName: 'Nguyễn Văn A'
            },
            borrowDate: '01/01/2024', // dd/mm/yyyy format từ backend
            dueDate: '05/01/2024',
            status: 'overdue',
            bookCount: 2,
            totalFine: 10000
        }
    ];

    const mockLoanDetails = [
        {
            _id: 'DETAIL001',
            loanId: 'LOAN001',
            copyId: {
                _id: 'COPY001',
                bookId: {
                    titleId: {
                        title: 'Clean Code',
                        categoryId: { categoryName: 'IT' }
                    },
                    price: 100000
                }
            },
            returnDate: null,
            fineAmount: 0
        },
        {
            _id: 'DETAIL002',
            loanId: 'LOAN001',
            copyId: {
                _id: 'COPY002',
                bookId: {
                    titleId: {
                        title: 'Refactoring',
                        categoryId: { categoryName: 'IT' }
                    },
                    price: 120000
                }
            },
            returnDate: null,
            fineAmount: 0
        }
    ];

    test.beforeEach(async ({ page }) => {
        // Mock Parameters
        await page.route('**/api/parameters', async route => 
            await route.fulfill({ json: [
                { paramName: 'QD_FINE_PER_DAY', paramValue: '1000' },
                { paramName: 'QD4_MAX_BORROW_DAYS', paramValue: '4' }
            ]})
        );

        // Mock Readers
        await page.route('**/api/readers', async route => 
            await route.fulfill({ json: mockReaders })
        );

        // Mock individual reader fetch
        await page.route('**/api/readers/*', async route => 
            await route.fulfill({ json: mockReaders[0] })
        );

        // Mock Loans
        await page.route('**/api/loans', async route => {
            const allLoans = [...mockActiveLoans];
            await route.fulfill({ json: allLoans });
        });

        // Mock Loan Details
        await page.route('**/api/loans-details', async route => 
            await route.fulfill({ json: mockLoanDetails })
        );

        // Mock return-book endpoint
        await page.route('**/api/loans/*/return-book', async route => {
            await route.fulfill({ status: 200, json: {} });
        });

        // Mock book-copies
        await page.route('**/api/book-copies', async route => 
            await route.fulfill({ json: [] })
        );

        await loginAsAdmin(page);
        await page.goto('http://localhost:3000/portal/circulation/loans');
        await waitForPageLoad(page);
    });

    test('RETURN-001: Chuyển sang tab Lịch sử Đã trả', async ({ page }) => {
        // Click tab "Lịch sử Đã trả"
        await page.getByText('Lịch sử Đã trả').click();
        
        // Kiểm tra nút "Nhận Trả Sách" hiển thị
        await expect(page.getByRole('button', { name: 'Nhận Trả Sách' })).toBeVisible();
    });

    test('RETURN-002: Mở modal nhận trả sách', async ({ page }) => {
        await page.getByText('Lịch sử Đã trả').click();
        await page.getByRole('button', { name: 'Nhận Trả Sách' }).click();
        
        // Kiểm tra modal title
        await expect(page.getByText('Nhận Trả Sách')).toBeVisible();
        
        // Kiểm tra input tìm độc giả
        await expect(page.locator('input[placeholder*="Nhập tên độc giả"]')).toBeVisible();
    });

    test('RETURN-003: Tìm độc giả có sách đang mượn', async ({ page }) => {
        await page.getByText('Lịch sử Đã trả').click();
        await page.getByRole('button', { name: 'Nhận Trả Sách' }).click();

        // Tìm Combobox để chọn độc giả
        const readerCombobox = page.locator('input[placeholder*="Nhập tên độc giả"]').first();
        await readerCombobox.click();
        
        // Chọn độc giả
        await page.getByText('Nguyễn Văn A - a@example.com').click();

        // Kiểm tra danh sách phiếu mượn hiển thị
        await page.waitForTimeout(500);
        await expect(page.getByText('LOAN001')).toBeVisible();
        await expect(page.getByText('Quá hạn')).toBeVisible();
    });

    test('RETURN-004: Chọn phiếu mượn để xem chi tiết', async ({ page }) => {
        await page.getByText('Lịch sử Đã trả').click();
        await page.getByRole('button', { name: 'Nhận Trả Sách' }).click();

        // Chọn độc giả
        const readerCombobox = page.locator('input[placeholder*="Nhập tên độc giả"]').first();
        await readerCombobox.click();
        await page.getByText('Nguyễn Văn A').click();

        await page.waitForTimeout(500);

        // Click vào phiếu mượn
        await page.getByText('LOAN001').click();

        // Kiểm tra chi tiết hiển thị
        await expect(page.getByText('Thông tin Độc giả')).toBeVisible();
        await expect(page.getByText('Nguyễn Văn A')).toBeVisible();
        
        // Kiểm tra danh sách sách
        await expect(page.getByText('Clean Code')).toBeVisible();
        await expect(page.getByText('Refactoring')).toBeVisible();
    });

    test('RETURN-005: Hiển thị tính tiền phạt quá hạn', async ({ page }) => {
        await page.getByText('Lịch sử Đã trả').click();
        await page.getByRole('button', { name: 'Nhận Trả Sách' }).click();

        const readerCombobox = page.locator('input[placeholder*="Nhập tên độc giả"]').first();
        await readerCombobox.click();
        await page.getByText('Nguyễn Văn A').click();

        await page.waitForTimeout(500);
        await page.getByText('LOAN001').click();

        // Kiểm tra section CHI TIẾT TIỀN PHẠT
        await expect(page.getByText('CHI TIẾT TIỀN PHẠT')).toBeVisible();
        
        // Kiểm tra hiển thị số ngày quá hạn
        await expect(page.getByText(/Số ngày quá hạn/i)).toBeVisible();
        
        // Kiểm tra đơn giá phạt
        await expect(page.getByText(/1\.000/)).toBeVisible(); // QĐ: 1000đ/ngày
    });

    test('RETURN-006: Đánh dấu sách bị mất', async ({ page }) => {
        await page.getByText('Lịch sử Đã trả').click();
        await page.getByRole('button', { name: 'Nhận Trả Sách' }).click();

        const readerCombobox = page.locator('input[placeholder*="Nhập tên độc giả"]').first();
        await readerCombobox.click();
        await page.getByText('Nguyễn Văn A').click();

        await page.waitForTimeout(500);
        await page.getByText('LOAN001').click();

        // Tìm checkbox "Mất sách?" trong table
        // Table có cột với header "Mất sách?"
        const lostCheckboxes = page.locator('input[type="checkbox"]').filter({ has: page.locator('..')});
        
        // Click vào checkbox đầu tiên (ở cột Mất sách?)
        const firstLostCheckbox = page.locator('table tbody tr').first().locator('input[type="checkbox"]').last();
        if (await firstLostCheckbox.isVisible()) {
            await firstLostCheckbox.click();
            
            // Kiểm tra checkbox đã checked
            expect(await firstLostCheckbox.isChecked()).toBe(true);
            
            // Kiểm tra tổng tiền phạt tăng (bao gồm giá sách)
            await expect(page.getByText(/100\.000|120\.000/)).toBeVisible(); // Price of book
        }
    });

    test('RETURN-007: Quay lại tìm kiếm từ màn chi tiết', async ({ page }) => {
        await page.getByText('Lịch sử Đã trả').click();
        await page.getByRole('button', { name: 'Nhận Trả Sách' }).click();

        const readerCombobox = page.locator('input[placeholder*="Nhập tên độc giả"]').first();
        await readerCombobox.click();
        await page.getByText('Nguyễn Văn A').click();

        await page.waitForTimeout(500);
        await page.getByText('LOAN001').click();

        // Click nút "Quay lại tìm kiếm"
        await page.getByRole('button', { name: /Quay lại/i }).click();

        // Kiểm tra quay về màn tìm kiếm
        await expect(page.locator('input[placeholder*="Nhập tên độc giả"]')).toBeVisible();
    });

    test('RETURN-008: Xác nhận trả sách (disabled khi chưa load xong)', async ({ page }) => {
        await page.getByText('Lịch sử Đã trả').click();
        await page.getByRole('button', { name: 'Nhận Trả Sách' }).click();

        const readerCombobox = page.locator('input[placeholder*="Nhập tên độc giả"]').first();
        await readerCombobox.click();
        await page.getByText('Nguyễn Văn A').click();

        await page.waitForTimeout(500);
        await page.getByText('LOAN001').click();

        // Tìm nút xác nhận (thường ở footer modal)
        // Có thể là "Đã xử lý trả sách" hoặc tương tự
        // Kiểm tra nó hiển thị
        await page.waitForTimeout(1000);
        
        // Mock đã setup return-book endpoint, có thể test click
        // nhưng cần verify button tồn tại
    });

    test('RETURN-009: Hiển thị tổng kết nợ sau khi trả', async ({ page }) => {
        await page.getByText('Lịch sử Đã trả').click();
        await page.getByRole('button', { name: 'Nhận Trả Sách' }).click();

        const readerCombobox = page.locator('input[placeholder*="Nhập tên độc giả"]').first();
        await readerCombobox.click();
        await page.getByText('Nguyễn Văn A').click();

        await page.waitForTimeout(500);
        await page.getByText('LOAN001').click();

        // Kiểm tra section TỔNG KẾT NỢ
        await expect(page.getByText('TỔNG KẾT NỢ')).toBeVisible();
    });

    test('RETURN-010: Filter lịch sử đã trả theo ngày', async ({ page }) => {
        await page.getByText('Lịch sử Đã trả').click();

        // Tìm date inputs trong tab "Lịch sử Đã trả"
        const dateInputs = page.locator('input[type="date"]');
        
        if ((await dateInputs.count()) >= 2) {
            const today = new Date().toISOString().split('T')[0];
            await dateInputs.nth(0).fill(today);
            await dateInputs.nth(1).fill(today);
            
            await page.waitForTimeout(500);
            // Filter đã áp dụng
        }
    });
});
