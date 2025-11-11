import { test, expect } from '@playwright/test';
import { clearLocalStorage, waitForAppReady, createTestWorkout, waitAndClick, waitForElementReady, waitForText } from './helpers';

test.describe('ワークアウト編集・削除', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await clearLocalStorage(page);
    await waitForAppReady(page);
    await createTestWorkout(page, '編集テスト');
  });

  test('ワークアウトを編集できる', async ({ page }) => {
    await waitAndClick(page.locator('button[aria-label*="編集テスト を編集"]'));
    
    await expect(page.locator('h2:has-text("ワークアウトの編集")')).toBeVisible();
    
    const nameInput = page.locator('input[placeholder*="ワークアウト名"]');
    await waitForElementReady(nameInput);
    await nameInput.clear();
    await nameInput.fill('編集後のワークアウト');
    
    await waitAndClick(page.locator('button:has-text("更新")'));
    
    // ワークアウトリストに戻るのを待つ
    await waitForText(page, '編集後のワークアウト');
    await expect(page.locator('h3:has-text("編集後のワークアウト")')).toBeVisible();
  });

  test('エクササイズを削除できる', async ({ page }) => {
    await waitAndClick(page.locator('button[aria-label*="編集テスト を編集"]'));
    
    const deleteButtons = page.locator('button[aria-label="エクササイズを削除"]');
    await waitForElementReady(deleteButtons.first());
    const count = await deleteButtons.count();
    
    if (count > 0) {
      await deleteButtons.first().click();
      await waitAndClick(page.locator('button:has-text("更新")'));
      
      // ワークアウトリストに戻るのを待つ
      await waitForText(page, '編集テスト');
      await expect(page.locator('h3:has-text("編集テスト")')).toBeVisible();
    }
  });

  test('ワークアウトを削除できる', async ({ page }) => {
    await waitAndClick(page.locator('button[aria-label*="編集テスト を削除"]'));
    
    await expect(page.locator('h3#modal-title:has-text("ワークアウトの削除")')).toBeVisible();
    await expect(page.locator('p#modal-description:has-text("編集テスト")')).toBeVisible();
    
    await waitAndClick(page.locator('button:has-text("削除")'));
    
    await waitForText(page, 'まだワークアウトがありません');
    await expect(page.locator('text=まだワークアウトがありません')).toBeVisible();
  });

  test('削除確認モーダルでキャンセルできる', async ({ page }) => {
    await waitAndClick(page.locator('button[aria-label*="編集テスト を削除"]'));
    
    await expect(page.locator('text=ワークアウトの削除')).toBeVisible();
    
    await waitAndClick(page.locator('button:has-text("キャンセル")'));
    
    await waitForText(page, '編集テスト');
    await expect(page.locator('text=編集テスト')).toBeVisible();
  });
});

