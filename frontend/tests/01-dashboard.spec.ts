import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { waitForPageLoad } from './helpers/test-utils';

test.describe('ADMIN - Dashboard Tests (Mocked API)', () => {

  const mockStats = {
    readers: { active: 150, expired: 10, total: 160 },
    books: { total: 500, available: 400, borrowed: 100 },
    loans: { overdue: 5 },
    fines: { unpaidCount: 2, unpaidTotal: 50000 }
  };

  const mockTrend = Array.from({ length: 7 }, (_, i) => ({
    month: `T${i + 1}`,
    fullDate: `2024-${String(i + 1).padStart(2, '0')}`,
    loans: 10 + i,
    returns: 8 + i,
    overdue: i % 3
  }));

  const mockCategories = [
    { categoryName: 'IT', borrowCount: 50, uniqueReaders: 20 },
    { categoryName: 'Science', borrowCount: 30, uniqueReaders: 15 }
  ];

  test.beforeEach(async ({ page }) => {
    // Mock APIs
    await page.route('**/api/reports/dashboard', async route => await route.fulfill({ json: mockStats }));
    await page.route('**/api/reports/trend?months=7', async route => await route.fulfill({ json: mockTrend }));
    await page.route('**/api/reports/borrow-by-category*', async route => await route.fulfill({ json: mockCategories }));
    await page.route('**/api/reports/reader-age-distribution', async route => await route.fulfill({ json: [] }));
    await page.route('**/api/reports/reader-debt-status', async route => await route.fulfill({ json: [] }));
    await page.route('**/api/audit-logs/recent*', async route => await route.fulfill({ json: [] }));

    await loginAsAdmin(page);
    await page.goto('http://localhost:3000/portal/dashboard');
    await waitForPageLoad(page);
  });

  test('DASH-001: Dashboard displays correct stats from API', async ({ page }) => {
    // Check mocked values matches UI
    await expect(page.locator('text=Tổng Độc giả')).toBeVisible();
    await expect(page.locator('text=160').first()).toBeVisible(); // from mockStats.readers.total

    await expect(page.locator('text=Tổng Sách')).toBeVisible();
    await expect(page.locator('text=500').first()).toBeVisible(); // from mockStats.books.total

    await expect(page.locator('text=Tiền phạt chưa thu')).toBeVisible();
    await expect(page.locator('text=50.000 ₫')).toBeVisible(); // from mockStats.fines.unpaidTotal
  });

  test('DASH-002: Charts are displayed', async ({ page }) => {
    await expect(page.locator('text=Thống kê Lưu thông')).toBeVisible();
    // Recharts usually renders an SVG
    await expect(page.locator('.recharts-surface').first()).toBeVisible();
    
    await expect(page.locator('text=Phân bố Thể loại')).toBeVisible();
    await expect(page.locator('text=IT')).toBeVisible(); // from mockCategories
  });

  test('DASH-003: System time is displayed', async ({ page }) => {
    // Header component displays time
    await expect(page.locator('text=Thời gian hệ thống')).toBeVisible();
    // Check for HH:mm format regex
    await expect(page.locator('text=/:/').first()).toBeVisible();
  });
});
