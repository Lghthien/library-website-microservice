import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { waitForPageLoad } from './helpers/test-utils';

test.describe('ADMIN - Quản Lý Sách (Mocked API)', () => {

    const mockCategories = [
        { _id: 'CAT001', categoryName: 'Khoa học' },
        { _id: 'CAT002', categoryName: 'Văn học' },
        { _id: 'CAT003', categoryName: 'Thiếu nhi' }
    ];

    const mockAuthors = [
        { _id: 'AUTH001', authorName: 'Nguyễn Nhật Ánh' },
        { _id: 'AUTH002', authorName: 'Ngô Tất Tố' }
    ];

    const mockTitleBooks = [
        { _id: 'TITLE001', title: 'Cho tôi xin một vé đi tuổi thơ', categoryId: 'CAT002' },
        { _id: 'TITLE002', title: 'Tắt đèn', categoryId: 'CAT002' }
    ];

    const mockBooks = [
        { _id: 'BOOK001', titleId: 'TITLE001', publisher: 'NXB Trẻ', publishYear: 2023, price: 50000, importDate: '2024-01-01' },
        { _id: 'BOOK002', titleId: 'TITLE002', publisher: 'NXB Kim Đồng', publishYear: 2022, price: 75000, importDate: '2024-01-01' }
    ];

    const mockBookCopies = [
        { _id: 'COPY001', bookId: 'BOOK001', status: 1 },
        { _id: 'COPY002', bookId: 'BOOK001', status: 1 },
        { _id: 'COPY003', bookId: 'BOOK002', status: 0 }
    ];

    const mockTitleAuthors = [
        { _id: 'TA001', titleId: 'TITLE001', authorId: 'AUTH001' },
        { _id: 'TA002', titleId: 'TITLE002', authorId: 'AUTH002' }
    ];

    const currentYear = new Date().getFullYear();
    const minPublishYear = currentYear - 8; // QĐ2 default

    test.beforeEach(async ({ page }) => {
        // Mock Parameters (QĐ2)
        await page.route('**/api/parameters*', async route => 
            await route.fulfill({ json: [{ paramName: 'QD2_PUBLISH_YEAR_DISTANCE', paramValue: '8' }] })
        );

        // Mock Categories
        await page.route('**/api/categories', async route => 
            await route.fulfill({ json: mockCategories })
        );

        // Mock Authors
        await page.route('**/api/authors', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ json: mockAuthors });
            } else if (route.request().method() === 'POST') {
                const data = route.request().postDataJSON();
                await route.fulfill({ status: 201, json: { _id: 'AUTH_NEW', ...data } });
            }
        });

        // Mock Title Books
        await page.route('**/api/title-books', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ json: mockTitleBooks });
            } else if (route.request().method() === 'POST') {
                const data = route.request().postDataJSON();
                await route.fulfill({ status: 201, json: { _id: 'TITLE_NEW', ...data } });
            }
        });

        // Mock Title-Authors
        await page.route('**/api/title-authors', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ json: mockTitleAuthors });
            } else if (route.request().method() === 'POST') {
                await route.fulfill({ status: 201, json: {} });
            }
        });

        // Mock Books
        await page.route('**/api/books', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ json: mockBooks });
            } else if (route.request().method() === 'POST') {
                const data = route.request().postDataJSON();
                await route.fulfill({ status: 201, json: { _id: 'BOOK_NEW', ...data } });
            }
        });

        // Mock Book Copies
        await page.route('**/api/book-copies', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ json: mockBookCopies });
            } else if (route.request().method() === 'POST') {
                await route.fulfill({ status: 201, json: {} });
            }
        });

        // Mock individual operations
        await page.route('**/api/title-books/*', async route => {
            if (route.request().method() === 'PATCH') {
                await route.fulfill({ status: 200, json: {} });
            } else if (route.request().method() === 'DELETE') {
                await route.fulfill({ status: 200, json: {} });
            }
        });

        await loginAsAdmin(page);
        await page.goto('http://localhost:3000/portal/books');
        await waitForPageLoad(page);
    });

    test('BOOK-001: Hiển thị danh sách sách', async ({ page }) => {
        // Đợi table hiển thị
        await expect(page.locator('table')).toBeVisible();
        
        // Kiểm tra tiêu đề trang
        await expect(page.getByText('Kho sách hiện có')).toBeVisible();
    });

    test('BOOK-002: Mở dialog tiếp nhận sách', async ({ page }) => {
        await page.getByRole('button', { name: 'Tiếp nhận sách' }).click();
        
        // Kiểm tra dialog title
        await expect(page.locator('text=Tiếp nhận sách mới (BM2)')).toBeVisible();
        
        // Kiểm tra các trường
        await expect(page.locator('#bookName')).toBeVisible();
        await expect(page.locator('#publishYear')).toBeVisible();
        await expect(page.locator('#price')).toBeVisible();
        await expect(page.locator('#author')).toBeVisible();
        await expect(page.locator('#category')).toBeVisible();
    });

    test('BOOK-003: Validation form rỗng', async ({ page }) => {
        await page.getByRole('button', { name: 'Tiếp nhận sách' }).click();

        // Click Lưu ngay mà không điền gì
        await page.getByRole('button', { name: 'Lưu thông tin' }).click();

        // Expect validation toast
        await expect(page.getByText(/Vui lòng nhập tên sách/i)).toBeVisible();
    });

    test('BOOK-004: Validation QĐ2 - Năm xuất bản quá cũ', async ({ page }) => {
        await page.getByRole('button', { name: 'Tiếp nhận sách' }).click();

        // Điền thông tin với năm quá cũ
        await page.locator('#bookName').fill('Sách cũ');
        const oldYear = currentYear - 10; // Quá 8 năm
        await page.locator('#publishYear').fill(oldYear.toString());
        await page.locator('#price').fill('50000');
        await page.locator('#publisher').fill('NXB Test');
        
        // Chọn category qua SearchableInput
        await page.locator('#category').fill('Khoa học');
        await page.waitForTimeout(300);
        await page.getByText('Khoa học').first().click();
        
        // Chọn author
        await page.locator('#author').fill('Nguyễn Nhật Ánh');
        await page.waitForTimeout(300);
        await page.getByText('Nguyễn Nhật Ánh').first().click();

        await page.getByRole('button', { name: 'Lưu thông tin' }).click();

        // Expect QĐ2 validation
        await expect(page.getByText(new RegExp(`Năm xuất bản phải từ ${minPublishYear}`, 'i'))).toBeVisible();
    });

    test('BOOK-005: Validation QĐ2 - Năm xuất bản tương lai', async ({ page }) => {
        await page.getByRole('button', { name: 'Tiếp nhận sách' }).click();

        await page.locator('#bookName').fill('Sách tương lai');
        const futureYear = currentYear + 1;
        await page.locator('#publishYear').fill(futureYear.toString());
        await page.locator('#price').fill('50000');
        await page.locator('#publisher').fill('NXB Test');
        
        await page.locator('#category').fill('Văn học');
        await page.waitForTimeout(300);
        await page.getByText('Văn học').first().click();
        
        await page.locator('#author').fill('Ngô Tất Tố');
        await page.waitForTimeout(300);
        await page.getByText('Ngô Tất Tố').first().click();

        await page.getByRole('button', { name: 'Lưu thông tin' }).click();

        await expect(page.getByText(new RegExp(`Năm xuất bản phải từ.*đến ${currentYear}`, 'i'))).toBeVisible();
    });

    test('BOOK-006: Validation giá sách âm', async ({ page }) => {
        await page.getByRole('button', { name: 'Tiếp nhận sách' }).click();

        await page.locator('#bookName').fill('Test Book');
        await page.locator('#publishYear').fill(currentYear.toString());
        
        // Thử nhập giá âm - CurrencyInput component sẽ block
        const priceInput = page.locator('#price');
        await priceInput.fill('-50000');
        
        // Giá trị input không được chấp nhận số âm
        const value = await priceInput.inputValue();
        expect(value).not.toContain('-');
    });

    test('BOOK-007: Tạo sách mới thành công', async ({ page }) => {
        await page.getByRole('button', { name: 'Tiếp nhận sách' }).click();

        // Điền thông tin hợp lệ
        await page.locator('#bookName').fill('Sách mới test');
        await page.locator('#publishYear').fill(currentYear.toString());
        await page.locator('#price').fill('100000');
        await page.locator('#publisher').fill('NXB Giáo dục');
        
        // Chọn category
        await page.locator('#category').fill('Thiếu nhi');
        await page.waitForTimeout(300);
        await page.getByText('Thiếu nhi').first().click();
        
        // Nhập author mới
        await page.locator('#author').fill('Tác giả mới');

        // Số lượng
        // Tìm input quantity nếu có
        const quantityInput = page.locator('input[type="number"]').filter({ hasText: /Số lượng/i }).or(
            page.locator('label:has-text("Số lượng") + input')
        ).first();
        if (await quantityInput.isVisible()) {
            await quantityInput.fill('2');
        }

        await page.getByRole('button', { name: 'Lưu thông tin' }).click();

        // Xác nhận trong dialog confirmation
        const confirmButton = page.getByRole('button', { name: 'Lưu' }).last();
        if (await confirmButton.isVisible({ timeout: 2000 })) {
            await confirmButton.click();
        }

        // Expect success
        await expect(page.getByText(/thành công/i)).toBeVisible({ timeout: 5000 });
    });

    test('BOOK-008: Tìm kiếm sách theo tên', async ({ page }) => {
        // Tìm search input
        const searchInput = page.locator('input[placeholder*="Tra cứu"]').or(
            page.locator('input[placeholder*="Tìm kiếm"]')
        ).first();
        
        if (await searchInput.isVisible()) {
            await searchInput.fill('Cho tôi');
            await page.waitForTimeout(500);
            
            // Kiểm tra filter đã hoạt động
            await expect(page.getByText('Cho tôi xin một vé đi tuổi thơ')).toBeVisible();
        }
    });

    test('BOOK-009: SearchableInput cho category hoạt động', async ({ page }) => {
        await page.getByRole('button', { name: 'Tiếp nhận sách' }).click();

        const categoryInput = page.locator('#category');
        await categoryInput.fill('Khoa');
        
        // Đợi dropdown xuất hiện
        await page.waitForTimeout(300);
        
        // Kiểm tra dropdown có "Khoa học"
        const dropdown = page.locator('div.absolute.z-10');
        await expect(dropdown.getByText('Khoa học')).toBeVisible();
    });

    test('BOOK-010: SearchableInput cho author hoạt động', async ({ page }) => {
        await page.getByRole('button', { name: 'Tiếp nhận sách' }).click();

        const authorInput = page.locator('#author');
        await authorInput.fill('Nguyễn');
        
        await page.waitForTimeout(300);
        
        // Kiểm tra dropdown
        const dropdown = page.locator('div.absolute.z-10');
        await expect(dropdown.getByText('Nguyễn Nhật Ánh')).toBeVisible();
    });
});
