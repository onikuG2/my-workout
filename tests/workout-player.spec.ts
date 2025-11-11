import { test, expect } from '@playwright/test';
import { clearLocalStorage, waitForAppReady, createTestWorkout } from './helpers';

test.describe('ワークアウトプレイヤー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await clearLocalStorage(page);
    await waitForAppReady(page);
    await createTestWorkout(page, 'プレイヤーテスト');
  });

  test('ワークアウトを開始できる', async ({ page }) => {
    const startButton = page.locator('button[aria-label*="プレイヤーテスト を開始"]');
    await startButton.click();
    
    await expect(page.locator('h2:has-text("プレイヤーテスト")')).toBeVisible();
    await expect(page.locator('p.text-lg:has-text("ワーク")')).toBeVisible();
  });

  test('タイマーが表示される', async ({ page }) => {
    await page.click('button[aria-label*="プレイヤーテスト を開始"]');
    
    await expect(page.locator('p.text-lg:has-text("ワーク")')).toBeVisible();
    await expect(page.locator('.font-mono')).toBeVisible();
  });

  test('一時停止・再開ができる', async ({ page }) => {
    await page.click('button[aria-label*="プレイヤーテスト を開始"]');
    await page.waitForTimeout(500);
    
    // 最初は一時停止状態なので、クリックすると開始になる
    const playPauseButton = page.locator('button[aria-label="開始"], button[aria-label="一時停止"]');
    await expect(playPauseButton).toBeVisible();
    
    // 開始ボタンをクリックして一時停止状態にする
    await playPauseButton.click();
    await page.waitForTimeout(200);
    
    // 一時停止ボタンが表示されることを確認
    await expect(page.locator('button[aria-label="一時停止"]')).toBeVisible();
    
    // 一時停止ボタンをクリックして再開
    await page.locator('button[aria-label="一時停止"]').click();
    await page.waitForTimeout(200);
    
    // 開始ボタンが表示されることを確認
    await expect(page.locator('button[aria-label="開始"]')).toBeVisible();
  });

  test('スキップボタンが動作する', async ({ page }) => {
    await page.click('button[aria-label*="プレイヤーテスト を開始"]');
    await page.waitForTimeout(500);
    
    const skipForwardButton = page.locator('button[aria-label="次へ進む"]');
    const skipBackButton = page.locator('button[aria-label="前へ戻る"]');
    
    await expect(skipForwardButton).toBeVisible();
    await expect(skipBackButton).toBeVisible();
  });

  test('ワークアウトを終了できる', async ({ page }) => {
    await page.click('button[aria-label*="プレイヤーテスト を開始"]');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("ワークアウトを終了")');
    
    // ワークアウトリストに戻る
    await expect(page.locator('text=プレイヤーテスト')).toBeVisible();
  });

  test('進捗バーが表示される', async ({ page }) => {
    await page.click('button[aria-label*="プレイヤーテスト を開始"]');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=進捗')).toBeVisible();
    await expect(page.locator('.bg-cyan-500.h-2')).toBeVisible();
  });
});

