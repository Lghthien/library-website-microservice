import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { waitForPageLoad } from './helpers/test-utils';

test.describe('ADMIN - Mượn Sách (Mocked API)', () => {

    const mockReaders = [
        {
            _id: 'READER001',
            fullName: 'Nguyễn Văn A',
            email: 'a@example.com',
            dateOfBirth: '2000-01-01',
            expiryDate: '2099-01-01T00:00:00.000Z', // Chưa hết hạn
            readerTypeId: {
                _id: 'TYPE001',
                readerTypeName: 'Sinh viên',
                maxBorrowLimit: 5
            }
        },
        {
            _id: 'READER002',
            fullName: 'Độc giả hết hạn',
            email: 'expired@example.com',
            dateOfBirth: '2000-01-01',
            expiryDate: '2020-01-01T00:00:00.000Z', // Đã hết hạn
            readerTypeId: {
                _id: 'TYPE001',
                readerTypeName: 'Sinh viên',
                maxBorrowLimit: 5
            }
        }
    ];

    const mockBookCopies = [
        {
            _id: 'COPY001',
            status: 1, // Available
            bookId: {
                _id: 'BOOK001',
                titleId: {
                    title: 'Clean Code',
                    categoryId: { categoryName: 'Công nghệ thông tin' },
                    authors: [{ authorId: { authorName: 'Robert C. Martin' } }]
                },
                publisher: 'NXB',
                publishYear: 2023,
                price: 100000
            }
        },
        {
            _id: 'COPY002',
            status: 1,
            bookId: {
                _id: 'BOOK002',
                titleId: {
                    title: 'Refactoring',
                    categoryId: { categoryName: 'Công nghệ thông tin' },
                    authors: [{ authorId: { authorName: 'Martin Fowler' } }]
                }
            }
        }
    ];

    const mockLoans: any[] = []; // Empty initially - trả về empty array cho GET

    test.beforeEach(async ({ page }) => {
        // Mock Parameters
        await page.route('**/api/parameters', async route => 
            await route.fulfill({ json: [
                { paramName: 'QD4_MAX_BORROW_QUANTITY', paramValue: '5' },
                { paramName: 'QD4_MAX_BORROW_DAYS', paramValue: '4' },
                { paramName: 'QD_FINE_PER_DAY', paramValue: '1000' }
            ]})
        );

        // Mock Readers
        await page.route('**/api/readers', async route => 
            await route.fulfill({ json: mockReaders })
        );

        // Mock Book Copies
        await page.route('**/api/book-copies', async route => 
            await route.fulfill({ json: mockBookCopies })
        );

        // Mock Loans
        await page.route('**/api/loans', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ json: mockLoans });
            } else if (route.request().method() === 'POST') {
                const data = route.request().postDataJSON();
                await route.fulfill({ 
                    status: 201, 
                    json: { _id: 'LOAN_NEW', ...data } 
                });
            }
        });

        // Mock Loan Details
        await page.route('**/api/loans-details', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ json: [] });
            } else if (route.request().method() === 'POST') {
                await route.fulfill({ status: 201, json: {} });
            }
        });

        await loginAsAdmin(page);
        await page.goto('http://localhost:3000/portal/circulation/loans');
        await waitForPageLoad(page);
    });

    test('CIRC-001: Hiển thị trang quản lý lưu thông', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Quản lý Lưu thông/i })).toBeVisible();
        
        // Kiểm tra 2 tabs
        await expect(page.getByText('Danh sách Đang mượn')).toBeVisible();
        await expect(page.getByText('Lịch sử Đã trả')).toBeVisible();
    });

    test('CIRC-002: Mở dialog lập phiếu mượn', async ({ page }) => {
        await page.getByRole('button', { name: 'Lập Phiếu Mượn' }).click();
        
        // Kiểm tra modal title
        await expect(page.getByText('Lập Phiếu Mượn Mới')).toBeVisible();
        
        // Kiểm tra section Thông tin Độc giả
        await expect(page.getByText('Thông Tin Độc Giả')).toBeVisible();
    });

    test('CIRC-003: Chọn độc giả trong dialog', async ({ page }) => {
        await page.getByRole('button', { name: 'Lập Phiếu Mượn' }).click();

        // Tìm Combobox với placeholder "Nhập tên để tìm..."
        const readerCombobox = page.locator('input[placeholder="Nhập tên để tìm..."]');
        await readerCombobox.click();
        
        // Chọn độc giả từ dropdown
        await page.getByText('Nguyễn Văn A - a@example.com').click();

        // Kiểm tra thông tin độc giả hiển thị
        await expect(page.locator('input[value="Nguyễn Văn A"]')).toBeVisible();
        await expect(page.getByText('Sinh viên')).toBeVisible();
    });

    test('CIRC-004: Validation - Độc giả hết hạn', async ({ page }) => {
        await page.getByRole('button', { name: 'Lập Phiếu Mượn' }).click();

        const readerCombobox = page.locator('input[placeholder="Nhập tên để tìm..."]');
        await readerCombobox.click();
        
        // Chọn độc giả hết hạn
        await page.getByText('Độc giả hết hạn').click();

        // Kiểm tra cảnh báo hết hạn hiển thị
        await expect(page.getByText(/Thẻ độc giả đã hết hạn/i)).toBeVisible();
        
        // Chi tiết sách KHÔNG hiển thị khi hết hạn
        await expect(page.getByText('Chi tiết Sách')).not.toBeVisible();
    });

    test('CIRC-005: Chọn sách trong bảng chi tiết', async ({ page }) => {
        await page.getByRole('button', { name: 'Lập Phiếu Mượn' }).click();

        // Chọn độc giả hợp lệ
        const readerCombobox = page.locator('input[placeholder="Nhập tên để tìm..."]');
        await readerCombobox.click();
        await page.getByText('Nguyễn Văn A - a@example.com').click();

        // Đợi bảng Chi tiết Sách hiển thị
        await expect(page.getByText('Chi tiết Sách')).toBeVisible();

        // Tìm input Tên Sách trong table (placeholder "Tên sách...")
        const bookTitleInput = page.locator('input[placeholder="Tên sách..."]').first();
        await bookTitleInput.click();
        
        // Chọn từ dropdown
        await page.waitForTimeout(300);
        await page.getByText('Clean Code').first().click();

        // Kiểm tra title đã được chọn
        const selectedValue = await bookTitleInput.inputValue();
        expect(selectedValue).toBe('Clean Code');
    });

    test('CIRC-006: Thêm dòng sách mới', async ({ page }) => {
        await page.getByRole('button', { name: 'Lập Phiếu Mượn' }).click();

        const readerCombobox = page.locator('input[placeholder="Nhập tên để tìm..."]');
        await readerCombobox.click();
        await page.getByText('Nguyễn Văn A').click();

        // Click nút Thêm dòng
        await page.getByRole('button', { name: 'Thêm dòng' }).click();

        // Kiểm tra số dòng tăng lên
        const rows = page.locator('table tbody tr');
        await expect(rows).toHaveCount(2); // Ban đầu 1 row + 1 row mới
    });

    test('CIRC-007: Validation - Submit mà không chọn người', async ({ page }) => {
        await page.getByRole('button', { name: 'Lập Phiếu Mượn' }).click();

        // Click Lưu Phiếu Mượn ngay mà không điền gì
        await page.getByRole('button', { name: 'Lưu Phiếu Mượn' }).click();

        // Nút bị disabled nên không có gì xảy ra, hoặc có toast validation
        // Kiểm tra nút disabled
        const saveButton = page.getByRole('button', { name: 'Lưu Phiếu Mượn' });
        expect(await saveButton.isDisabled()).toBe(true);
    });

    test('CIRC-008: Lập phiếu mượn thành công', async ({ page }) => {
        await page.getByRole('button', { name: 'Lập Phiếu Mượn' }).click();

        // Chọn độc giả
        const readerCombobox = page.locator('input[placeholder="Nhập tên để tìm..."]');
        await readerCombobox.click();
        await page.getByText('Nguyễn Văn A').click();

        // Chọn sách
        await page.waitForTimeout(500);
        const bookTitleInput = page.locator('input[placeholder="Tên sách..."]').first();
        await bookTitleInput.click();
        await page.waitForTimeout(300);
        await page.getByText('Clean Code').first().click();

        // Click Lưu
        await page.getByRole('button', { name: 'Lưu Phiếu Mượn' }).click();

        // Expect success toast
        await expect(page.getByText(/Lập phiếu mượn thành công/i)).toBeVisible({ timeout: 5000 });
    });

    test('CIRC-009: Tìm kiếm phiếu mượn', async ({ page }) => {
        // Tìm search input trong tab "Đang mượn"
        const searchInput = page.locator('input[placeholder*="Tìm"]').first();
        
        if (await searchInput.isVisible()) {
            await searchInput.fill('PM');
            await page.waitForTimeout(500);
            
            // Filter đã hoạt động (nếu có dữ liệu)
        }
    });

    test('CIRC-010: Filter theo ngày mượn', async ({ page }) => {
        // Tìm date filter inputs
        const dateInputs = page.locator('input[type="date"]');
        
        if (await dateInputs.first().isVisible()) {
            const today = new Date().toISOString().split('T')[0];
            await dateInputs.first().fill(today);
            await page.waitForTimeout(500);
            
            // Filter áp dụng
        }
    });
});
