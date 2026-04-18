import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  
  // Thời gian timeout cho mỗi test
  timeout: 30 * 1000,
  
  // Số lần retry khi test fail
  retries: 1,
  
  // Chạy song song
  workers: 1,
  
  // Reporter - tạo báo cáo đẹp
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  use: {
    // Base URL
    baseURL: 'http://localhost:3000',
    
    // Chụp screenshot khi fail
    screenshot: 'only-on-failure',
    
    // Record video khi fail
    video: 'retain-on-failure',
    
    // Trace khi fail
    trace: 'retain-on-failure',
    
    // Timeout cho mỗi action
    actionTimeout: 10000,
  },

  // Cấu hình cho các browser
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment để test trên Firefox và Safari
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Web server - tự động start dev server nếu chưa chạy
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
