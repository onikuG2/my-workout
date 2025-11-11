import { test, expect } from '@playwright/test';
import { clearLocalStorage, waitForAppReady, createTestWorkout } from './helpers';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('データ管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await clearLocalStorage(page);
    await waitForAppReady(page);
  });

  test('データをエクスポートできる', async ({ page }) => {
    await createTestWorkout(page, 'エクスポートテスト');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("エクスポート")');
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toBe('my-workouts.json');
    
    const testDir = path.join(__dirname, '..');
    const filePath = path.join(testDir, 'test-download.json');
    
    try {
      await download.saveAs(filePath);
      
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      expect(data.workouts).toBeDefined();
      expect(Array.isArray(data.workouts)).toBe(true);
      expect(data.workouts.some((w: any) => w.name === 'エクスポートテスト')).toBe(true);
    } finally {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  });

  test('データをインポートできる', async ({ page }) => {
    const testData = {
      workouts: [
        {
          id: 'test-import-1',
          name: 'インポートテスト',
          exercises: [
            {
              id: 'ex-1',
              name: 'プッシュアップ',
              duration: 30,
              restDuration: 15,
              sets: 3,
              reps: 0,
              weight: 0,
            },
          ],
        },
      ],
      version: '1.0',
    };
    
    const testDir = path.join(__dirname, '..');
    const testFilePath = path.join(testDir, 'test-import.json');
    
    try {
      fs.writeFileSync(testFilePath, JSON.stringify(testData));
      
      await page.click('button:has-text("インポート")');
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testFilePath);
      
      await expect(page.locator('text=データのインポート')).toBeVisible();
      
      await page.click('button:has-text("上書き")');
      
      await expect(page.locator('text=インポートテスト')).toBeVisible();
    } finally {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  test('エクスポートするデータがない場合のエラー', async ({ page }) => {
    await page.click('button:has-text("エクスポート")');
    
    await expect(page.locator('text=エクスポートするワークアウトがありません')).toBeVisible();
  });
});

