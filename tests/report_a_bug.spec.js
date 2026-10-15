// @ts-check

const { test, expect } = require('@playwright/test');
const { loginWithMicrosoft } = require('./helpers/microsoft-login');

if (require.main === module) {
	console.error('This test file must be run with the Playwright test runner, not Node.js.');
	console.error('Use: npx playwright test tests/report_a_bug.spec.js');
	process.exit(1);
}

test('Log in and navigate to Report a Bug', async ({ page }) => {
	await loginWithMicrosoft(page);

	const landingHeading = page.locator('h1');
	await expect(landingHeading).toHaveText('Welcome back, Fortune', { timeout: 20000 });
	await page.locator('button[id="radix-:r25:"]').click();
	await page.locator('span').filter({ hasText: /^\s*Report a Bug\s*$/ }).click();
	await page.waitForTimeout(3000);
	await page.locator('textarea#bug-report-steps').fill('Test data');
	await page.locator('textarea#bug-report-what-happened').fill('Test data failed to Load');
	await page.waitForTimeout(3000);

	console.log('Done: Microsoft login sequence started with credentials from environment variables.');
});
