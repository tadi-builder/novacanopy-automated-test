// @ts-check

const { test, expect } = require('@playwright/test');
const { loginWithMicrosoft } = require('./helpers/microsoft-login');

if (require.main === module) {
  console.error('This test file must be run with the Playwright test runner, not Node.js.');
  console.error('Use: npx playwright test tests/content_create_comm_journal.spec.js');
  process.exit(1);
}

test('Navigate and click Microsoft login button', async ({ page }) => {
  await loginWithMicrosoft(page);

  const landingHeading = page.locator('h1');
  await expect(landingHeading).toHaveText('Welcome back, Fortune', { timeout: 20000 });

  const menuButton = page.locator('#radix-\\:r1t\\:');
  await menuButton.waitFor({ state: 'visible', timeout: 20000 });
  await menuButton.click();

  const communityJournalsOption = page.locator('span', { hasText: 'Community Journals' }).first();
  await communityJournalsOption.waitFor({ state: 'visible', timeout: 20000 });
  await communityJournalsOption.click();

  const newJournalButton = page.getByRole('button', { name: 'New Journal' });
  await newJournalButton.waitFor({ state: 'visible', timeout: 20000 });
  await newJournalButton.click();

  const firstInput = page.locator('input').first();
  await firstInput.waitFor({ state: 'visible', timeout: 20000 });
  await firstInput.fill('Community Circle Example Test');

  const createJournalButton = page.getByRole('button', { name: 'Create journal →' });
  await createJournalButton.waitFor({ state: 'visible', timeout: 20000 });
  await createJournalButton.click();

  const reflectionButton = page.locator('button:has(span)', { hasText: 'Reflection' }).first();
  await reflectionButton.waitFor({ state: 'visible', timeout: 20000 });
  await reflectionButton.click();

  await page.waitForTimeout(3000);

  console.log('Done: Microsoft login sequence started with credentials from environment variables, menu opened, Community Journals selected, New Journal clicked, the first input was filled, Create journal was submitted, and the Reflection action was selected.');
});
