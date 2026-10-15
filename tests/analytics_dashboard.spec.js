// @ts-check

const { test, expect } = require('@playwright/test');
const { loginWithMicrosoft } = require('./helpers/microsoft-login');

if (require.main === module) {
	console.error('This test file must be run with the Playwright test runner, not Node.js.');
	console.error('Use: npx playwright test tests/analytics_dashboard.spec.js');
	process.exit(1);
}

test('Navigate and click analytics menu button', async ({ page }) => {
	await loginWithMicrosoft(page);

	const landingHeading = page.locator('h1');
	await expect(landingHeading).toHaveText('Welcome back, Fortune', { timeout: 20000 });
	await page.locator('button[id="radix-:r1h:"]').click();
	await page.locator('span').filter({ hasText: /^Analytics Dashboard$/ }).click();
	await page.waitForTimeout(3000);

	console.log('Done: Microsoft login sequence started with credentials from environment variables.');
});

