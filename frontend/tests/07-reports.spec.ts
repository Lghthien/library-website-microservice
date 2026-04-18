import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';
import { waitForPageLoad } from './helpers/test-utils';

test.describe('ADMIN - Báo Cáo Thống Kê (Mocked API)', () => {

  // Mock data objects
  const mockDashboardStats = {
    readers: { active: 150, expired: 10, total: 160 },
    books: { total: 500, available: 400, borrowed: 100 },
    loans: { overdue: 5 },
    fines: { unpaidCount: 2, unpaidTotal: 50000 }
  };

  const mockTrendData = Array.from({ length: 12 }, (_, i) => ({
    month: `T${i + 1}`,
    fullDate: `2024-${String(i + 1).padStart(2, '0')}`,
    loans: 10 + i,
    returns: 8 + i,
    overdue: i % 3
  }));

  const mockCategoryData = [
    { _id: 'TL001', categoryName: 'Công nghệ thông tin', borrowCount: 50 },
    { _id: 'TL002', categoryName: 'Kinh tế', borrowCount: 30 },
    { _id: 'TL003', categoryName: 'Văn học', borrowCount: 20 }
  ];

  const mockOverdueLoans = [
    {
      _id: 'LOAN001',
      bookCopyId: 'CP001',
      bookTitle: 'Clean Code',
      borrowDate: '2024-01-01T00:00:00.000Z',
      dueDate: '2024-01-05T00:00:00.000Z',
      overdueDays: 10,
      readerName: 'Nguyễn Văn A'
    }
  ];

  test.beforeEach(async ({ page }) => {
    // 1. Setup API Mocks BEFORE navigating
    await page.route('**/api/reports/dashboard', async route => {
      await route.fulfill({ json: mockDashboardStats });
    });

    await page.route('**/api/reports/trend?months=12', async route => {
      await route.fulfill({ json: mockTrendData });
    });

    await page.route('**/api/reports/borrow-by-category*', async route => {
      await route.fulfill({ json: mockCategoryData });
    });

    await page.route('**/api/reports/overdue-loans*', async route => {
      // Check query params to verify filter logic
      const url = new URL(route.request().url());
      const viewDate = url.searchParams.get('viewDate');
      
      if (viewDate) {
        // If viewDate param exists, return a specific response or verify it
        console.log(`Mock intercepted overdue-loans with viewDate: ${viewDate}`);
      }
      
      await route.fulfill({ json: mockOverdueLoans });
    });

    // 2. Login and Navigate
    await loginAsAdmin(page);
    await page.goto('http://localhost:3000/portal/reports');
    await waitForPageLoad(page);
  });

  test('REPORT-001: Dashboard displays correct stats from API', async ({ page }) => {
    // Verify "Tổng số độc giả"
    await expect(page.locator('text=Tổng số độc giả').first()).toBeVisible();
    await expect(page.locator('text=160').first()).toBeVisible(); // 160 total readers

    // Verify "Sách đang mượn"
    await expect(page.locator('text=Sách đang mượn').first()).toBeVisible();
    await expect(page.locator('text=100').first()).toBeVisible(); // 100 borrowed

    // Verify "Sách trả trễ"
    await expect(page.locator('text=Sách trả trễ').first()).toBeVisible();
    await expect(page.locator('text=5').first()).toBeVisible(); // 5 overdue
  });

  test('REPORT-002: Tab Navigation works correctly', async ({ page }) => {
    // Default Tab should be Overview
    await expect(page.getByRole('tab', { name: 'Tổng quan' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Xu hướng Mượn & Trả')).toBeVisible();

    // Switch to BM7.1
    await page.getByRole('tab', { name: 'Mượn theo Thể loại (BM7.1)' }).click();
    await expect(page.getByRole('tab', { name: 'Mượn theo Thể loại (BM7.1)' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Báo cáo BM7.1')).toBeVisible();
    await expect(page.getByText('Công nghệ thông tin')).toBeVisible(); // From mock data

    // Switch to BM7.2
    await page.getByRole('tab', { name: 'Sách trả trễ (BM7.2)' }).click();
    await expect(page.getByRole('tab', { name: 'Sách trả trễ (BM7.2)' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Báo cáo BM7.2')).toBeVisible();
    // Check for mocked user in the table
    await expect(page.getByText('Nguyễn Văn A')).toBeVisible();
    await expect(page.getByText('Clean Code')).toBeVisible();
  });

  test('REPORT-003: Date Filter triggers API request', async ({ page }) => {
    // Go to BM7.2 Tab
    await page.getByRole('tab', { name: 'Sách trả trễ (BM7.2)' }).click();

    // Find the date input
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();

    // Prepare to wait for the request
    const requestPromise = page.waitForRequest(request => 
      request.url().includes('/api/reports/overdue-loans') && 
      request.url().includes('viewDate=')
    );

    // Change the date
    await dateInput.fill('2023-12-25');

    // Wait for the request to fire
    const request = await requestPromise;
    expect(request.url()).toContain('viewDate=2023-12-25');
  });

  test('REPORT-004: Excel Export button is present', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /Xuất Excel/i });
    await expect(exportBtn).toBeVisible();
    
    // Optional: Verify it's green-ish
    await expect(exportBtn).toHaveClass(/bg-green-600/);
  });
});
