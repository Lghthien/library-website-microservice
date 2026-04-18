import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { waitForPageLoad } from './helpers/test-utils';

test.describe('ADMIN - Thu Tiền Phạt (Mocked API)', () => {

    const mockDebtorReaders = [
        {
            _id: 'READER001',
            fullName: 'Nguyễn Văn A',
            email: 'a@example.com',
            totalDebt: 50000,
            address: '123 Test Street'
        },
        {
            _id: 'READER002',
            fullName: 'Trần Thị B',
            email: 'b@example.com',
            totalDebt: 100000,
            address: '456 Another Street'
        }
    ];

    const mockAllReaders = [
        ...mockDebtorReaders,
        {
            _id: 'READER003',
            fullName: 'Lê Văn C',
            email: 'c@example.com',
            totalDebt: 0, // Không nợ
            address: '789 Street'
        }
    ];

    const mockFineReceipts = [
        {
            _id: 'RECEIPT001',
            amountPaid: 30000,
            paymentDate: new Date().toISOString(),
            readerId: {
                _id: 'READER001',
                fullName: 'Nguyễn Văn A'
            }
        }
    ];

    test.beforeEach(async ({ page }) => {
        // Mock Readers API - MUST filter by debt on backend but we simulate here
        await page.route('**/api/readers', async route => {
            // Fines page only shows readers with debt > 0
            await route.fulfill({ json: mockAllReaders });
        });

        // Mock individual reader fetch
        await page.route('**/api/readers/*', async route => {
            const url = route.request().url();
            const id = url.split('/').pop();
            const reader = mockAllReaders.find(r => r._id === id);
            
            if (reader) {
                await route.fulfill({ json: reader });
            } else {
                await route.fulfill({ status: 404 });
            }
        });

        // Mock Fine Receipts
        await page.route('**/api/fine-receipts**', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ json: mockFineReceipts });
            } else if (route.request().method() === 'POST') {
                const data = route.request().postDataJSON();
                const newReceipt = {
                    _id: 'RECEIPT_NEW',
                    ...data,
                    paymentDate: new Date().toISOString()
                };
                await route.fulfill({ status: 201, json: newReceipt });
            }
        });

        await loginAsAdmin(page);
        await page.goto('http://localhost:3000/portal/circulation/fines');
        await waitForPageLoad(page);
    });

    test('FINE-001: Hiển thị danh sách độc giả có nợ', async ({ page }) => {
        // Đợi danh sách load
        await page.waitForTimeout(1000);

        // Kiểm tra hiển thị độc giả có nợ
        await expect(page.getByText('Nguyễn Văn A')).toBeVisible();
        await expect(page.getByText('Trần Thị B')).toBeVisible();
        
        // Kiểm tra số tiền nợ được format
        await expect(page.getByText(/50\.000/)).toBeVisible();
        await expect(page.getByText(/100\.000/)).toBeVisible();
        
        // Độc giả không nợ KHÔNG được hiển thị trong filtered list
        // (do component filters readers với totalDebt > 0)
    });

    test('FINE-002: Tìm kiếm độc giả theo tên', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Tìm input tên độc giả (SearchableInput)
        const nameInput = page.locator('input[placeholder*="Nhập tên độc giả"]').or(
            page.locator('label:has-text("Tên độc giả") + div input')
        ).first();
        
        await nameInput.fill('Nguyễn');
        await page.waitForTimeout(500);

        // Chỉ Nguyễn Văn A hiển thị
        await expect(page.getByText('Nguyễn Văn A')).toBeVisible();
    });

    test('FINE-003: Chọn độc giả để tạo phiếu thu', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Click vào độc giả đầu tiên
        const readerCard = page.locator('button').filter({ hasText: 'Nguyễn Văn A' }).first();
        await readerCard.click();

        // Kiểm tra form phiếu thu hiển thị
        await expect(page.getByText('Phiếu Thu Tiền Phạt')).toBeVisible();
        await expect(page.getByText('Họ tên độc giả:')).toBeVisible();
        await expect(page.getByText('Nguyễn Văn A')).toBeVisible();
        
        // Kiểm tra tổng nợ hiển thị
        await expect(page.getByText('50.000')).toBeVisible();
    });

    test('FINE-004: Validation số tiền thu vượt quá nợ', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Chọn độc giả
        await page.locator('button').filter({ hasText: 'Nguyễn Văn A' }).first().click();

        // Nhập số tiền lớn hơn nợ
        const amountInput = page.locator('input[type="number"]').filter({ hasText: /Số tiền/i }).or(
            page.locator('label:has-text("Số tiền thu") + div input')
        ).first();
        
        // Component tự động giới hạn max = totalDebt
        // Khi nhập 100000 nhưng max là 50000, nó sẽ auto-correct
        await amountInput.fill('100000');
        
        // Value sẽ bị giới hạn về đúng totalDebt
        const value = await amountInput.inputValue();
        expect(parseInt(value || '0')).toBeLessThanOrEqual(50000);
    });

    test('FINE-005: Tạo phiếu thu thành công', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Chọn độc giả
        await page.locator('button').filter({ hasText: 'Nguyễn Văn A' }).first().click();

        // Nhập số tiền hợp lệ
        const amountInput = page.locator('input[placeholder*="Nhập số tiền thu"]').first();
        await amountInput.fill('30000');

        // Click Xác nhận thu
        await page.getByRole('button', { name: 'Xác nhận thu' }).click();

        // Xác nhận trong dialog nếu có
        const confirmButton = page.getByRole('button', { name: /Xác nhận|Đồng ý/i }).last();
        if (await confirmButton.isVisible({ timeout: 1000 })) {
            await confirmButton.click();
        }

        // Expect success toast
        await expect(page.getByText(/Thu tiền thành công/i)).toBeVisible({ timeout: 5000 });
    });

    test('FINE-006: Hiển thị danh sách phiếu thu gần đây', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Kiểm tra sidebar lịch sử
        await expect(page.getByText('Danh sách phiếu thu')).toBeVisible();
        
        // Kiểm tra phiếu thu mock
        await expect(page.getByText('Nguyễn Văn A')).toBeVisible();
        await expect(page.getByText(/30\.000/)).toBeVisible();
    });

    test('FINE-007: Tìm kiếm phiếu thu theo keyword', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Tìm input search trong sidebar receipts
        const searchInput = page.locator('input[placeholder*="Tìm theo tên, email"]').or(
            page.locator('input[placeholder*="Tìm"]')
        ).filter({ hasText: /email|mã phiếu/i }).first();
        
        if (await searchInput.isVisible()) {
            await searchInput.fill('Nguyễn');
            await page.waitForTimeout(500);

            // Kiểm tra kết quả
            await expect(page.getByText('Nguyễn Văn A')).toBeVisible();
        }
    });

    test('FINE-008: Filter phiếu thu theo ngày', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Tìm date inputs
        const startDateInput = page.locator('input[type="date"]').first();
        const endDateInput = page.locator('input[type="date"]').last();
        
        if (await startDateInput.isVisible()) {
            const today = new Date().toISOString().split('T')[0];
            await startDateInput.fill(today);
            await endDateInput.fill(today);
            
            await page.waitForTimeout(1000);

            // Receipts trong khoảng thời gian sẽ hiển thị
            await expect(page.getByText('Nguyễn Văn A')).toBeVisible();
        }
    });

    test('FINE-009: Xóa bộ lọc tìm kiếm độc giả', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Điền filter
        const nameInput = page.locator('input[placeholder*="Nhập tên độc giả"]').first();
        await nameInput.fill('Nguyễn');
        
        // Click nút Xóa bộ lọc
        const clearButton = page.getByRole('button', { name: /Xóa bộ lọc/i });
        await clearButton.click();

        // Input đã được clear
        expect(await nameInput.inputValue()).toBe('');
    });

    test('FINE-010: Hiển thị còn lại sau khi nhập số tiền thu', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Chọn độc giả có nợ 50000
        await page.locator('button').filter({ hasText: 'Nguyễn Văn A' }).first().click();

        // Nhập 20000
        const amountInput = page.locator('input[placeholder*="Nhập số tiền thu"]').first();
        await amountInput.fill('20000');

        // Kiểm tra còn lại = 50000 - 20000 = 30000
        await expect(page.getByText('30.000')).toBeVisible();
        
        // Kiểm tra label "Còn lại"
        await expect(page.getByText('Còn lại:')).toBeVisible();
    });

    test('FINE-011: Thanh toán hết nợ - hiển thị đúng', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Chọn độc giả
        await page.locator('button').filter({ hasText: 'Nguyễn Văn A' }).first().click();

        // Nhập đúng bằng tổng nợ
        const amountInput = page.locator('input[placeholder*="Nhập số tiền thu"]').first();
        await amountInput.fill('50000');

        // Còn lại = 0, hiển thị "Đã thanh toán hết"
        await page.waitForTimeout(300);
        await expect(page.getByText(/Đã thanh toán hết/i)).toBeVisible();
    });
});
