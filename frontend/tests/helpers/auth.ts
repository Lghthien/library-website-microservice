import { Page } from '@playwright/test';

/**
 * Helper function để đăng nhập với ADMIN
 * Dựa trên code thực tế trong src/app/auth/login/page.tsx
 */
export async function loginAsAdmin(page: Page) {
  try {
    // Navigate to login page
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });
    
    // Wait for login form
    const emailInput = page.locator('#email');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Fill credentials
    await emailInput.fill('admin@library.com');
    await page.locator('#password').fill('admin123');
    
    // Click login button
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/portal/dashboard', { timeout: 15000 });
    
    // Wait for dashboard content to load
    await page.waitForLoadState('networkidle');
    
    // Verify we're on dashboard by checking for heading
    await page.locator('h1').first().waitFor({ state: 'visible', timeout: 5000 });
    
    console.log('✓ Logged in successfully, URL:', page.url());
    
  } catch (error) {
    console.error('❌ Login failed:', error);
    console.log('Current URL:', page.url());
    
    // Take screenshot for debugging
    await page.screenshot({ path: `test-results/login-error-${Date.now()}.png` }).catch(() => {});
    
    throw error;
  }
}

/**
 * Helper function để logout
 */
export async function logout(page: Page) {
  const logoutButton = page.locator(
    'button:has-text("Logout"), button:has-text("Đăng xuất")'
  ).first();
  
  if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await logoutButton.click();
    await page.waitForTimeout(2000);
  }
}
