// @ts-check

const { test, expect } = require('@playwright/test');
const { loginWithMicrosoft } = require('./helpers/microsoft-login');

if (require.main === module) {
  console.error('This test file must be run with the Playwright test runner, not Node.js.');
  console.error('Use: npx playwright test tests/admin_inviteUser.spec.js');
  process.exit(1);
}

test('Navigate and click Microsoft login button', async ({ page }) => {
  await loginWithMicrosoft(page);

  const landingHeading = page.locator('h1');
  await expect(landingHeading).toHaveText('Welcome back, Fortune', { timeout: 20000 });

  const menuButton = page.locator('[id="radix-:r21:"]').first();
  await menuButton.waitFor({ state: 'visible', timeout: 15000 });
  await menuButton.click({ timeout: 5000 });

  const usersOption = page.locator('span').filter({ hasText: 'Users' }).first();
  await usersOption.waitFor({ state: 'visible', timeout: 15000 });
  await usersOption.click({ timeout: 5000 });

  const inviteUserButton = page.getByRole('button', { name: 'Invite User', exact: true });
  await inviteUserButton.waitFor({ state: 'visible', timeout: 15000 });
  await inviteUserButton.click({ timeout: 5000 });

  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 15000 });
  await emailInput.fill('xyb@gmail.com');

  const roleButton = page.locator('div[role="button"]').first();
  await roleButton.waitFor({ state: 'visible', timeout: 15000 });
  await roleButton.click({ timeout: 5000 });

  const optionLabels = page.locator('label.flex.items-center.gap-3.px-4.py-2\\.5.border-b.border-gray-100.last\\:border-b-0.cursor-pointer.hover\\:bg-gray-50');
  const lastOptionLabel = optionLabels.last();
  await lastOptionLabel.waitFor({ state: 'visible', timeout: 15000 });
  await lastOptionLabel.locator('input[type="checkbox"]').click({ timeout: 5000 });
  await page.waitForTimeout(3000);

  console.log('Done: Microsoft login sequence started with credentials from environment variables.');
});
