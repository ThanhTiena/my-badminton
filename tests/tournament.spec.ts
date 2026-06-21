import { test, expect } from '@playwright/test';

test.describe('Tournament Lifecycle Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start session as logged-in admin
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true }),
      });
    });

    // Mock players roster fetch
    await page.route('/api/players', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { _id: 'p1', name: 'Alice', group: 'pro', stats: { titles: 0, wins: 0, losses: 0 } },
          { _id: 'p2', name: 'Bob', group: 'pro', stats: { titles: 0, wins: 0, losses: 0 } },
          { _id: 'p3', name: 'Charlie', group: 'beg', stats: { titles: 0, wins: 0, losses: 0 } },
          { _id: 'p4', name: 'Dave', group: 'beg', stats: { titles: 0, wins: 0, losses: 0 } },
        ]),
      });
    });

    // Intercept active tournament check (initially no active tournament)
    await page.route('/api/tournament/active', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(null),
        });
      } else if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true }),
        });
      }
    });

    // Mock bets API & history saving API
    await page.route('/api/bets/settle', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.route('/api/history', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });
  });

  test('should go through setup, select players, start singles elimination, play matches, advance round, and see champion screen', async ({ page }) => {
    await page.goto('/');

    // 1. Click tournament button -> redirects to roster page since no tournament is running
    await page.click('#nav-tournament');
    await expect(page.locator('p.page-title')).toContainText('Player Roster');

    // 2. Click "Start a Tournament" to go to Setup screen
    await page.click('button:has-text("Start a Tournament")');
    await expect(page.locator('p.page-title')).toContainText('Set Up Tournament');

    // 3. Select all 4 players
    const aliceBtn = page.locator('.player-select-item:has-text("Alice")');
    const bobBtn = page.locator('.player-select-item:has-text("Bob")');
    const charlieBtn = page.locator('.player-select-item:has-text("Charlie")');
    const daveBtn = page.locator('.player-select-item:has-text("Dave")');

    await aliceBtn.click();
    await bobBtn.click();
    await charlieBtn.click();
    await daveBtn.click();

    // Verify pills count
    await expect(page.locator('.summary-row:has-text("Selected") .summary-value')).toHaveText('4');

    // Choose Singles + Single Elimination (already default, but let's click to be sure)
    await page.click('.pill:has-text("Singles")');
    await page.click('.pill:has-text("Single Elimination")');

    // 4. Click Start Tournament
    await page.click('button:has-text("Start Tournament")');

    // Now we are on the active tournament view
    await expect(page.locator('.round-badge')).toContainText('Round 1');
    await expect(page.locator('.match-card')).toHaveCount(2);

    // 5. Play Match 1 (Get the first team name dynamically due to bracket shuffles)
    const match1 = page.locator('.match-card').first();
    const team1A_name = (await match1.locator('.match-team-name').first().textContent())?.trim() || '';

    // Tap team1A score side to add point
    const team1AScoreTap = match1.locator('.score-side', { hasText: team1A_name }).locator('.score-tap-btn');
    await team1AScoreTap.click();
    await expect(team1AScoreTap).toHaveText('1');

    // Use +2 and +5 quick add buttons on team1A to increase score
    const team1AQuickRow = match1.locator('.score-side', { hasText: team1A_name }).locator('.quick-add-row');
    await team1AQuickRow.locator('button[title="+5"]').click();
    await expect(team1AScoreTap).toHaveText('6');

    // Mark winner for Match 1: declare team1A the winner
    await match1.locator('.winner-btns button').first().click(); // Click first team winner button
    await expect(match1.locator('.completed-winner')).toContainText(`${team1A_name} wins`);

    // 6. Play Match 2 (Get the first team name of match 2 dynamically)
    const match2 = page.locator('.match-card').nth(1);
    const team2A_name = (await match2.locator('.match-team-name').first().textContent())?.trim() || '';

    // Declare team2A winner directly
    await match2.locator('.winner-btns button').first().click();
    await expect(match2.locator('.completed-winner')).toContainText(`${team2A_name} wins`);

    // 7. Verify round advances to Finals
    // Wait for the banner / new round badge to transition
    await expect(page.locator('.round-badge')).toContainText('Final');

    // Verify there is only 1 match (Finals: team1A vs team2A)
    await expect(page.locator('.match-card')).toHaveCount(1);
    const finalMatch = page.locator('.match-card').first();
    await expect(finalMatch.locator('.scoreboard')).toContainText(team1A_name);
    await expect(finalMatch.locator('.scoreboard')).toContainText(team2A_name);

    // 8. Declare team1A the Champion
    await finalMatch.locator('.winner-btns button', { hasText: team1A_name }).click();

    // 9. Verify Champion screen
    await expect(page.locator('.champion-title')).toContainText('Tournament Champion');
    await expect(page.locator('.champion-name')).toContainText(team1A_name);

    // Handle confirm dialog when resetting/starting new tournament
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Start a new tournament');
      await dialog.accept();
    });

    // Click "New Tournament" button to reset view to setup
    await page.click('button:has-text("New Tournament")');
    await expect(page.locator('p.page-title')).toContainText('Set Up Tournament');
  });
});
