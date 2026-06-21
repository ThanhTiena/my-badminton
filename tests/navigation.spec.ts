import { test, expect } from '@playwright/test';

test.describe('SmashTour Badminton Club Navigation & UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept auth check
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: false }),
      });
    });

    // Intercept active tournament check
    await page.route('/api/tournament/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    // Intercept players endpoint (used by standings/rankings)
    await page.route('/api/players', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { _id: 'p1', name: 'Alice', group: 'pro', rankScore: 1200, stats: { wins: 5, losses: 2, titles: 1 } },
        ]),
      });
    });

    // Intercept rankings endpoint
    await page.route('/api/rankings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { _id: 'p1', name: 'Alice', group: 'pro', rankScore: 1200, stats: { wins: 5, losses: 2, titles: 1, tournamentsPlayed: 1 } },
        ]),
      });
    });

    // Intercept outstanding debts
    await page.route(/\/api\/payment\/outstanding-debt.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  test('should load the homepage and show sidebar public tabs', async ({ page }) => {
    // 1. Visit page
    await page.goto('/');

    // 2. Verify sidebar contains expected logos and tabs
    const logoText = page.locator('.logo-text');
    await expect(logoText).toHaveText('SmashTour');

    const rankingsNav = page.locator('#nav-rankings');
    await expect(rankingsNav).toBeVisible();
    await expect(rankingsNav).toContainText('Rankings');

    const historyNav = page.locator('#nav-history');
    await expect(historyNav).toBeVisible();
    await expect(historyNav).toContainText('History');

    const paymentsNav = page.locator('#nav-payment');
    await expect(paymentsNav).toBeVisible();
    await expect(paymentsNav).toContainText('Payments');
  });

  test('should navigate to Rankings and render standings table', async ({ page }) => {
    await page.goto('/');
    
    // Click Rankings nav
    await page.click('#nav-rankings');
    
    // Expect standings table headers to be visible
    const tableHeader = page.locator('.standings-table th').first();
    await expect(tableHeader).toBeVisible();
  });

  test('should navigate to Payments page and render summary by default', async ({ page }) => {
    await page.goto('/');
    
    // Click Payments nav
    await page.click('#nav-payment');
    
    // Verify payments page has loaded (check header title)
    const pageHeader = page.locator('.page-title').first();
    await expect(pageHeader).toContainText('Payment');

    // Default tab should be Summary (look for summary table or outstanding debt widget)
    const summaryCardTitle = page.locator('.card-title').first();
    await expect(summaryCardTitle).toBeVisible();
  });

  test('should open the admin login modal when clicked', async ({ page }) => {
    await page.goto('/');

    // Click Admin Login button in sidebar
    await page.click('#btn-admin-login');

    // Dialog modal should be visible
    const modalDialog = page.locator('role=dialog[name="Admin login"]');
    await expect(modalDialog).toBeVisible();

    // Verify presence of input fields
    const usernameInput = page.locator('#login-username');
    await expect(usernameInput).toBeVisible();

    const passwordInput = page.locator('#login-password');
    await expect(passwordInput).toBeVisible();
  });
});
