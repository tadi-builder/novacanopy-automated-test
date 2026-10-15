// @ts-check

const { test, expect } = require('@playwright/test');
const { loginWithMicrosoft } = require('./helpers/microsoft-login');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('Log in to NovaCanopy before creating a learner', async ({ page }) => {
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

	const createLearnerButton = page.getByRole('button', { name: 'Create Learner', exact: true });
	await expect(createLearnerButton).toBeVisible({ timeout: 15000 });
	await createLearnerButton.click({ timeout: 5000 });
	await page.waitForLoadState('load');

	await expect(page.getByText('Create New Learner', { exact: false }).first()).toBeVisible({ timeout: 15000 });
	const learnerDialog = page.getByRole('dialog').filter({ hasText: /Create New Learner/i }).first();
	const form = (await learnerDialog.count()) > 0 ? learnerDialog : page;

	const dropdowns = form.locator('select:visible');
	for (let i = 0; i < await dropdowns.count(); i++) {
		const dropdown = dropdowns.nth(i);
		await dropdown.locator('option').nth(1).waitFor({ state: 'attached', timeout: 10000 }).catch(() => null);
		const options = await dropdown.locator('option').evaluateAll((elements) =>
			Array.from(elements)
				.filter((element) => element instanceof HTMLOptionElement)
				.filter((option) => !option.disabled && option.value !== '')
				.map((option) => option.value)
		);
		if (options.length > 0) {
			await dropdown.selectOption(options[0]);
		}
	}

	const customDropdowns = form.locator('[role="combobox"]:visible');
	for (let i = 0; i < await customDropdowns.count(); i++) {
		const dropdown = customDropdowns.nth(i);
		if (await dropdown.evaluate((element) => element.tagName.toLowerCase() === 'select')) continue;
		await dropdown.click();
		const options = page.getByRole('option').filter({ visible: true });
		if (await options.count() > 0) {
			await options.first().click();
		} else {
			await page.keyboard.press('Escape');
		}
	}

	const fields = form.locator('input:visible, textarea:visible');
	const radioGroups = new Map();
	for (let i = 0; i < await fields.count(); i++) {
		const field = fields.nth(i);
		if (!(await field.isEnabled()) || !(await field.isEditable().catch(() => false))) continue;

		const metadata = await field.evaluate((element) => {
			const fieldElement = /** @type {HTMLInputElement | HTMLTextAreaElement} */ (element);
			const placeholder = fieldElement.getAttribute('placeholder') || '';
			let nearbyText = '';
			let ancestor = fieldElement.parentElement;
			for (let depth = 0; ancestor && depth < 4; depth++, ancestor = ancestor.parentElement) {
				const text = ancestor.innerText.trim();
				if (text && text.length <= 120) {
					nearbyText = text;
					break;
				}
			}
			return {
				type: fieldElement.getAttribute('type')?.toLowerCase() || (fieldElement.tagName.toLowerCase() === 'textarea' ? 'textarea' : 'text'),
				name: fieldElement.getAttribute('name') || '',
				placeholder,
				min: fieldElement.getAttribute('min'),
				max: fieldElement.getAttribute('max'),
				hint: [fieldElement.getAttribute('aria-label'), placeholder, fieldElement.getAttribute('name'), fieldElement.labels?.[0]?.textContent, nearbyText]
					.filter(Boolean)
					.join(' ')
					.replace(/([a-z])([A-Z])/g, '$1 $2')
					.toLowerCase()
			};
		});

		if (metadata.type === 'radio') {
			const group = metadata.name || `radio-${i}`;
			if (!radioGroups.has(group)) radioGroups.set(group, []);
			radioGroups.get(group).push(field);
			continue;
		}
		if (metadata.type === 'checkbox') {
			const isRequired = (await field.getAttribute('required')) !== null || (await field.getAttribute('aria-required')) === 'true';
			if (isRequired) await field.check();
			continue;
		}
		if (['hidden', 'submit', 'button', 'reset', 'file', 'image', 'color', 'range'].includes(metadata.type)) continue;

		let value;
		if (/search countries/.test(metadata.placeholder.toLowerCase())) {
			await field.fill('South Africa');
			const countryOption = form.getByText('South Africa', { exact: true }).last();
			await countryOption.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null);
			if (await countryOption.isVisible().catch(() => false)) await countryOption.click();
			continue;
		} else if (/country.?code/i.test(metadata.name) || /^\+\d{1,3}$/.test(metadata.placeholder.trim())) {
			value = '+27';
		} else if (metadata.type === 'email' || metadata.hint.includes('email')) {
			value = `alex.morgan.${Date.now()}@example.com`;
		} else if (/whatsapp|mobile|phone|telephone/.test(metadata.hint) || /^e\.g\.\s*\d{6,}/i.test(metadata.placeholder)) {
			value = metadata.placeholder.startsWith('e.g. ') && !metadata.placeholder.includes('+') ? '821234567' : '+27821234567';
		} else if (metadata.type === 'number') {
			const min = Number(metadata.min ?? 1);
			const max = Number(metadata.max ?? 99);
			const preferred = metadata.hint.includes('age') ? 26 : min;
			value = String(Math.max(min, Math.min(max, preferred)));
		} else if (metadata.type === 'date') {
			const date = new Date();
			if (/birth|dob/.test(metadata.hint)) date.setFullYear(date.getFullYear() - 25);
			value = date.toISOString().slice(0, 10);
		} else if (metadata.type === 'month') {
			value = `${new Date().getFullYear() + 4}-06`;
		} else if (/first|given name/.test(metadata.hint)) {
			value = 'Alex';
		} else if (/last|family|surname/.test(metadata.hint)) {
			value = 'Morgan';
		} else if (/middle name/.test(metadata.hint)) {
			value = 'Jordan';
		} else if (/address/.test(metadata.hint)) {
			value = '123 Example Street';
		} else if (/city|town/.test(metadata.hint)) {
			value = 'Boston';
		} else if (/state|province|region/.test(metadata.hint)) {
			value = 'Massachusetts';
		} else if (/postal|zip/.test(metadata.hint)) {
			value = '02110';
		} else if (/language/.test(metadata.hint)) {
			value = 'English';
		} else if (/program enrolled|program name/.test(metadata.hint)) {
			value = 'Bachelor of Science in Computer Science';
		} else if (/student id/.test(metadata.hint)) {
			value = 'TEST-STU-1001';
		} else if (/university code/.test(metadata.hint)) {
			value = 'EXU';
		} else if (/institution|university|school/.test(metadata.hint)) {
			value = 'Example University';
		} else if (/website|url/.test(metadata.hint) || metadata.type === 'url') {
			value = 'https://example.com';
		} else if (metadata.type === 'textarea') {
			value = 'Learner profile created for testing purposes.';
		} else {
			value = 'Alex Morgan';
		}
		await field.fill(value);
	}

	for (const group of radioGroups.values()) {
		await group[0].check();
	}

	await page.waitForTimeout(3000);
	const downloadsDirectory = path.join(os.homedir(), 'Downloads');
	fs.mkdirSync(downloadsDirectory, { recursive: true });
	const screenshotPath = path.join(downloadsDirectory, 'create-new-learner-filled.png');
	await page.screenshot({ path: screenshotPath, fullPage: true });
	console.log(`Saved filled learner form screenshot to: ${screenshotPath}`);

	const submitLearnerButton = page.getByRole('button', { name: 'Create Learner', exact: true }).last();
	await expect(submitLearnerButton).toBeVisible({ timeout: 10000 });
	await submitLearnerButton.click({ timeout: 5000 });
});
