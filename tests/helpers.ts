import { Page, Locator } from '@playwright/test';

export async function clearLocalStorage(page: Page) {
  // ページコンテキストで実行
  await page.evaluate(() => {
    try {
      localStorage.clear();
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie) {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      }
    } catch (e) {
      // localStorageやCookieへのアクセスが拒否された場合は無視
      console.warn('Failed to clear storage:', e);
    }
  });
}

/**
 * アプリが完全に読み込まれるまで待機
 */
export async function waitForAppReady(page: Page) {
  // メインの見出しが表示されるまで待機
  await page.waitForSelector('h1:has-text("マイワークアウト")', { timeout: 10000 });
  // Reactが完全にレンダリングされるまで少し待機（ネットワークアイドル状態を確認）
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
    // networkidleがタイムアウトしても続行（オフライン環境など）
  });
}

/**
 * 要素が可視で操作可能になるまで待機
 */
export async function waitForElementReady(locator: Locator, timeout = 5000) {
  await locator.waitFor({ state: 'visible', timeout });
  await locator.waitFor({ state: 'attached', timeout });
  // 要素が操作可能か確認
  const isEnabled = await locator.isEnabled().catch(() => false);
  if (!isEnabled) {
    await locator.waitFor({ state: 'visible', timeout: 1000 });
  }
}

/**
 * セレクターが利用可能になるまで待機し、操作可能な要素を返す
 */
export async function waitForSelectableOption(
  page: Page,
  selectLocator: Locator,
  optionValue: string | { index?: number; label?: string },
  timeout = 5000
) {
  await waitForElementReady(selectLocator, timeout);
  
  // オプションが利用可能になるまで待機
  if (typeof optionValue === 'string') {
    await page.waitForFunction(
      (select: HTMLSelectElement, value: string) => {
        return Array.from(select.options).some(opt => opt.value === value);
      },
      selectLocator.first(),
      optionValue,
      { timeout }
    ).catch(() => {
      // タイムアウトしても続行
    });
  }
  
  await selectLocator.selectOption(optionValue);
  
  // 選択が反映されるまで待機
  await page.waitForTimeout(100);
}

/**
 * ボタンがクリック可能になるまで待機してからクリック
 */
export async function waitAndClick(locator: Locator, timeout = 5000) {
  await waitForElementReady(locator, timeout);
  await locator.click({ timeout });
}

/**
 * テキストが表示されるまで待機
 */
export async function waitForText(page: Page, text: string, timeout = 5000) {
  await page.waitForSelector(`text=${text}`, { timeout, state: 'visible' });
}

export async function createTestWorkout(page: Page, workoutName: string) {
  await waitAndClick(page.locator('button:has-text("新しいワークアウトを作成")'));
  await waitForElementReady(page.locator('input[placeholder*="ワークアウト名"]'));
  await page.fill('input[placeholder*="ワークアウト名"]', workoutName);
  
  await waitAndClick(page.locator('button:has-text("エクササイズを追加")'));
  
  // セレクターが表示されるまで待機
  const selects = page.locator('select');
  await waitForElementReady(selects.first());
  
  await waitForSelectableOption(page, selects.nth(0), '全身');
  
  // 種目のセレクターが更新されるまで待機
  await waitForElementReady(selects.nth(1));
  await waitForSelectableOption(page, selects.nth(1), { index: 1 });
  
  await waitAndClick(page.locator('button:has-text("保存")'));
  await waitForText(page, workoutName);
}

