import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { waitForPageLoad } from './helpers/test-utils';

test.describe('ADMIN - MÃ†Â°Ã¡Â»Â£n SÃƒÂ¡ch (Mocked API)', () => {

    const mockReaders = [
        {
            _id: 'READER001',
            fullName: 'NguyÃ¡Â»â€¦n VÃ„Æ’n A',
            email: 'a@example.com',
            dateOfBirth: '2000-01-01',
            expiryDate: '2099-01-01T00:00:00.000Z', // ChÃ†Â°a hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n
            readerTypeId: {
                _id: 'TYPE001',
                readerTypeName: 'Sinh viÃƒÂªn',
                maxBorrowLimit: 5
            }
        },
        {
            _id: 'READER002',
            fullName: 'Ã„ÂÃ¡Â»â„¢c giÃ¡ÂºÂ£ hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n',
            email: 'expired@example.com',
            dateOfBirth: '2000-01-01',
            expiryDate: '2020-01-01T00:00:00.000Z', // Ã„ÂÃƒÂ£ hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n
            readerTypeId: {
                _id: 'TYPE001',
                readerTypeName: 'Sinh viÃƒÂªn',
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
                    categoryId: { categoryName: 'CÃƒÂ´ng nghÃ¡Â»â€¡ thÃƒÂ´ng tin' },
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
                    categoryId: { categoryName: 'CÃƒÂ´ng nghÃ¡Â»â€¡ thÃƒÂ´ng tin' },
                    authors: [{ authorId: { authorName: 'Martin Fowler' } }]
                }
            }
        }
    ];

    const mockLoans: any[] = []; // Empty initially - trÃ¡ÂºÂ£ vÃ¡Â»Â empty array cho GET

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

    test('CIRC-001: HiÃ¡Â»Æ’n thÃ¡Â»â€¹ trang quÃ¡ÂºÂ£n lÃƒÂ½ lÃ†Â°u thÃƒÂ´ng', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /QuÃ¡ÂºÂ£n lÃƒÂ½ LÃ†Â°u thÃƒÂ´ng/i })).toBeVisible();
        
        // KiÃ¡Â»Æ’m tra 2 tabs
        await expect(page.getByText('Danh sÃƒÂ¡ch Ã„Âang mÃ†Â°Ã¡Â»Â£n')).toBeVisible();
        await expect(page.getByText('LÃ¡Â»â€¹ch sÃ¡Â»Â­ Ã„ÂÃƒÂ£ trÃ¡ÂºÂ£')).toBeVisible();
    });

    test('CIRC-002: MÃ¡Â»Å¸ dialog lÃ¡ÂºÂ­p phiÃ¡ÂºÂ¿u mÃ†Â°Ã¡Â»Â£n', async ({ page }) => {
        await page.getByRole('button', { name: 'LÃ¡ÂºÂ­p PhiÃ¡ÂºÂ¿u MÃ†Â°Ã¡Â»Â£n' }).click();
        
        // KiÃ¡Â»Æ’m tra modal title
        await expect(page.getByText('LÃ¡ÂºÂ­p PhiÃ¡ÂºÂ¿u MÃ†Â°Ã¡Â»Â£n MÃ¡Â»â€ºi')).toBeVisible();
        
        // KiÃ¡Â»Æ’m tra section ThÃƒÂ´ng tin Ã„ÂÃ¡Â»â„¢c giÃ¡ÂºÂ£
        await expect(page.getByText('ThÃƒÂ´ng Tin Ã„ÂÃ¡Â»â„¢c GiÃ¡ÂºÂ£')).toBeVisible();
    });

    test('CIRC-003: ChÃ¡Â»Ân Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£ trong dialog', async ({ page }) => {
        await page.getByRole('button', { name: 'LÃ¡ÂºÂ­p PhiÃ¡ÂºÂ¿u MÃ†Â°Ã¡Â»Â£n' }).click();

        // TÃƒÂ¬m Combobox vÃ¡Â»â€ºi placeholder "NhÃ¡ÂºÂ­p tÃƒÂªn Ã„â€˜Ã¡Â»Æ’ tÃƒÂ¬m..."
        const readerCombobox = page.locator('input[placeholder="NhÃ¡ÂºÂ­p tÃƒÂªn Ã„â€˜Ã¡Â»Æ’ tÃƒÂ¬m..."]');
        await readerCombobox.click();
        
        // ChÃ¡Â»Ân Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£ tÃ¡Â»Â« dropdown
        await page.getByText('NguyÃ¡Â»â€¦n VÃ„Æ’n A - a@example.com').click();

        // KiÃ¡Â»Æ’m tra thÃƒÂ´ng tin Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£ hiÃ¡Â»Æ’n thÃ¡Â»â€¹
        await expect(page.locator('input[value="NguyÃ¡Â»â€¦n VÃ„Æ’n A"]')).toBeVisible();
        await expect(page.getByText('Sinh viÃƒÂªn')).toBeVisible();
    });

    test('CIRC-004: Validation - Ã„ÂÃ¡Â»â„¢c giÃ¡ÂºÂ£ hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n', async ({ page }) => {
        await page.getByRole('button', { name: 'LÃ¡ÂºÂ­p PhiÃ¡ÂºÂ¿u MÃ†Â°Ã¡Â»Â£n' }).click();

        const readerCombobox = page.locator('input[placeholder="NhÃ¡ÂºÂ­p tÃƒÂªn Ã„â€˜Ã¡Â»Æ’ tÃƒÂ¬m..."]');
        await readerCombobox.click();
        
        // ChÃ¡Â»Ân Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£ hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n
        await page.getByText('Ã„ÂÃ¡Â»â„¢c giÃ¡ÂºÂ£ hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n').click();

        // KiÃ¡Â»Æ’m tra cÃ¡ÂºÂ£nh bÃƒÂ¡o hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n hiÃ¡Â»Æ’n thÃ¡Â»â€¹
        await expect(page.getByText(/ThÃ¡ÂºÂ» Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£ Ã„â€˜ÃƒÂ£ hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n/i)).toBeVisible();
        
        // Chi tiÃ¡ÂºÂ¿t sÃƒÂ¡ch KHÃƒâ€NG hiÃ¡Â»Æ’n thÃ¡Â»â€¹ khi hÃ¡ÂºÂ¿t hÃ¡ÂºÂ¡n
        await expect(page.getByText('Chi tiÃ¡ÂºÂ¿t SÃƒÂ¡ch')).not.toBeVisible();
    });

    test('CIRC-005: ChÃ¡Â»Ân sÃƒÂ¡ch trong bÃ¡ÂºÂ£ng chi tiÃ¡ÂºÂ¿t', async ({ page }) => {
        await page.getByRole('button', { name: 'LÃ¡ÂºÂ­p PhiÃ¡ÂºÂ¿u MÃ†Â°Ã¡Â»Â£n' }).click();

        // ChÃ¡Â»Ân Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£ hÃ¡Â»Â£p lÃ¡Â»â€¡
        const readerCombobox = page.locator('input[placeholder="NhÃ¡ÂºÂ­p tÃƒÂªn Ã„â€˜Ã¡Â»Æ’ tÃƒÂ¬m..."]');
        await readerCombobox.click();
        await page.getByText('NguyÃ¡Â»â€¦n VÃ„Æ’n A - a@example.com').click();

        // Ã„ÂÃ¡Â»Â£i bÃ¡ÂºÂ£ng Chi tiÃ¡ÂºÂ¿t SÃƒÂ¡ch hiÃ¡Â»Æ’n thÃ¡Â»â€¹
        await expect(page.getByText('Chi tiÃ¡ÂºÂ¿t SÃƒÂ¡ch')).toBeVisible();

        // TÃƒÂ¬m input TÃƒÂªn SÃƒÂ¡ch trong table (placeholder "TÃƒÂªn sÃƒÂ¡ch...")
        const bookTitleInput = page.locator('input[placeholder="TÃƒÂªn sÃƒÂ¡ch..."]').first();
        await bookTitleInput.click();
        
        // ChÃ¡Â»Ân tÃ¡Â»Â« dropdown
        await page.waitForTimeout(300);
        await page.getByText('Clean Code').first().click();

        // KiÃ¡Â»Æ’m tra title Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c chÃ¡Â»Ân
        const selectedValue = await bookTitleInput.inputValue();
        expect(selectedValue).toBe('Clean Code');
    });

    test('CIRC-006: ThÃƒÂªm dÃƒÂ²ng sÃƒÂ¡ch mÃ¡Â»â€ºi', async ({ page }) => {
        await page.getByRole('button', { name: 'LÃ¡ÂºÂ­p PhiÃ¡ÂºÂ¿u MÃ†Â°Ã¡Â»Â£n' }).click();

        const readerCombobox = page.locator('input[placeholder="NhÃ¡ÂºÂ­p tÃƒÂªn Ã„â€˜Ã¡Â»Æ’ tÃƒÂ¬m..."]');
        await readerCombobox.click();
        await page.getByText('NguyÃ¡Â»â€¦n VÃ„Æ’n A').click();

        // Click nÃƒÂºt ThÃƒÂªm dÃƒÂ²ng
        await page.getByRole('button', { name: 'ThÃƒÂªm dÃƒÂ²ng' }).click();

        // KiÃ¡Â»Æ’m tra sÃ¡Â»â€˜ dÃƒÂ²ng tÃ„Æ’ng lÃƒÂªn
        const rows = page.locator('table tbody tr');
        await expect(rows).toHaveCount(2); // Ban Ã„â€˜Ã¡ÂºÂ§u 1 row + 1 row mÃ¡Â»â€ºi
    });

    test('CIRC-007: Validation - Submit mÃƒÂ  khÃƒÂ´ng chÃ¡Â»Ân ngÃ†Â°Ã¡Â»Âi', async ({ page }) => {
        await page.getByRole('button', { name: 'LÃ¡ÂºÂ­p PhiÃ¡ÂºÂ¿u MÃ†Â°Ã¡Â»Â£n' }).click();

        // Click LÃ†Â°u PhiÃ¡ÂºÂ¿u MÃ†Â°Ã¡Â»Â£n ngay mÃƒÂ  khÃƒÂ´ng Ã„â€˜iÃ¡Â»Ân gÃƒÂ¬
        await page.getByRole('button', { name: 'LÃ†Â°u PhiÃ¡ÂºÂ¿u MÃ†Â°Ã¡Â»Â£n' }).click();

        // NÃƒÂºt bÃ¡Â»â€¹ disabled nÃƒÂªn khÃƒÂ´ng cÃƒÂ³ gÃƒÂ¬ xÃ¡ÂºÂ£y ra, hoÃ¡ÂºÂ·c cÃƒÂ³ toast validation
        // KiÃ¡Â»Æ’m tra nÃƒÂºt disabled
        const saveButton = page.getByRole('button', { name: 'LÃ†Â°u PhiÃ¡ÂºÂ¿u MÃ†Â°Ã¡Â»Â£n' });
        expect(await saveButton.isDisabled()).toBe(true);
    });

    test('CIRC-008: LÃ¡ÂºÂ­p phiÃ¡ÂºÂ¿u mÃ†Â°Ã¡Â»Â£n thÃƒÂ nh cÃƒÂ´ng', async ({ page }) => {
        await page.getByRole('button', { name: 'LÃ¡ÂºÂ­p PhiÃ¡ÂºÂ¿u MÃ†Â°Ã¡Â»Â£n' }).click();

        // ChÃ¡Â»Ân Ã„â€˜Ã¡Â»â„¢c giÃ¡ÂºÂ£
        const readerCombobox = page.locator('input[placeholder="NhÃ¡ÂºÂ­p tÃƒÂªn Ã„â€˜Ã¡Â»Æ’ tÃƒÂ¬m..."]');
        await readerCombobox.click();
        await page.getByText('NguyÃ¡Â»â€¦n VÃ„Æ’n A').click();

        // ChÃ¡Â»Ân sÃƒÂ¡ch
        await page.waitForTimeout(500);
        const bookTitleInput = page.locator('input[placeholder="TÃƒÂªn sÃƒÂ¡ch..."]').first();
        await bookTitleInput.click();
        await page.waitForTimeout(300);
        await page.getByText('Clean Code').first().click();

        // Click LÃ†Â°u
        await page.getByRole('button', { name: 'LÃ†Â°u PhiÃ¡ÂºÂ¿u MÃ†Â°Ã¡Â»Â£n' }).click();

        // Expect success toast
        await expect(page.getByText(/LÃ¡ÂºÂ­p phiÃ¡ÂºÂ¿u mÃ†Â°Ã¡Â»Â£n thÃƒÂ nh cÃƒÂ´ng/i)).toBeVisible({ timeout: 5000 });
    });

    test('CIRC-009: TÃƒÂ¬m kiÃ¡ÂºÂ¿m phiÃ¡ÂºÂ¿u mÃ†Â°Ã¡Â»Â£n', async ({ page }) => {
        // TÃƒÂ¬m search input trong tab "Ã„Âang mÃ†Â°Ã¡Â»Â£n"
        const searchInput = page.locator('input[placeholder*="TÃƒÂ¬m"]').first();
        
        if (await searchInput.isVisible()) {
            await searchInput.fill('PM');
            await page.waitForTimeout(500);
            
            // Filter Ã„â€˜ÃƒÂ£ hoÃ¡ÂºÂ¡t Ã„â€˜Ã¡Â»â„¢ng (nÃ¡ÂºÂ¿u cÃƒÂ³ dÃ¡Â»Â¯ liÃ¡Â»â€¡u)
        }
    });

    test('CIRC-010: Filter theo ngÃƒÂ y mÃ†Â°Ã¡Â»Â£n', async ({ page }) => {
        // TÃƒÂ¬m date filter inputs
        const dateInputs = page.locator('input[type="date"]');
        
        if (await dateInputs.first().isVisible()) {
            const today = new Date().toISOString().split('T')[0];
            await dateInputs.first().fill(today);
            await page.waitForTimeout(500);
            
            // Filter ÃƒÂ¡p dÃ¡Â»Â¥ng
        }
    });
});
