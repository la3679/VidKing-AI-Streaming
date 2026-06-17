import { test, expect } from '@playwright/test';

/**
 * Smoke tests for the running app. These exercise the shell and search UI,
 * which work without a TMDB key (rows simply stay empty / show error states).
 */

test('homepage renders the shell', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/VidKing/i);
  // Sidebar Home control and the search box are always present.
  await expect(page.getByRole('button', { name: /home/i })).toBeVisible();
  await expect(page.getByRole('searchbox')).toBeVisible();
});

test('search box accepts input', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('searchbox');
  await search.fill('inception');
  await expect(search).toHaveValue('inception');
});

test('AI copilot opens', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /open ai copilot/i }).first().click();
  await expect(page.getByRole('dialog', { name: /ai assistant/i })).toBeVisible();
});
