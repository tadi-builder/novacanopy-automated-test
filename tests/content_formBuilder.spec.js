// @ts-check

const { test, expect } = require('@playwright/test');
const { loginWithMicrosoft } = require('./helpers/microsoft-login');

if (require.main === module) {
	console.error('This test file must be run with the Playwright test runner, not Node.js.');
	console.error('Use: npx playwright test tests/content_formBuilder.spec.js');
	process.exit(1);
}

/** @param {number} length @param {boolean} [digitsOnly=false] */
function randomText(length, digitsOnly = false) {
	const alphabet = digitsOnly ? '0123456789' : 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

/** @param {import('@playwright/test').Locator} input */
async function randomValueForInput(input) {
	const spec = await input.evaluate((/** @type {HTMLInputElement} */ element) => ({
		type: element.type,
		min: element.getAttribute('min'),
		max: element.getAttribute('max'),
		step: element.getAttribute('step'),
		minLength: element.minLength,
		maxLength: element.maxLength,
		pattern: element.getAttribute('pattern'),
	}));
	const random = Math.random().toString(36).slice(2, 10);
	const minLength = Math.max(spec.minLength, 1);
	const maxLength = spec.maxLength > 0 ? spec.maxLength : 64;
	if (minLength > maxLength) {
		throw new Error(`Input minlength (${minLength}) exceeds maxlength (${maxLength}).`);
	}

	switch (spec.type) {
		case 'email':
			return `user${random}@example.com`;
		case 'url':
			return `https://example.com/${random}`;
		case 'number':
		case 'range': {
			const min = spec.min === null ? 1 : Number(spec.min);
			const max = spec.max === null ? min + 100 : Number(spec.max);
			const step = spec.step && spec.step !== 'any' ? Number(spec.step) : 1;
			const steps = Math.max(0, Math.floor((max - min) / step));
			const precision = spec.step?.split('.')[1]?.length ?? 0;
			return (min + Math.floor(Math.random() * (steps + 1)) * step).toFixed(precision);
		}
		case 'date':
			return spec.min || new Date().toISOString().slice(0, 10);
		case 'time':
			return spec.min || '12:00';
		case 'datetime-local':
			return spec.min || new Date().toISOString().slice(0, 16);
		case 'month':
			return spec.min || new Date().toISOString().slice(0, 7);
		case 'week':
			return spec.min || `${new Date().getFullYear()}-W01`;
		case 'tel':
			return randomText(Math.min(Math.max(minLength, 10), maxLength), true);
		case 'text':
		case 'search':
		case 'password': {
			const length = Math.min(Math.max(minLength, 12), maxLength);
			const candidates = [
				(spec.type === 'password' && length >= 4
					? `Aa${randomText(length - 4)}1!`
					: randomText(length)),
				randomText(length),
				randomText(length, true),
			];
			if (!spec.pattern) {
				return candidates[0];
			}
			const pattern = new RegExp(`^(?:${spec.pattern})$`);
			const patternMaxLength = Math.max(minLength, Math.min(maxLength, 32));
			for (let attempt = 0; attempt < 100; attempt += 1) {
				const candidateLength = minLength + Math.floor(Math.random() * (patternMaxLength - minLength + 1));
				const value = candidates[attempt % candidates.length] ?? randomText(candidateLength, attempt % 2 === 0);
				if (value.length >= minLength && value.length <= maxLength && pattern.test(value)) {
					return value;
				}
				candidates.push(randomText(candidateLength, attempt % 2 === 0));
			}
			throw new Error(`Could not generate a value matching input pattern: ${spec.pattern}`);
		}
		default:
			return null;
	}
}

test('Navigate and click Microsoft login button', async ({ page }) => {
	await loginWithMicrosoft(page);

	const landingHeading = page.locator('h1');
	await expect(landingHeading).toHaveText('Welcome back, Fortune', { timeout: 20000 });

	const menuButton = page.locator('button[id="radix-:r1t:"]');
	await menuButton.waitFor({ state: 'visible', timeout: 10000 });
	await menuButton.click();

	const formBuilderOption = page.locator('span:text-is("Form Builder")').first();
	await formBuilderOption.waitFor({ state: 'visible', timeout: 10000 });
	await formBuilderOption.click();

	const newFormButton = page.getByRole('button', { name: 'New Form', exact: true });
	await newFormButton.waitFor({ state: 'visible', timeout: 10000 });
	await newFormButton.click();

	const dialogInputs = page.locator('[role="dialog"] input:visible');
	const formInputs = (await dialogInputs.count()) > 0 ? dialogInputs : page.locator('input:visible');
	await formInputs.first().waitFor({ state: 'visible', timeout: 10000 });
	for (let index = 0; index < await formInputs.count(); index += 1) {
		const input = formInputs.nth(index);
		const value = await randomValueForInput(input);
		if (value !== null && await input.isEnabled()) {
			await input.fill(value);
			if (!(await input.evaluate((/** @type {HTMLInputElement} */ element) => element.checkValidity()))) {
				throw new Error(`Generated value does not satisfy the constraints for input ${index + 1}.`);
			}
		}
	}
	const permissionsButton = page.getByRole('button', { name: 'permissions', exact: true });
	await permissionsButton.waitFor({ state: 'visible', timeout: 10000 });
	await permissionsButton.click();

	const checkboxes = page.locator('input[type="checkbox"]:visible');
	const firstCheckbox = checkboxes.nth(0);
	await firstCheckbox.waitFor({ state: 'visible', timeout: 10000 });
	await firstCheckbox.click();

	const fifthCheckbox = checkboxes.nth(4);
	await fifthCheckbox.waitFor({ state: 'visible', timeout: 10000 });
	await fifthCheckbox.click();

	const createFormButton = page.getByRole('button', { name: 'Create Form', exact: true });
	await createFormButton.waitFor({ state: 'visible', timeout: 10000 });
	await createFormButton.click();
	await page.waitForTimeout(3000);

	console.log('Done: Microsoft login sequence started with credentials from environment variables.');
});
