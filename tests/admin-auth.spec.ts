import { test, expect } from '@playwright/test';

test.describe('Admin Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept initial auth check to start as guest (not authenticated)
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: false }),
      });
    });

    // Intercept active tournament checks to ensure deterministic behavior
    await page.route('/api/tournament/active', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      });
    });
  });

  test('should show admin lock icons for guests, fail login on bad credentials, and login successfully with correct credentials', async ({ page }) => {
    await page.goto('/');

    // 1. Verify guest view shows lock icons on admin nav items
    const rosterNav = page.locator('#nav-roster');
    const tournamentNav = page.locator('#nav-tournament');
    const analyticsNav = page.locator('#nav-analytics');

    await expect(rosterNav.locator('.lock-icon')).toBeVisible();
    await expect(tournamentNav.locator('.lock-icon')).toBeVisible();
    await expect(analyticsNav.locator('.lock-icon')).toBeVisible();

    // 2. Click a locked tab (like roster) should trigger login modal
    await rosterNav.click();
    const loginModal = page.locator('role=dialog[name="Admin login"]');
    await expect(loginModal).toBeVisible();

    // 3. Enter wrong credentials & verify error handling
    await page.route('/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials.' }),
      });
    });

    await page.fill('#login-username', 'wronguser');
    await page.fill('#login-password', 'wrongpass');
    await page.click('#btn-login-submit');

    const errorAlert = page.locator('.alert-danger');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Invalid credentials.');

    // 4. Enter correct credentials and log in successfully
    await page.route('/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, username: 'admin' }),
      });
    });

    await page.fill('#login-username', 'admin');
    await page.fill('#login-password', 'admin123');
    await page.click('#btn-login-submit');

    // Modal should close
    await expect(loginModal).not.toBeVisible();

    // Lock icons should disappear
    await expect(rosterNav.locator('.lock-icon')).not.toBeVisible();
    await expect(tournamentNav.locator('.lock-icon')).not.toBeVisible();
    await expect(analyticsNav.locator('.lock-icon')).not.toBeVisible();

    // Should display Admin status/profile at the bottom
    await expect(page.locator('.admin-name')).toHaveText('Admin');
  });

  test('should allow logged-in admin to trigger change password modal and logout', async ({ page }) => {
    // Start session as logged in
    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ authenticated: true }),
      });
    });

    await page.goto('/');

    // Check we are logged in from mount
    const rosterNav = page.locator('#nav-roster');
    await expect(rosterNav.locator('.lock-icon')).not.toBeVisible();
    await expect(page.locator('.admin-name')).toHaveText('Admin');

    // Trigger change password modal
    await page.click('button:has-text("Password")');
    const changePwModal = page.locator('role=dialog[name="Change password"]');
    await expect(changePwModal).toBeVisible();

    // Test password change API call
    await page.route('/api/auth/change-password', async (route) => {
      expect(route.request().postDataJSON()).toEqual({
        currentPassword: 'admin123',
        newPassword: 'newsecurepassword',
      });
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.fill('#cp-current', 'admin123');
    await page.fill('#cp-new', 'newsecurepassword');
    await page.fill('#cp-confirm', 'newsecurepassword');
    await page.click('button:has-text("Update Password")');

    const successAlert = page.locator('.alert-success');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('Password changed successfully!');

    // Close change pw modal
    await page.click('button:has-text("Cancel")');
    await expect(changePwModal).not.toBeVisible();

    // Test logout
    let logoutCalled = false;
    await page.route('/api/auth/logout', async (route) => {
      logoutCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.click('button:has-text("Exit")');
    expect(logoutCalled).toBe(true);

    // Lock icons should reappear
    await expect(rosterNav.locator('.lock-icon')).toBeVisible();
    await expect(page.locator('#btn-admin-login')).toBeVisible();
  });
});
