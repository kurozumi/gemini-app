import { test, expect } from '@playwright/test';

test('home page has title and start broadcast button', async ({ page }) => {
  await page.goto('/');

  // タイトルの確認
  await expect(page).toHaveTitle(/コエトバ/);

  // 配信開始ボタンの存在確認
  const startButton = page.getByRole('button', { name: /今すぐ配信を始める/ });
  await expect(startButton).toBeVisible();
});

test('navigation to live page from start button', async ({ page }) => {
  await page.goto('/');
  
  await page.getByRole('button', { name: /今すぐ配信を始める/ }).click();

  // /live?role=host に遷移していることを確認
  await expect(page).toHaveURL(/\/live\?role=host/);

  // ルーム名入力フィールドが表示されていることを確認
  await expect(page.getByPlaceholder('例: 深夜の雑談ラジオ')).toBeVisible();
});
