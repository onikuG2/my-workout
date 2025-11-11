import { test, expect } from '@playwright/test';
import { clearLocalStorage, waitForAppReady, waitAndClick, waitForElementReady, waitForText } from './helpers';

test.describe('種目マスター', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await clearLocalStorage(page);
    await waitForAppReady(page);
  });

  test('種目マスター画面を開ける', async ({ page }) => {
    await waitAndClick(page.locator('button:has-text("種目マスター")'));
    
    await expect(page.locator('text=部位・種目マスター')).toBeVisible();
  });

  test('部位を追加できる', async ({ page }) => {
    await waitAndClick(page.locator('button:has-text("種目マスター")'));
    
    const input = page.locator('input[placeholder="新しい部位名"]');
    await waitForElementReady(input);
    await input.fill('テスト部位');
    
    const addButton = page.locator('button[aria-label="部位を追加"]');
    await addButton.scrollIntoViewIfNeeded();
    await waitForElementReady(addButton);
    await addButton.click({ force: true });
    
    await waitForText(page, 'テスト部位');
    await expect(page.locator('text=テスト部位')).toBeVisible();
  });

  test('種目を追加できる', async ({ page }) => {
    await waitAndClick(page.locator('button:has-text("種目マスター")'));
    
    const bodyPartButton = page.locator('button:has-text("全身")');
    await waitForElementReady(bodyPartButton);
    await bodyPartButton.click();
    
    const exerciseInput = page.locator('input[placeholder="新しい種目名"]');
    await waitForElementReady(exerciseInput);
    await exerciseInput.fill('テスト種目');
    
    const addExerciseButton = page.locator('button:has-text("追加"):near(input[placeholder="新しい種目名"])');
    await waitForElementReady(addExerciseButton);
    await addExerciseButton.click();
    
    await waitForText(page, 'テスト種目');
    await expect(page.locator('text=テスト種目')).toBeVisible();
  });

  test('戻るボタンが動作する', async ({ page }) => {
    await waitAndClick(page.locator('button:has-text("種目マスター")'));
    
    await expect(page.locator('text=部位・種目マスター')).toBeVisible();
    
    await waitAndClick(page.locator('button:has-text("戻る")'));
    
    await waitForText(page, 'まだワークアウトがありません');
    await expect(page.locator('text=まだワークアウトがありません')).toBeVisible();
  });
});

