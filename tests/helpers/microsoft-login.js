// @ts-check

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

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
    const fallbackCheckbox = page.locator('input[type="checkbox"][aria-label*="Don\'t show me again"], input[type="checkbox"][name*="dont"], input[type="checkbox"][id*="dont"]').first();
    if (await fallbackCheckbox.count()) {
      await fallbackCheckbox.check({ timeout: 5000 }).catch(() => null);
    }
  }

  const yesButton = page.locator('button:has-text("Yes"), input[type="submit"][value="Yes"], button:has-text("Yes, sign in")').first();
  try {
    await yesButton.waitFor({ state: 'visible', timeout: 5000 });
    await yesButton.click({ timeout: 5000 });
  } catch (e) {
    // No consent/approval prompt was shown.
  }
}

/**
 * Navigate to Nova Canopy and complete Microsoft authentication.
 *
 * @param {import('@playwright/test').Page} page
 */
async function loginWithMicrosoft(page) {
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
      console.log(`Clicked selector: ${selector}`);
      clicked = true;
      break;
    } catch (e) {
      // Try the next selector.
    }
  }

  if (!clicked) {
    const fuzzy = page.locator('text=/.*Microsoft.*/i').first();
    try {
      await fuzzy.waitFor({ state: 'visible', timeout: 2000 });
      await fuzzy.click({ timeout: 5000 });
      console.log('Clicked fuzzy text locator for "Microsoft"');
      clicked = true;
    } catch (e) {
      // The login button was not found.
    }
  }

  if (!clicked) {
    throw new Error('Microsoft login button not found. Check selectors or page structure.');
  }

  const authPage = (await authPopupPromise) || page;
  await authPage.waitForLoadState('domcontentloaded');
  await fillMicrosoftCredentials(authPage, MICROSOFT_LOGIN_EMAIL, MICROSOFT_LOGIN_PASSWORD);

  if (authPage !== page) {
    await authPage.waitForEvent('close', { timeout: 30000 }).catch(() => null);
  }

  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);
}

module.exports = { loginWithMicrosoft };
