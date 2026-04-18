import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { waitForPageLoad } from './helpers/test-utils';

test.describe('DEBUG - Test Readers Page Real UI', () => {
    test('DEBUG-001: Xem UI thực tế của readers page', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('http://localhost:3000/portal/readers');
        await waitForPageLoad(page);

        // Đợi một chút để xem page
        await page.waitForTimeout(2000);

        // Click button "Lập thẻ độc giả"
        await page.getByRole('button', { name: /Lập thẻ/i }).click();
        
        await page.waitForTimeout(1000);

        // Screenshot để xem dialog
        await page.screenshot({ path: 'debug-readers-dialog.png' });

        // List tất cả inputs
        const inputs = await page.locator('input').all();
        console.log('===== FOUND INPUTS =====');
        for (const input of inputs) {
            const placeholder = await input.getAttribute('placeholder');
            const id = await input.getAttribute('id');
            const type = await input.getAttribute('type');
            console.log(`Input: id="${id}" placeholder="${placeholder}" type="${type}"`);
        }

        // List all buttons
        const buttons = await page.locator('button').all();
        console.log('\n===== FOUND BUTTONS =====');
        for (const button of buttons) {
            const text = await button.textContent();
            const role = await button.getAttribute('role');
            console.log(`Button: text="${text?.trim()}" role="${role}"`);
        }

        // List all labels
        const labels = await page.locator('label').all();
        console.log('\n===== FOUND LABELS =====');
        for (const label of labels) {
            const text = await label.textContent();
            const forAttr = await label.getAttribute('for');
            console.log(`Label: for="${forAttr}" text="${text?.trim()}"`);
        }
    });

    test('DEBUG-002: Test submit form với data thực', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('http://localhost:3000/portal/readers');
        await waitForPageLoad(page);

        await page.getByRole('button', { name: /Lập thẻ/i }).click();
        await page.waitForTimeout(1000);

        // Thử điền form
        await page.locator('#readerName').fill('Test User Debug');
        await page.locator('#dob').fill('2000-01-01');
        await page.locator('#email').fill('testdebug@example.com');
        await page.locator('#phoneNumber').fill('0909090909');
        await page.locator('#address').fill('Debug Address');

        // Chọn reader type
        const selectTrigger = page.locator('button[role="combobox"]').first();
        await selectTrigger.click();
        await page.waitForTimeout(500);

        // Screenshot dropdown
        await page.screenshot({ path: 'debug-readers-dropdown.png' });

        // Chọn option đầu tiên
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');

        await page.waitForTimeout(500);

        // Click submit
        await page.getByRole('button', { name: /Lập thẻ/i }).last().click();

        await page.waitForTimeout(2000);

        // Screenshot result
        await page.screenshot({ path: 'debug-readers-result.png' });

        // Check console logs
        const messages: string[] = [];
        page.on('console', msg => messages.push(msg.text()));
        
        console.log('\n===== CONSOLE MESSAGES =====');
        console.log(messages.join('\n'));
    });
});
