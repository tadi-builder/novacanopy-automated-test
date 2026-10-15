// @ts-check

const { test, expect } = require('@playwright/test');

test('Open the learner login website', async ({ page }) => {
	await page.goto('https://learners.novacanopy.panhari.org/login', {
		waitUntil: 'domcontentloaded',
	});

	await expect(page).toHaveURL(
		'https://learners.novacanopy.panhari.org/login'
	);

	const googleButton = page.getByRole('button', {
		name: 'Continue with Google',
	});
	await expect(googleButton).toBeVisible();

	const popupPromise = page
		.waitForEvent('popup', { timeout: 10000 })
		.catch(() => null);
	await googleButton.click();

	const googlePage = (await popupPromise) || page;
	await googlePage.waitForLoadState('domcontentloaded');
	await googlePage.waitForTimeout(5000);
});
