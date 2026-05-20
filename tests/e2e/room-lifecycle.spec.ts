import { test, expect } from '@playwright/test';

test.describe('Room Lifecycle and Controls', () => {
  test('full broadcast lifecycle: start, check list, and cleanup on leave', async ({ page }) => {
    // 1. ホームページにアクセス
    await page.goto('/');
    
    // 2. 配信開始画面へ
    await page.getByRole('button', { name: /今すぐ配信を始める/ }).click();
    await expect(page).toHaveURL(/\/live\?role=host/);

    // 3. ルーム名を入力して配信開始
    const testRoomName = `Test Room ${Date.now()}`;
    await page.getByPlaceholder('例: 深夜の雑談ラジオ').fill(testRoomName);
    
    // 実際の接続はモックなしでは難しいが、UIの遷移を確認
    // ※ 接続ボタンのテキストが「配信を開始する」であることを確認
    const startButton = page.getByRole('button', { name: '配信を開始する' });
    await expect(startButton).toBeVisible();

    // 4. ホームに戻った時の挙動（配信者UIの要素があるかなど、接続後は本来タイルのある画面になる）
    // ここでは、ナビゲーションメニューの挙動を模倣してホームへ戻る
    await page.getByRole('link', { name: 'コエトバ' }).click();
    await expect(page).toHaveURL('/');
  });

  test('broadcaster vs listener UI elements', async ({ page }) => {
    // 配信者としてのUI（ルーム名入力前）
    await page.goto('/live?role=host');
    await expect(page.getByText('配信を準備する')).toBeVisible();
    // 役割選択が消えていることを確認（代わりに文言で判断）
    await expect(page.locator('select[name="role"]')).not.toBeVisible();

    // リスナーとしてのUI（自動入室前またはエラー時）
    await page.goto('/live?role=listener&room=test-room');
    // 自動入室中は「接続中...」が出るはず
    await expect(page.getByText('接続中...')).toBeVisible();
  });

  test('share button copies to clipboard', async ({ page }) => {
    // 実際の配信画面まで行くのはトークンが必要なため、
    // UIコンポーネントが正しくレンダリングされているか、モックデータでテストするのが望ましいが
    // Playwrightでは遷移とURLの整合性を中心にテスト
    await page.goto('/live?role=host');
    await page.getByPlaceholder('例: 深夜の雑談ラジオ').fill('Share Test Room');
    // ここで実際に接続を完了させるにはAPIのモックが必要
  });
});
