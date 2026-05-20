# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> navigation to live page from start button
- Location: tests/e2e/home.spec.ts:14:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByLabel('ルーム名')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByLabel('ルーム名')

```

```yaml
- banner:
  - heading "コエトバ" [level=1]:
    - link "コエトバ":
      - /url: /
- main:
  - text: 🎙️
  - heading "配信を準備する" [level=2]
  - paragraph: 配信ルームの名前を決めて始めましょう
  - text: ルーム名
  - 'textbox "例: 深夜の雑談ラジオ"'
  - button "配信を開始する" [disabled]
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('home page has title and start broadcast button', async ({ page }) => {
  4  |   await page.goto('/');
  5  | 
  6  |   // タイトルの確認
  7  |   await expect(page).toHaveTitle(/コエトバ/);
  8  | 
  9  |   // 配信開始ボタンの存在確認
  10 |   const startButton = page.getByRole('button', { name: /今すぐ配信を始める/ });
  11 |   await expect(startButton).toBeVisible();
  12 | });
  13 | 
  14 | test('navigation to live page from start button', async ({ page }) => {
  15 |   await page.goto('/');
  16 |   
  17 |   await page.getByRole('button', { name: /今すぐ配信を始める/ }).click();
  18 | 
  19 |   // /live?role=host に遷移していることを確認
  20 |   await expect(page).toHaveURL(/\/live\?role=host/);
  21 | 
  22 |   // ルーム名入力フィールドが表示されていることを確認
> 23 |   await expect(page.getByLabel('ルーム名')).toBeVisible();
     |                                         ^ Error: expect(locator).toBeVisible() failed
  24 | });
  25 | 
```