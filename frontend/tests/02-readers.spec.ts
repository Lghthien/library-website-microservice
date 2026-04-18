import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { waitForPageLoad } from './helpers/test-utils';

test.describe('ADMIN - Quản Lý Độc Giả (Mocked API)', () => {

    const mockReaderTypes = [
        { _id: 'TYPE001', readerTypeName: 'Sinh viên', maxBorrowLimit: 5, cardValidityMonths: 6 },
        { _id: 'TYPE002', readerTypeName: 'Giảng viên', maxBorrowLimit: 10, cardValidityMonths: 12 }
    ];

    const mockReaders = [
        {
            _id: 'READER001',
            fullName: 'Nguyễn Văn A',
            dateOfBirth: '2000-01-01T00:00:00.000Z',
            address: 'Hà Nội',
            email: 'a@example.com',
            phoneNumber: '0912345678',
            createdDate: '2024-01-01T00:00:00.000Z',
            expiryDate: '2025-07-01T00:00:00.000Z',
            totalDebt: 0,
            readerTypeId: mockReaderTypes[0]
        },
        {
            _id: 'READER002',
            fullName: 'Trần Thị B',
            dateOfBirth: '2002-05-05T00:00:00.000Z',
            address: 'HCM',
            email: 'b@example.com',
            phoneNumber: '0912345679',
            createdDate: '2024-02-01T00:00:00.000Z',
            expiryDate: '2025-08-01T00:00:00.000Z',
            totalDebt: 50000,
            readerTypeId: mockReaderTypes[1]
        }
    ];

    test.beforeEach(async ({ page }) => {
        // Mock Parameters
        await page.route('**/api/parameters/name/QD1_MIN_AGE', async route => 
            await route.fulfill({ json: { paramValue: "18" } })
        );
        await page.route('**/api/parameters/name/QD1_MAX_AGE', async route => 
            await route.fulfill({ json: { paramValue: "55" } })
        );

        // Mock Reader Types
        await page.route('**/api/reader-types', async route => 
            await route.fulfill({ json: mockReaderTypes })
        );

        // Mock Readers
        await page.route('**/api/readers', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ json: mockReaders });
            } else if (route.request().method() === 'POST') {
                const data = route.request().postDataJSON();
                await route.fulfill({ 
                    status: 201, 
                    json: { _id: 'READER_NEW', ...data } 
                });
            }
        });

        // Mock individual reader operations
        await page.route('**/api/readers/*', async route => {
            const method = route.request().method();
            if (method === 'PATCH') {
                await route.fulfill({ status: 200, json: { status: 'ok' } });
            } else if (method === 'DELETE') {
                await route.fulfill({ status: 200, json: { status: 'ok' } });
            } else if (method === 'GET') {
                await route.fulfill({ json: mockReaders[0] });
            }
        });

        // Mock loans check
        await page.route('**/api/loans?readerId=*', async route => 
            await route.fulfill({ json: [] })
        );

        await loginAsAdmin(page);
        await page.goto('http://localhost:3000/portal/readers');
        await waitForPageLoad(page);
    });

    test('READER-001: Hiển thị danh sách độc giả', async ({ page }) => {
        // Đợi table hiển thị
        await expect(page.locator('table')).toBeVisible();
        
        // Kiểm tra dữ liệu mock có hiển thị
        await expect(page.getByText('Nguyễn Văn A')).toBeVisible();
        await expect(page.getByText('Trần Thị B')).toBeVisible();
        await expect(page.getByText('a@example.com')).toBeVisible();
        
        // Kiểm tra format tiền nợ
        await expect(page.getByText('50.000đ')).toBeVisible();
    });

    test('READER-002: Mở dialog lập thẻ độc giả', async ({ page }) => {
        await page.getByRole('button', { name: 'Lập thẻ độc giả' }).click();
        
        // Kiểm tra dialog title
        await expect(page.locator('text=Lập Thẻ Độc giả (BM1)')).toBeVisible();
        
        // Kiểm tra các trường nhập liệu
        await expect(page.locator('#readerName')).toBeVisible();
        await expect(page.locator('#dob')).toBeVisible();
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#phoneNumber')).toBeVisible();
        await expect(page.locator('#address')).toBeVisible();
    });

    test('READER-003: Validation tuổi QĐ1 - Quá trẻ', async ({ page }) => {
        await page.getByRole('button', { name: 'Lập thẻ độc giả' }).click();

        // Điền thông tin với tuổi < 18
        await page.locator('#readerName').fill('Học sinh nhỏ');
        await page.locator('#dob').fill('2015-01-01'); // 9 tuổi
        await page.locator('#email').fill('child@example.com');
        await page.locator('#phoneNumber').fill('0909090909');
        await page.locator('#address').fill('Test Address');

        // Chọn loại độc giả
        await page.locator('button[role="combobox"]').click();
        await page.getByText('Sinh viên').click();

        await page.getByRole('button', { name: 'Lập thẻ' }).click();

        // Expect Toast Error về tuổi
        await expect(page.getByText(/Độc giả phải từ 18 đến 55 tuổi/i)).toBeVisible();
    });

    test('READER-004: Validation tuổi QĐ1 - Quá già', async ({ page }) => {
        await page.getByRole('button', { name: 'Lập thẻ độc giả' }).click();

        await page.locator('#readerName').fill('Người cao tuổi');
        await page.locator('#dob').fill('1960-01-01'); // 64 tuổi
        await page.locator('#email').fill('old@example.com');
        await page.locator('#phoneNumber').fill('0909090909');
        await page.locator('#address').fill('Test Address');

        await page.locator('button[role="combobox"]').click();
        await page.getByText('Sinh viên').click();

        await page.getByRole('button', { name: 'Lập thẻ' }).click();

        await expect(page.getByText(/Độc giả phải từ 18 đến 55 tuổi/i)).toBeVisible();
    });

    test('READER-005: Tạo độc giả thành công với tuổi hợp  lệ', async ({ page }) => {
        await page.getByRole('button', { name: 'Lập thẻ độc giả' }).click();

        // Điền thông tin hợp lệ
        await page.locator('#readerName').fill('Độc giả mới');
        await page.locator('#dob').fill('2000-01-01'); // 24 tuổi
        await page.locator('#email').fill('new@example.com');
        await page.locator('#phoneNumber').fill('0909090909');
        await page.locator('#address').fill('123 Test Street');

        // Chọn loại độc giả
        await page.locator('button[role="combobox"]').click();
        await page.getByText('Sinh viên').click();

        await page.getByRole('button', { name: 'Lập thẻ' }).click();

        // Expect success toast
        await expect(page.getByText(/Lập thẻ độc giả thành công/i)).toBeVisible();
    });

    test('READER-006: Validation email không đúng định dạng', async ({ page }) => {
        await page.getByRole('button', { name: 'Lập thẻ độc giả' }).click();

        await page.locator('#readerName').fill('Test User');
        await page.locator('#dob').fill('2000-01-01');
        await page.locator('#email').fill('invalid-email'); // Email không hợp lệ
        await page.locator('#phoneNumber').fill('0909090909');
        await page.locator('#address').fill('Test');

        await page.locator('button[role="combobox"]').click();
        await page.getByText('Sinh viên').click();

        await page.getByRole('button', { name: 'Lập thẻ' }).click();

        // Expect validation error
        await expect(page.getByText(/Email không hợp lệ/i)).toBeVisible();
    });

    test('READER-007: Tìm kiếm độc giả theo tên', async ({ page }) => {
        // Tìm input search với placeholder chứa "Tên"
        const searchInput = page.locator('input').filter({ hasText: /Tên/i }).or(
            page.locator('input[placeholder*="Tên"]')
        ).first();
        
        await searchInput.fill('Nguyễn');
        
        // Đợi kết quả filter
        await page.waitForTimeout(500);
        
        // Kiểm tra chỉ "Nguyễn Văn A" hiển thị
        await expect(page.getByText('Nguyễn Văn A')).toBeVisible();
    });

    test('READER-008: Xóa độc giả', async ({ page }) => {
        // Click vào menu hành động của độc giả đầu tiên
        await page.locator('button[role="button"]').filter({ has: page.locator('svg') }).first().click();
        
        // Click nút xóa
        await page.getByText(/Xóa độc giả/i).click();
        
        // Confirm deletion
        await page.getByRole('button', { name: /Xóa/i }).click();
        
        // Expect success
        await expect(page.getByText(/Xóa độc giả thành công/i)).toBeVisible();
    });
});
