import { test, expect } from '@playwright/test';
import { clearLocalStorage, waitForAppReady, waitAndClick, waitForElementReady, waitForSelectableOption, waitForText } from './helpers';

test.describe('ワークアウト作成', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await clearLocalStorage(page);
    await waitForAppReady(page);
  });

  test('新しいワークアウトを作成できる', async ({ page }) => {
    await waitAndClick(page.locator('button:has-text("新しいワークアウトを作成")'));
    await expect(page.locator('h2:has-text("新しいワークアウトの作成")')).toBeVisible();
    
    const nameInput = page.locator('input[placeholder*="ワークアウト名"]');
    await waitForElementReady(nameInput);
    await nameInput.fill('全身HIIT');
    
    await waitAndClick(page.locator('button:has-text("エクササイズを追加")'));
    
    const selects = page.locator('select');
    await waitForElementReady(selects.first());
    await waitForSelectableOption(page, selects.nth(0), '全身');
    await waitForElementReady(selects.nth(1));
    await waitForSelectableOption(page, selects.nth(1), { index: 1 });
    
    await waitAndClick(page.locator('button:has-text("保存")'));
    
    await waitForText(page, '全身HIIT');
    await expect(page.locator('text=全身HIIT')).toBeVisible();
  });

  test('複数のエクササイズを追加できる', async ({ page }) => {
    await waitAndClick(page.locator('button:has-text("新しいワークアウトを作成")'));
    
    const nameInput = page.locator('input[placeholder*="ワークアウト名"]');
    await waitForElementReady(nameInput);
    await nameInput.fill('複数エクササイズテスト');
    
    await waitAndClick(page.locator('button:has-text("エクササイズを追加")'));
    
    // 最初のエクササイズの部位と種目を選択
    const selects = page.locator('select');
    await waitForElementReady(selects.first());
    await waitForSelectableOption(page, selects.nth(0), '全身');
    
    await waitForElementReady(selects.nth(1));
    await waitForSelectableOption(page, selects.nth(1), { index: 1 });
    
    await waitAndClick(page.locator('button:has-text("エクササイズを追加")'));
    
    // 2番目のエクササイズの部位と種目を選択
    // 各エクササイズには部位と種目の2つのselectがあるので、2番目のエクササイズは4番目と5番目のselect
    await waitForElementReady(selects.nth(2));
    await waitForSelectableOption(page, selects.nth(2), '脚');
    
    await waitForElementReady(selects.nth(3));
    await waitForSelectableOption(page, selects.nth(3), { index: 1 });
    
    await waitAndClick(page.locator('button:has-text("保存")'));
    
    await waitForText(page, '複数エクササイズテスト');
    await expect(page.locator('text=複数エクササイズテスト')).toBeVisible();
    await expect(page.locator('text=2 エクササイズ')).toBeVisible();
  });

  test('バリデーションエラーが表示される', async ({ page }) => {
    await waitAndClick(page.locator('button:has-text("新しいワークアウトを作成")'));
    
    await waitAndClick(page.locator('button:has-text("保存")'));
    
    await waitForText(page, 'ワークアウト名を入力してください');
    await expect(page.locator('text=ワークアウト名を入力してください')).toBeVisible();
  });

  test('エクササイズなしで保存できない', async ({ page }) => {
    await waitAndClick(page.locator('button:has-text("新しいワークアウトを作成")'));
    
    const nameInput = page.locator('input[placeholder*="ワークアウト名"]');
    await waitForElementReady(nameInput);
    await nameInput.fill('エクササイズなし');
    
    await waitAndClick(page.locator('button:has-text("保存")'));
    
    await waitForText(page, '少なくとも1つのエクササイズを追加してください');
    await expect(page.locator('text=少なくとも1つのエクササイズを追加してください')).toBeVisible();
  });

  test('エクササイズ名なしで保存できない', async ({ page }) => {
    await waitAndClick(page.locator('button:has-text("新しいワークアウトを作成")'));
    
    const nameInput = page.locator('input[placeholder*="ワークアウト名"]');
    await waitForElementReady(nameInput);
    await nameInput.fill('種目名なし');
    
    await waitAndClick(page.locator('button:has-text("エクササイズを追加")'));
    
    // エクササイズが追加されるまで待機
    await waitForElementReady(page.locator('select').first());
    
    await waitAndClick(page.locator('button:has-text("保存")'));
    
    // AlertModalで表示されるメッセージを待つ
    await waitForText(page, 'すべてのエクササイズに名前を入力してください。');
    await expect(page.locator('text=すべてのエクササイズに名前を入力してください。')).toBeVisible({ timeout: 5000 });
  });

  test('キャンセルボタンで戻れる', async ({ page }) => {
    await waitAndClick(page.locator('button:has-text("新しいワークアウトを作成")'));
    await expect(page.locator('h2:has-text("新しいワークアウトの作成")')).toBeVisible();
    
    await waitAndClick(page.locator('button:has-text("キャンセル")'));
    
    await waitForText(page, 'まだワークアウトがありません');
    await expect(page.locator('text=まだワークアウトがありません')).toBeVisible();
  });
});

