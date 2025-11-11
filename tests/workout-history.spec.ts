import { test, expect } from '@playwright/test';
import { clearLocalStorage, waitForAppReady, createTestWorkout } from './helpers';

test.describe('ワークアウト履歴', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await clearLocalStorage(page);
    await waitForAppReady(page);
  });

  test('空状態が表示される', async ({ page }) => {
    await page.click('button:has-text("ワークアウト履歴")');
    
    await expect(page.locator('h2:has-text("ワークアウト履歴")')).toBeVisible();
    await expect(page.locator('text=まだ完了したワークアウトがありません')).toBeVisible();
  });

  test('完了したワークアウトが履歴に表示される', async ({ page }) => {
    await createTestWorkout(page, '履歴テスト');
    
    await page.click('button[aria-label*="履歴テスト を開始"]');
    
    await page.click('button:has-text("ワークアウトを終了")');
    
    await page.click('button:has-text("ワークアウト履歴")');
    
    await expect(page.locator('h3:has-text("履歴テスト")')).toBeVisible();
  });

  test('履歴を削除できる', async ({ page }) => {
    await createTestWorkout(page, '削除テスト');
    
    await page.click('button[aria-label*="削除テスト を開始"]');
    await page.click('button:has-text("ワークアウトを終了")');
    
    await page.click('button:has-text("ワークアウト履歴")');
    
    const deleteButton = page.locator('button[aria-label*="履歴 削除テスト を削除"]');
    await deleteButton.click();
    
    await expect(page.locator('text=履歴の削除')).toBeVisible();
    await page.click('button:has-text("削除")');
    
    await expect(page.locator('text=まだ完了したワークアウトがありません')).toBeVisible();
  });

  test('一覧に戻るボタンが動作する', async ({ page }) => {
    await page.click('button:has-text("ワークアウト履歴")');
    
    await expect(page.locator('h2:has-text("ワークアウト履歴")')).toBeVisible();
    
    await page.click('button:has-text("一覧に戻る")');
    
    await expect(page.locator('text=まだワークアウトがありません')).toBeVisible();
  });
});

