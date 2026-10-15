// @ts-check

const { test, expect } = require('@playwright/test');
const { loginWithMicrosoft } = require('./helpers/microsoft-login');

if (require.main === module) {
	console.error('This test file must be run with the Playwright test runner, not Node.js.');
	console.error('Use: npx playwright test tests/reviewapplications.spec.js');
	process.exit(1);
}

test('Navigate to Review Applications', async ({ page }) => {
	await loginWithMicrosoft(page);

	const landingHeading = page.locator('h1');
	await expect(landingHeading).toHaveText('Welcome back, Fortune', { timeout: 20000 });

	const applicationsButton = page.locator('[id="radix-:r1l:"]');
	await applicationsButton.waitFor({ state: 'visible', timeout: 10000 });
	await applicationsButton.click();

	const reviewApplicationsItem = page.getByRole('menuitem', { name: 'Review Applications' });
	await reviewApplicationsItem.waitFor({ state: 'visible', timeout: 10000 });
	await reviewApplicationsItem.click();

	await expect(page.locator('h1')).toHaveText('Review Applications', { timeout: 10000 });

	const firstApplicationRow = page.getByRole('row').nth(1);
	const viewAction = firstApplicationRow.getByText('View', { exact: true }).first();
	await viewAction.waitFor({ state: 'visible', timeout: 10000 });
	await viewAction.click();
	await page.waitForTimeout(5000);
});
