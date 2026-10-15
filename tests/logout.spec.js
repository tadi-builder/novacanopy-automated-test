// @ts-check

const { test, expect } = require('@playwright/test');
const { loginWithMicrosoft } = require('./helpers/microsoft-login');

if (require.main === module) {
	console.error('This test file must be run with the Playwright test runner, not Node.js.');
	console.error('Use: npx playwright test tests/logout.spec.js');
	process.exit(1);
}

test('Log in and click the Logout button', async ({ page }) => {
	await loginWithMicrosoft(page);

	const landingHeading = page.locator('h1');
	await expect(landingHeading).toHaveText('Welcome back, Fortune', { timeout: 20000 });
	await page.locator('button:has(span:text-is("Logout"))').click();

	console.log('Done: Microsoft login sequence started with credentials from environment variables.');
});
