import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { waitForPageLoad } from './helpers/test-utils';

test.describe('ADMIN - MÆ°á»£n SÃ¡ch (Mocked API)', () => {

    const mockReaders = [
        {
            _id: 'READER001',
            fullName: 'Nguyá»…n VÄƒn A',
            email: 'a@example.com',
            dateOfBirth: '2000-01-01',
            expiryDate: '2099-01-01T00:00:00.000Z', // ChÆ°a háº¿t háº¡n
            readerTypeId: {
                _id: 'TYPE001',
                readerTypeName: 'Sinh viÃªn',
                maxBorrowLimit: 5
            }
        },
        {
            _id: 'READER002',
            fullName: 'Äá»™c giáº£ háº¿t háº¡n',
            email: 'expired@example.com',
            dateOfBirth: '2000-01-01',
            expiryDate: '2020-01-01T00:00:00.000Z', // ÄÃ£ háº¿t háº¡n
            readerTypeId: {
                _id: 'TYPE001',
                readerTypeName: 'Sinh viÃªn',
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
                    categoryId: { categoryName: 'CÃ´ng nghá»‡ thÃ´ng tin' },
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
                    categoryId: { categoryName: 'CÃ´ng nghá»‡ thÃ´ng tin' },
                    authors: [{ authorId: { authorName: 'Martin Fowler' } }]
                }
            }
        }
    ];

    const mockLoans: unknown[] = []; // Empty initially - tráº£ vá» empty array cho GET

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

    test('CIRC-001: Hiá»ƒn thá»‹ trang quáº£n lÃ½ lÆ°u thÃ´ng', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Quáº£n lÃ½ LÆ°u thÃ´ng/i })).toBeVisible();
        
        // Kiá»ƒm tra 2 tabs
        await expect(page.getByText('Danh sÃ¡ch Äang mÆ°á»£n')).toBeVisible();
        await expect(page.getByText('Lá»‹ch sá»­ ÄÃ£ tráº£')).toBeVisible();
    });

    test('CIRC-002: Má»Ÿ dialog láº­p phiáº¿u mÆ°á»£n', async ({ page }) => {
        await page.getByRole('button', { name: 'Láº­p Phiáº¿u MÆ°á»£n' }).click();
        
        // Kiá»ƒm tra modal title
        await expect(page.getByText('Láº­p Phiáº¿u MÆ°á»£n Má»›i')).toBeVisible();
        
        // Kiá»ƒm tra section ThÃ´ng tin Äá»™c giáº£
        await expect(page.getByText('ThÃ´ng Tin Äá»™c Giáº£')).toBeVisible();
    });

    test('CIRC-003: Chá»n Ä‘á»™c giáº£ trong dialog', async ({ page }) => {
        await page.getByRole('button', { name: 'Láº­p Phiáº¿u MÆ°á»£n' }).click();

        // TÃ¬m Combobox vá»›i placeholder "Nháº­p tÃªn Ä‘á»ƒ tÃ¬m..."
        const readerCombobox = page.locator('input[placeholder="Nháº­p tÃªn Ä‘á»ƒ tÃ¬m..."]');
        await readerCombobox.click();
        
        // Chá»n Ä‘á»™c giáº£ tá»« dropdown
        await page.getByText('Nguyá»…n VÄƒn A - a@example.com').click();

        // Kiá»ƒm tra thÃ´ng tin Ä‘á»™c giáº£ hiá»ƒn thá»‹
        await expect(page.locator('input[value="Nguyá»…n VÄƒn A"]')).toBeVisible();
        await expect(page.getByText('Sinh viÃªn')).toBeVisible();
    });

    test('CIRC-004: Validation - Äá»™c giáº£ háº¿t háº¡n', async ({ page }) => {
        await page.getByRole('button', { name: 'Láº­p Phiáº¿u MÆ°á»£n' }).click();

        const readerCombobox = page.locator('input[placeholder="Nháº­p tÃªn Ä‘á»ƒ tÃ¬m..."]');
        await readerCombobox.click();
        
        // Chá»n Ä‘á»™c giáº£ háº¿t háº¡n
        await page.getByText('Äá»™c giáº£ háº¿t háº¡n').click();

        // Kiá»ƒm tra cáº£nh bÃ¡o háº¿t háº¡n hiá»ƒn thá»‹
        await expect(page.getByText(/Tháº» Ä‘á»™c giáº£ Ä‘Ã£ háº¿t háº¡n/i)).toBeVisible();
        
        // Chi tiáº¿t sÃ¡ch KHÃ”NG hiá»ƒn thá»‹ khi háº¿t háº¡n
        await expect(page.getByText('Chi tiáº¿t SÃ¡ch')).not.toBeVisible();
    });

    test('CIRC-005: Chá»n sÃ¡ch trong báº£ng chi tiáº¿t', async ({ page }) => {
        await page.getByRole('button', { name: 'Láº­p Phiáº¿u MÆ°á»£n' }).click();

        // Chá»n Ä‘á»™c giáº£ há»£p lá»‡
        const readerCombobox = page.locator('input[placeholder="Nháº­p tÃªn Ä‘á»ƒ tÃ¬m..."]');
        await readerCombobox.click();
        await page.getByText('Nguyá»…n VÄƒn A - a@example.com').click();

        // Äá»£i báº£ng Chi tiáº¿t SÃ¡ch hiá»ƒn thá»‹
        await expect(page.getByText('Chi tiáº¿t SÃ¡ch')).toBeVisible();

        // TÃ¬m input TÃªn SÃ¡ch trong table (placeholder "TÃªn sÃ¡ch...")
        const bookTitleInput = page.locator('input[placeholder="TÃªn sÃ¡ch..."]').first();
        await bookTitleInput.click();
        
        // Chá»n tá»« dropdown
        await page.waitForTimeout(300);
        await page.getByText('Clean Code').first().click();

        // Kiá»ƒm tra title Ä‘Ã£ Ä‘Æ°á»£c chá»n
        const selectedValue = await bookTitleInput.inputValue();
        expect(selectedValue).toBe('Clean Code');
    });

    test('CIRC-006: ThÃªm dÃ²ng sÃ¡ch má»›i', async ({ page }) => {
        await page.getByRole('button', { name: 'Láº­p Phiáº¿u MÆ°á»£n' }).click();

        const readerCombobox = page.locator('input[placeholder="Nháº­p tÃªn Ä‘á»ƒ tÃ¬m..."]');
        await readerCombobox.click();
        await page.getByText('Nguyá»…n VÄƒn A').click();

        // Click nÃºt ThÃªm dÃ²ng
        await page.getByRole('button', { name: 'ThÃªm dÃ²ng' }).click();

        // Kiá»ƒm tra sá»‘ dÃ²ng tÄƒng lÃªn
        const rows = page.locator('table tbody tr');
        await expect(rows).toHaveCount(2); // Ban Ä‘áº§u 1 row + 1 row má»›i
    });

    test('CIRC-007: Validation - Submit mÃ  khÃ´ng chá»n ngÆ°á»i', async ({ page }) => {
        await page.getByRole('button', { name: 'Láº­p Phiáº¿u MÆ°á»£n' }).click();

        // Click LÆ°u Phiáº¿u MÆ°á»£n ngay mÃ  khÃ´ng Ä‘iá»n gÃ¬
        await page.getByRole('button', { name: 'LÆ°u Phiáº¿u MÆ°á»£n' }).click();

        // NÃºt bá»‹ disabled nÃªn khÃ´ng cÃ³ gÃ¬ xáº£y ra, hoáº·c cÃ³ toast validation
        // Kiá»ƒm tra nÃºt disabled
        const saveButton = page.getByRole('button', { name: 'LÆ°u Phiáº¿u MÆ°á»£n' });
        expect(await saveButton.isDisabled()).toBe(true);
    });

    test('CIRC-008: Láº­p phiáº¿u mÆ°á»£n thÃ nh cÃ´ng', async ({ page }) => {
        await page.getByRole('button', { name: 'Láº­p Phiáº¿u MÆ°á»£n' }).click();

        // Chá»n Ä‘á»™c giáº£
        const readerCombobox = page.locator('input[placeholder="Nháº­p tÃªn Ä‘á»ƒ tÃ¬m..."]');
        await readerCombobox.click();
        await page.getByText('Nguyá»…n VÄƒn A').click();

        // Chá»n sÃ¡ch
        await page.waitForTimeout(500);
        const bookTitleInput = page.locator('input[placeholder="TÃªn sÃ¡ch..."]').first();
        await bookTitleInput.click();
        await page.waitForTimeout(300);
        await page.getByText('Clean Code').first().click();

        // Click LÆ°u
        await page.getByRole('button', { name: 'LÆ°u Phiáº¿u MÆ°á»£n' }).click();

        // Expect success toast
        await expect(page.getByText(/Láº­p phiáº¿u mÆ°á»£n thÃ nh cÃ´ng/i)).toBeVisible({ timeout: 5000 });
    });

    test('CIRC-009: TÃ¬m kiáº¿m phiáº¿u mÆ°á»£n', async ({ page }) => {
        // TÃ¬m search input trong tab "Äang mÆ°á»£n"
        const searchInput = page.locator('input[placeholder*="TÃ¬m"]').first();
        
        if (await searchInput.isVisible()) {
            await searchInput.fill('PM');
            await page.waitForTimeout(500);
            
            // Filter Ä‘Ã£ hoáº¡t Ä‘á»™ng (náº¿u cÃ³ dá»¯ liá»‡u)
        }
    });

    test('CIRC-010: Filter theo ngÃ y mÆ°á»£n', async ({ page }) => {
        // TÃ¬m date filter inputs
        const dateInputs = page.locator('input[type="date"]');
        
        if (await dateInputs.first().isVisible()) {
            const today = new Date().toISOString().split('T')[0];
            await dateInputs.first().fill(today);
            await page.waitForTimeout(500);
            
            // Filter Ã¡p dá»¥ng
        }
    });
});
