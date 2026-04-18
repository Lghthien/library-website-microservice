import { Page, Locator } from '@playwright/test';

/**
 * Mở dialog bằng cách click button và đợi dialog hiển thị
 */
export async function openDialog(page: Page, buttonText: string): Promise<Locator> {
  await page.getByRole('button', { name: buttonText }).click();
  const dialog = page.locator('dialog[open], [role="dialog"]');
  await dialog.waitFor({ state: 'visible' });
  return dialog;
}

/**
 * Đóng dialog bằng cách click nút Hủy hoặc X
 */
export async function closeDialog(page: Page) {
  const closeButton = page.locator('dialog').getByRole('button', { name: /Hủy|Đóng|Close/i });
  if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closeButton.click();
  }
}

/**
 * Điền nhiều trường form cùng lúc
 */
export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [selector, value] of Object.entries(fields)) {
    await page.locator(selector).fill(value);
  }
}

/**
 * Chọn option trong select dropdown (Radix UI)
 */
export async function selectOption(page: Page, triggerSelector: string, optionText: string) {
  await page.locator(triggerSelector).click();
  await page.waitForTimeout(300); // Wait for dropdown animation
  await page.getByRole('option', { name: optionText }).click();
}

/**
 * Đợi toast notification hiển thị
 */
export async function waitForToast(page: Page, message?: string): Promise<boolean> {
  const toastSelector = message 
    ? `[role="status"]:has-text("${message}"), [role="alert"]:has-text("${message}")`
    : '[role="status"], [role="alert"]';
  
  try {
    await page.locator(toastSelector).first().waitFor({ state: 'visible', timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Đợi table load xong (có ít nhất 1 row)
 */
export async function waitForTableData(page: Page, minRows: number = 1): Promise<void> {
  await page.locator(`table tbody tr:nth-child(${minRows})`).waitFor({ state: 'visible' });
}

/**
 * Lấy số lượng rows trong table
 */
export async function getTableRowCount(page: Page): Promise<number> {
  return await page.locator('table tbody tr').count();
}

/**
 * Click vào action menu của một row trong table
 */
export async function openRowMenu(page: Page, rowIndex: number = 0): Promise<void> {
  const row = page.locator('table tbody tr').nth(rowIndex);
  const menuButton = row.locator('button').last(); // Usually the last button is the menu
  await menuButton.click();
  await page.waitForTimeout(300); // Wait for menu animation
}

/**
 * Đợi page load xong (không có loading spinner)
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  // Wait for any loading spinners to disappear
  const loadingSpinner = page.locator('[role="status"]:has-text("Đang tải"), .loading, .spinner');
  if (await loadingSpinner.isVisible({ timeout: 1000 }).catch(() => false)) {
    await loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
  }
}
