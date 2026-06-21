// Playwright E2E 設定（vanilla no-build デモ）。
// 実行: npm i -D @playwright/test && npx playwright install && npm run test:e2e
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:8731",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  // 既存サーバを再利用。無ければ serve.js を 8731 で起動。
  webServer: {
    // STRICT_PORT=1 で 8731 占有時に +1 せず即終了（固定URL期待との不整合を防ぐ）
    command: "STRICT_PORT=1 PORT=8731 node serve.js",
    url: "http://localhost:8731/index.html",
    reuseExistingServer: true,
    timeout: 20_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["iPhone 13"] } },
  ],
});
