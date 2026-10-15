// @ts-check

const { test, expect } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const MICROSOFT_LOGIN_EMAIL = process.env.MICROSOFT_LOGIN_EMAIL;
const MICROSOFT_LOGIN_PASSWORD = process.env.MICROSOFT_LOGIN_PASSWORD;

if (!MICROSOFT_LOGIN_EMAIL || !MICROSOFT_LOGIN_PASSWORD) {
	throw new Error(
		'Environment variables MICROSOFT_LOGIN_EMAIL and MICROSOFT_LOGIN_PASSWORD are required.\n' +
		'Create a local .env file from .env.example and add your credentials there.'
	);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
async function fillMicrosoftCredentials(page, email, password) {
	const emailLocator = page.locator(
		'input[type="email"], input[name="loginfmt"], input[id="i0116"], input[name="login"]'
	).first();
	await emailLocator.waitFor({ state: 'visible', timeout: 15000 });
	await emailLocator.fill(email);

	const nextButton = page.locator('button:has-text("Next"), #idSIButton9, button:has-text("Sign in")').first();
	if (await nextButton.count()) {
		await nextButton.click({ timeout: 5000 });
	} else {
		await emailLocator.press('Enter');
	}

	const passwordLocator = page.locator(
		'input[type="password"], input[name="passwd"], input[id="i0118"], input[name="Password"]'
	).first();
	await passwordLocator.waitFor({ state: 'visible', timeout: 15000 });
	await passwordLocator.fill(password);

	const signInButton = page.locator('button:has-text("Sign in"), button[type="submit"], #idSIButton9').first();
	if (await signInButton.count()) {
		await signInButton.click({ timeout: 5000 });
	} else {
		await passwordLocator.press('Enter');
	}

	const rememberLabel = page.locator('label:has-text("Don\'t show me again")').first();
	if (await rememberLabel.count()) {
		const rememberCheckbox = rememberLabel.locator('input[type="checkbox"]');
		if (await rememberCheckbox.count()) {
			await rememberCheckbox.check({ timeout: 5000 }).catch(() => null);
		}
	} else {
		const fallbackCheckbox = page.locator(
			'input[type="checkbox"][aria-label*="Don\'t show me again"], input[type="checkbox"][name*="dont"], input[type="checkbox"][id*="dont"]'
		).first();
		if (await fallbackCheckbox.count()) {
			await fallbackCheckbox.check({ timeout: 5000 }).catch(() => null);
		}
	}

	const yesButton = page.locator(
		'button:has-text("Yes"), input[type="submit"][value="Yes"], button:has-text("Yes, sign in")'
	).first();
	try {
		await yesButton.waitFor({ state: 'visible', timeout: 5000 });
		await yesButton.click({ timeout: 5000 });
	} catch (e) {
		// No consent or approval prompt was shown.
	}
}

test('Login and open Community Projects', async ({ page }) => {
	await page.goto('https://admin.novacanopy.panhari.org/login', { waitUntil: 'domcontentloaded' });

	const selectors = [
		'button:has-text("Sign in with Microsoft")',
		'button:has-text("Continue with Microsoft")',
		'button:has-text("Microsoft")',
		'a:has-text("Sign in with Microsoft")',
		'a:has-text("Microsoft")',
		'[aria-label*="Microsoft"]',
		'img[alt*="Microsoft"]',
		'button[data-provider="microsoft"]',
		'a[data-provider="microsoft"]'
	];

	let clicked = false;
	const authPopupPromise = page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null);

	for (const selector of selectors) {
		try {
			const locator = page.locator(selector).first();
			await locator.waitFor({ state: 'visible', timeout: 2000 });
			await locator.click({ timeout: 5000 });
			clicked = true;
			break;
		} catch (e) {
			// Try the next selector.
		}
	}

	if (!clicked) {
		const fuzzyMicrosoftButton = page.locator('text=/.*Microsoft.*/i').first();
		await fuzzyMicrosoftButton.waitFor({ state: 'visible', timeout: 2000 });
		await fuzzyMicrosoftButton.click({ timeout: 5000 });
	}

	const authPage = (await authPopupPromise) || page;
	await authPage.waitForLoadState('domcontentloaded');
	await fillMicrosoftCredentials(authPage, MICROSOFT_LOGIN_EMAIL, MICROSOFT_LOGIN_PASSWORD);

	if (authPage !== page) {
		await authPage.waitForEvent('close', { timeout: 30000 }).catch(() => null);
	}

	await page.waitForLoadState('load');
	await expect(page.locator('h1').first()).toHaveText(/Welcome back/i, { timeout: 20000 });

	const learnerButton = page
		.locator('[id="radix-:r1p:"]')
		.or(page.locator('button:has-text("Learner")'))
		.first();
	await learnerButton.waitFor({ state: 'visible', timeout: 15000 });
	await learnerButton.click({ timeout: 5000 });

	const communityProjectsOption = page.getByText('Community Projects', { exact: true }).first();
	await communityProjectsOption.waitFor({ state: 'visible', timeout: 15000 });
	await communityProjectsOption.click({ timeout: 5000 });

	const communityProjectsHeading = page.locator('h1, h2').filter({ hasText: /community projects/i }).first();
	await expect(communityProjectsHeading).toBeVisible({ timeout: 15000 });

	const projectDescription = page.getByText(
		'Monitor and review Community Learning and Impact Project submissions by enrolled learners',
		{ exact: true }
	).first();
	await expect(projectDescription).toBeVisible({ timeout: 15000 });

	const reviewProposalButton = page.getByTitle('Review proposal').first();
	await expect(reviewProposalButton).toBeVisible({ timeout: 15000 });
	await reviewProposalButton.click({ timeout: 5000 });

	await expect(page.getByText('Project Information', { exact: true }).first()).toBeVisible({ timeout: 15000 });
	await expect(page.getByText('Budget Planning', { exact: true }).first()).toBeVisible({ timeout: 15000 });
});
