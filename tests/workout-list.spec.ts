import { test, expect } from '@playwright/test';
import { clearLocalStorage, waitForAppReady } from './helpers';

test.describe('ワークアウトリスト', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await clearLocalStorage(page);
    await waitForAppReady(page);
  });

  test('空状態が正しく表示される', async ({ page }) => {
    await expect(page.locator('text=まだワークアウトがありません')).toBeVisible();
    await expect(page.locator('text=下のボタンをクリックして、最初のワークアウトを作成してください！')).toBeVisible();
  });

  test('ナビゲーションボタンが表示される', async ({ page }) => {
    await expect(page.locator('button:has-text("種目マスター")')).toBeVisible();
    await expect(page.locator('button:has-text("ワークアウト履歴")')).toBeVisible();
  });

  test('新しいワークアウト作成ボタンが表示される', async ({ page }) => {
    await expect(page.locator('button:has-text("新しいワークアウトを作成")')).toBeVisible();
  });

  test('ワークアウトカードが表示される', async ({ page }) => {
    await page.click('button:has-text("新しいワークアウトを作成")');
    await page.fill('input[placeholder*="ワークアウト名"]', 'テストワークアウト');
    await page.click('button:has-text("エクササイズを追加")');
    await page.waitForTimeout(300);
    
    const selects = page.locator('select');
    await selects.nth(0).selectOption('全身');
    await selects.nth(1).selectOption({ index: 1 });
    
    await page.click('button:has-text("保存")');
    
    await expect(page.locator('text=テストワークアウト')).toBeVisible();
    await expect(page.locator('text=エクササイズ')).toBeVisible();
  });
});

