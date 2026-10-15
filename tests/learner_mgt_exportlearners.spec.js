// @ts-check

const { test, expect } = require('@playwright/test');
const { loginWithMicrosoft } = require('./helpers/microsoft-login');

test('Log in to NovaCanopy and open Learner Management', async ({ page }) => {
	test.setTimeout(90000);
	await loginWithMicrosoft(page);

	const landingHeading = page.locator('h1').first();
	await expect(landingHeading).toHaveText('Welcome back, Fortune', { timeout: 20000 });

	const learnerButton = page.locator('[id="radix-:r1p:"]').first();
	await learnerButton.waitFor({ state: 'visible', timeout: 15000 });
	await learnerButton.click({ timeout: 5000 });

	const learnerManagementOption = page.locator('span').filter({ hasText: /^Learner Management$/ }).first();
	await learnerManagementOption.waitFor({ state: 'visible', timeout: 15000 });
	await learnerManagementOption.click({ timeout: 5000 });
});
