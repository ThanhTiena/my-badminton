import { test, expect } from '@playwright/test';

test.describe('Player Roster Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start session as logged-in admin (required for accessing roster view)
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true }),
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
  });

  test('should load player roster, add players, handle validation errors, edit, toggle group, delete, and view profile modal', async ({ page }) => {
    // 1. Setup mocked initial players list
    const mockPlayers = [
      {
        _id: 'p1',
        name: 'Alice Pro',
        group: 'pro',
        stats: { titles: 2, wins: 10, losses: 5, tournamentsPlayed: 5, pointsScored: 120, pointsConceded: 90 },
        rankScore: 1500,
        active: true,
      },
      {
        _id: 'p2',
        name: 'Bob Beg',
        group: 'beg',
        stats: { titles: 0, wins: 2, losses: 8, tournamentsPlayed: 3, pointsScored: 50, pointsConceded: 110 },
        rankScore: 1000,
        active: true,
      },
    ];

    let postShouldConflict = false;

    await page.route('/api/players', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockPlayers),
        });
      } else if (method === 'POST') {
        if (postShouldConflict) {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'A player with that name already exists.' }),
          });
        } else {
          const body = route.request().postDataJSON();
          mockPlayers.push({
            _id: `p${mockPlayers.length + 1}`,
            name: body.name,
            group: body.group,
            stats: { titles: 0, wins: 0, losses: 0, tournamentsPlayed: 0, pointsScored: 0, pointsConceded: 0 },
            rankScore: 1000,
            active: true,
          });
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true }),
          });
        }
      }
    });

    // Go to Roster view
    await page.goto('/');
    await page.click('#nav-roster');

    // 2. Check current roster listing
    await expect(page.locator('p.page-title')).toContainText('Player Roster');
    await expect(page.locator('.player-card')).toHaveCount(2);
    await expect(page.locator('.player-card').first().locator('.name')).toHaveText('Alice Pro');

    // Check stats card
    await expect(page.locator('.summary-row:has-text("Total Players") .summary-value')).toHaveText('2');
    await expect(page.locator('.summary-row:has-text("Pro Players") .summary-value')).toHaveText('1');

    // 3. Add duplicate name error handling
    postShouldConflict = true;

    await page.fill('[placeholder="Player name…"]', 'Alice Pro');
    await page.click('button:has-text("Add Player")');
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator('.alert-danger')).toContainText('A player with that name already exists.');

    // 4. Add a new player successfully (Charlie as Beginner)
    // Restore post logic for success
    postShouldConflict = false;

    await page.fill('[placeholder="Player name…"]', 'Charlie');
    await page.click('button:has-text("Beginner")');
    await page.click('button:has-text("Add Player")');

    // Count should update to 3
    await expect(page.locator('.player-card')).toHaveCount(3);
    await expect(page.locator('.player-card').nth(2).locator('.name')).toHaveText('Charlie');

    // 5. Edit and Rename Player (Bob Beg -> Bobby)
    await page.route('/api/players/p2', async (route) => {
      expect(route.request().postDataJSON()).toEqual({ name: 'Bobby' });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    const bobCard = page.locator('.player-card:has-text("Bob Beg")');
    await bobCard.locator('button:has-text("Edit")').click();

    // The name text changes when editing. Locate the input globally since it is now active.
    const editInput = page.locator('.player-card input');
    await editInput.fill('Bobby');
    await editInput.press('Enter');

    // Verify Bob is now Bobby
    await expect(page.locator('.player-card:has-text("Bobby")')).toBeVisible();

    // 6. Switch player group (Bobby to Pro)
    await page.route('/api/players/p2', async (route) => {
      expect(route.request().postDataJSON()).toEqual({ group: 'pro' });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    const bobbyCard = page.locator('.player-card:has-text("Bobby")');
    await bobbyCard.locator('button:has-text("To Pro")').click();
    await expect(bobbyCard.locator('.pc-badge')).toHaveText('🥇 Pro');

    // 7. Delete Player (Charlie)
    let deleteCalled = false;
    await page.route('/api/players/p3', async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
      }
    });

    // Handle confirm dialog
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Remove this player');
      await dialog.accept();
    });

    const charlieCard = page.locator('.player-card:has-text("Charlie")');
    await charlieCard.locator('button:has-text("Remove")').click();
    expect(deleteCalled).toBe(true);

    // Verify card is removed
    await expect(page.locator('.player-card')).toHaveCount(2);

    // 8. Open Player Profile Modal & verify tabs
    // Mock player profile debt endpoint
    await page.route('/api/payment/outstanding-debt?playerName=Alice%20Pro', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          playerName: 'Alice Pro',
          totalOutstanding: 150000,
          breakdown: [
            { period: '2026-05', owed: 150000, paid: 0, remaining: 150000 },
          ],
          sessions: [
            { sessionDate: '2026-05-10', amountOwed: 150000, amountOwedRounded: 150000, note: 'Played 2 sessions' },
          ],
        }),
      });
    });

    // Click on Alice Pro body to open profile
    await page.locator('.player-card:has-text("Alice Pro") .pc-body').click();
    const profileModal = page.locator('role=dialog[name="Alice Pro Profile"]');
    await expect(profileModal).toBeVisible();

    // Verify Stats & Overview values
    await expect(profileModal.locator('button:has-text("Stats")')).toBeVisible();
    await expect(profileModal.locator('text=10 wins')).toBeVisible(); // Wins count

    // Switch to Financials tab
    await profileModal.locator('button:has-text("Financials")').click();
    await expect(profileModal.locator('text=150.000 ₫').first()).toBeVisible();

    // Switch to Session Logs tab
    await profileModal.locator('button:has-text("Session Logs")').click();
    await expect(profileModal.locator('text=Played 2 sessions')).toBeVisible();

    // Close modal
    await profileModal.locator('button:has-text("✕")').click();
    await expect(profileModal).not.toBeVisible();
  });
});
