import { test, expect } from '@playwright/test';
import { systems } from '../content.js';

test('all six solutions show approved equipment prices and open the correct dialog', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.system-card')).toHaveCount(6);
  for (const system of systems) {
    const card = page.locator(`#system-${system.id}`);
    await expect(card.locator('h3')).toHaveText(system.name);
    expect((await card.locator('.system-price').innerText()).replace(/\s/g, '')).toBe(`от${system.price}₽`);
    await card.getByRole('button').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('#dialog-title')).toHaveText(system.name);
    await expect(page.getByRole('dialog').getByLabel('Имя', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(card.getByRole('button')).toBeFocused();
  }
  expect(errors).toEqual([]);
});

test('demo forms never submit data or retain values after the dialog closes', async ({ page }) => {
  await page.goto('/');
  await page.locator('.hero [data-form]').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Имя', { exact: true }).fill('Тест');
  await dialog.getByLabel('Телефон', { exact: true }).fill('+7 999 123 45 67');
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await expect(dialog.getByRole('button', { name: 'Отправка пока недоступна' })).toBeDisabled();
  await dialog.getByLabel('Телефон', { exact: true }).press('Enter');
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookie: document.cookie }))).toEqual({ local: 0, session: 0, cookie: '' });
  await dialog.getByRole('button', { name: 'Закрыть форму' }).click();
  await page.locator('.hero [data-form]').click();
  await expect(dialog.getByLabel('Телефон', { exact: true })).toHaveValue('');
});

test('mobile menu, FAQ and layout work at phone, tablet and desktop widths', async ({ page }) => {
  for (const width of [360, 390, 620, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('.system-card')).toHaveCount(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Открыть меню' }).click();
  await expect(page.locator('#mobile-nav')).toBeVisible();
  await page.locator('#mobile-nav').getByRole('link', { name: 'Вопросы инженеру' }).click();
  await expect(page.locator('#mobile-nav')).not.toBeVisible();
  const summary = page.locator('#faq-list summary').first();
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#faq-list details').first()).toHaveAttribute('open', '');
});

test('modal traps keyboard focus and closes using its close button', async ({ page }) => {
  await page.goto('/');
  await page.locator('.hero [data-form]').click();
  const dialog = page.getByRole('dialog');
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('dialog')))).toBe(true);
  }
  await dialog.getByRole('button', { name: 'Закрыть форму' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.hero [data-form]')).toBeFocused();
});

test('configured CRM form keeps a direct link available if its loader fails', async ({ page }) => {
  await page.route('**/forms-config.js', route => route.fulfill({
    contentType: 'text/javascript',
    body: `export const formsConfig = {general: { id: '1', code: 'demo', loaderUrl: 'https://forms.example.invalid/loader.js', url: 'https://forms.example.invalid/form/' }, uv: null, clarity: null, sorption: null, iron: null, softening: null, complex: null};`
  }));
  await page.route('https://forms.example.invalid/**', route => route.abort());
  await page.goto('/');
  await expect(page.locator('#selection').getByRole('link', { name: 'Открыть форму в отдельной вкладке' })).toHaveAttribute('href', 'https://forms.example.invalid/form/');
  await page.locator('.hero [data-form]').click();
  await expect(page.getByRole('dialog').getByRole('link', { name: 'Открыть форму в отдельной вкладке' })).toBeVisible();
});

test('preview blocks indexing, has no missing images and captures desktop and mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  const robots = await page.request.get('/robots.txt');
  expect(await robots.text()).toContain('Disallow: /');
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
});
