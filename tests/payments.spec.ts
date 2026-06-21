import { test, expect } from '@playwright/test';

test.describe('Payments & Financials Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept active tournament check
    await page.route('/api/tournament/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });

    // Mock players roster fetch (fallback)
    await page.route('/api/players', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { _id: 'p1', name: 'Alice', group: 'pro', stats: { wins: 0, losses: 0, titles: 0 } },
          { _id: 'p2', name: 'Bob', group: 'beg', stats: { wins: 0, losses: 0, titles: 0 } },
        ]),
      });
    });

    // Intercept outstanding debts API
    await page.route(/\/api\/payment\/outstanding-debt.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { playerName: 'Alice', totalOutstanding: 120000 },
          { playerName: 'Bob', totalOutstanding: 45000 },
        ]),
      });
    });

    // Mock payment configs
    await page.route('/api/payment/configs', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { playerName: 'Alice', smashWeight: 1.2, courtRate: 1.0, shuttleRate: 1.0 },
            { playerName: 'Bob', smashWeight: 1.0, courtRate: 1.0, shuttleRate: 1.0 },
          ]),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
      }
    });

    // Intercept summary data API call
    await page.route(/\/api\/payment\/summary.*/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          period: '2026-06',
          sessions: [],
          players: [],
        }),
      });
    });
  });

  test('should display outstanding debts in public view and allow opening player profile modal', async ({ page }) => {
    // Start session as guest (not logged in)
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: false }),
      });
    });

    await page.goto('/');
    await page.click('#nav-payment');

    // Verify outstanding debt is displayed
    await expect(page.locator('.card-title:has-text("Outstanding Debt")')).toBeVisible();
    await expect(page.locator('text=120.000 ₫')).toBeVisible();
    await expect(page.locator('text=45.000 ₫')).toBeVisible();

    // Verify Admin Login button is visible (guest mode)
    await expect(page.locator('#btn-admin-login')).toBeVisible();

    // Verify only "Summary" tab is available for guests
    const tabHeaders = page.locator('.tab');
    await expect(tabHeaders).toHaveCount(1);
    await expect(tabHeaders.first()).toHaveText('💰 Summary');
  });

  test('logged-in admin can manually add a session, review price share calculations, and save', async ({ page }) => {
    // Start session as logged in
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true }),
      });
    });

    await page.goto('/');
    await page.click('#nav-payment');

    // Check we have admin controls
    await expect(page.locator('span:has-text("🔓 Admin")')).toBeVisible();
    const tabHeaders = page.locator('.tab');
    await expect(tabHeaders).toHaveCount(4); // Summary, Add Session, Import, Weights

    // Click "Add Session"
    await page.click('button:has-text("Add Session")');
    await expect(page.locator('.card-title:has-text("New Session")')).toBeVisible();

    // Click "Manual"
    await page.click('button:has-text("Manual")');

    // Fill in manual session fields
    await page.fill('input[type="date"]', '2026-06-21');
    await page.fill('input[placeholder="e.g. Saturday court 3"]', 'Test manual entry');
    await page.fill('input[placeholder="e.g. 300000"]', '200000'); // Court fee
    await page.fill('input[placeholder="e.g. 3"]', '4'); // 4 shuttlecocks
    await page.fill('input[placeholder="e.g. 15000"]', '15000'); // 15000 VND per shuttle

    // Select Alice and Bob from All Players section
    const allPlayersContainer = page.locator('div:has-text("👤 All players") + div');
    await allPlayersContainer.locator('button:has-text("Alice")').click();
    await allPlayersContainer.locator('button:has-text("Bob")').click();

    // Verify total live calculations
    // Total = 200,000 court + (4 * 15,000) shuttle = 260,000 VND
    await expect(page.locator('text=Total: 260.000 ₫')).toBeVisible();

    // Verify share estimate per player (equal split estimate)
    // 2 players = 130,000 each
    await expect(page.locator('text=~130.000 ₫')).toHaveCount(2);

    // Mock API session saving
    let sessionBody: any = null;
    await page.route('/api/payment/sessions', async (route) => {
      sessionBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, sessions: [{ _id: 's100' }] }),
      });
    });

    // Click Save Session
    await page.click('button:has-text("Save Session")');

    // Verify API request content
    expect(sessionBody).toEqual([{
      date: '2026-06-21',
      players: ['Alice', 'Bob'],
      courtFee: 200000,
      numShuttlecocks: 4,
      shuttlecockUnitPrice: 15000,
      note: 'Test manual entry',
    }]);

    await expect(page.locator('text=Session saved!')).toBeVisible();
  });

  test('logged-in admin can modify pricing weights and trigger recalculation', async ({ page }) => {
    // Start session as logged in
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true }),
      });
    });

    await page.goto('/');
    await page.click('#nav-payment');

    // Go to Weights tab
    await page.click('button:has-text("Weights")');
    await expect(page.locator('.card-title:has-text("Payment Rate Settings")')).toBeVisible();

    // Find Alice row and modify court rate to 80% (0.8)
    const aliceRow = page.locator('div:has-text("Alice")').locator('..').first();
    await aliceRow.locator('button:has-text("80%")').first().click();

    // Mock configs saving
    let configSaved = false;
    await page.route('/api/payment/configs', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        expect(body.playerName).toBe('Alice');
        expect(body.courtRate).toBe(0.8);
        configSaved = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
      }
    });

    // Click Save on Alice row
    await page.locator('div').filter({ hasText: 'Alice' }).locator('button:has-text("Save")').first().click();
    expect(configSaved).toBe(true);

    // Mock sessions recalculation
    let recalculateCalled = false;
    await page.route('/api/payment/sessions/recalculate', async (route) => {
      recalculateCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ updated: 12 }),
      });
    });

    // Click Apply to all sessions
    await page.click('button:has-text("Apply to all sessions")');
    expect(recalculateCalled).toBe(true);

    await expect(page.locator('text=Recalculated 12 sessions with latest rates.')).toBeVisible();
  });

  test('logged-in admin can parse CSV and import session details', async ({ page }) => {
    // Start session as logged in
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true }),
      });
    });

    await page.goto('/');
    await page.click('#nav-payment');

    // Go to Import tab
    await page.click('button:has-text("Import")');
    await expect(page.locator('.card-title:has-text("Import Sessions")')).toBeVisible();

    // Paste CSV data
    const csvData = 'date;players;court_fee;num_shuttlecocks;shuttlecock_unit_price;note\n2026-06-15;alice,bob;300000;2;15000;Weekly match';
    await page.fill('textarea', csvData);

    // Verify preview parser displays rows
    await expect(page.locator('.card-title:has-text("Preview")')).toContainText('1 session');
    await expect(page.locator('.rank-table tbody td').first()).toHaveText('2026-06-15');

    // Mock import save API
    let importSent: any = null;
    await page.route('/api/payment/sessions', async (route) => {
      importSent = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, inserted: 1 }),
      });
    });

    // Click Import
    await page.click('button:has-text("Confirm Import")');
    expect(importSent).toEqual([{
      date: '2026-06-15',
      courtFee: 300000,
      numShuttlecocks: 2,
      shuttlecockUnitPrice: 15000,
      players: ['alice', 'bob'],
      note: 'Weekly match',
    }]);

    await expect(page.locator('text=Imported 1 session successfully.')).toBeVisible();
  });
});
