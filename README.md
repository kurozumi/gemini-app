# コエトバ - 声で、つながる。

会員登録不要・匿名で、誰でもすぐに音声配信や聴取ができるリアルタイムプラットフォームです。

## コンセプト
「コエトバ（声×場）」は、名前も知らない誰かと声だけで繋がれる、温かくて気軽な音声掲示板です。
ログインの手間なく、今この瞬間の想いを声に乗せて届けることができます。

## 実装済み機能

| 機能 | 説明 |
| :--- | :--- |
| 匿名音声配信 | 会員登録なし、ランダムなユーザーIDで即座に参加 |
| ルーム名設定 | 配信開始時に好きなルーム名を設定可能 |
| 自動トークン発行 | サーバーサイドAPIでLiveKit接続トークンを安全に生成 |
| 役割ベースの権限制御 | 配信者とリスナーを自動判別し、適切な権限を付与 |
| ライブルーム一覧 | Supabaseのリアルタイム更新で配信中ルームを自動表示・削除 |
| 究極のルーム管理 | Webhook、Keep-alive、実態同期APIの3段構えでルームの消し忘れを完全防止 |
| モダンなUI/UX | ガラスモーフィズムを採用したタイルデザインと、共有機能（Web Share API） |
| レスポンシブ対応 | PCからスマホ、13インチモニターまで最適化された表示 |
| iOS対応 | iOS SafariのAutoPlay制限を回避する手動オーディオアンロック |
| サーバーサイドログ | `/api/logs` への非同期ロギングでブラウザ外のエラーも捕捉 |
| 自動テスト (CI) | GitHub Actions による自動 Lint およびテスト実行環境 |

## 技術スタック

- **Framework:** Next.js (App Router)
- **Streaming:** LiveKit Cloud
- **Database / Real-time:** Supabase
- **Testing:** Vitest, Playwright
- **CI/CD:** GitHub Actions, Vercel

---

## セットアップガイド

本プロジェクト（koetoba）を動作させるには、LiveKit と Supabase の設定が必要です。

### 1. LiveKit Cloud (音声配信エンジン) の設定

1. [LiveKit Cloud](https://cloud.livekit.io) にログインし、プロジェクトを作成します。
2. **Settings > Keys** から以下の情報を取得します。
   - **Project URL:** `wss://...` で始まるURL
   - **API Key:** 一意の文字列
   - **API Secret:** 秘密鍵（Showをクリックして確認）

### 2. Supabase (配信掲示板・リアルタイム管理) の設定

1. [Supabase](https://supabase.com/) にログインし、新しいプロジェクトを作成します。
2. **Project Settings > API** から以下の情報を取得します。
   - **Project URL (RESTful endpoint):** `https://...supabase.co`
   - **anon public:** 公開用APIキー
3. **SQL Editor** を開き、以下のSQLを実行してテーブルを作成します。
   ```sql
   -- 1. 配信ルームを管理するテーブルを作成
   create table rooms (
     id uuid default gen_random_uuid() primary key,
     name text not null,
     host_name text not null,
     created_at timestamp with time zone default now()
   );

   -- 2. リアルタイム機能を有効化
   alter publication supabase_realtime add table rooms;

   -- 3. 匿名ユーザーの読み書きを許可 (RLSの無効化と権限付与)
   alter table rooms disable row level security;
   grant all on table rooms to anon, authenticated, service_role;

   -- 4. キャッシュを強制リセット（構造変更を即座に反映）
   notify pgrst, 'reload schema';
   ```

### 3. 環境変数の設定 (Vercel & GitHub Actions)

Vercelのプロジェクト設定、およびGitHubの **Settings > Secrets and variables > Actions** に以下の 5 つを登録します。

| Key | Value (例) |
| :--- | :--- |
| `LIVEKIT_API_KEY` | (LiveKit API Key) |
| `LIVEKIT_API_SECRET` | (LiveKit API Secret) |
| `NEXT_PUBLIC_LIVEKIT_URL` | `wss://your-project.livekit.cloud` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Supabase anon key) |

> **重要:** GitHubに登録する際の `NEXT_PUBLIC_SUPABASE_URL` は、末尾の `/rest/v1/` を含めないように注意してください。

### 4. LiveKit Webhook の設定（ルーム自動クリーンアップ）

配信者がブラウザを強制終了した場合でも、ルーム一覧に残骸が残らないようにするためのWebhook設定です。

1. [LiveKit Cloud](https://cloud.livekit.io) にログインし、プロジェクトを選択します。
2. **Settings > Webhooks** を開きます。
3. 以下を設定して保存します。

   | 項目 | 値 |
   | :--- | :--- |
   | URL | `https://your-domain.vercel.app/api/livekit/webhook` |
   | Events | `room_finished`, `participant_left` |

---

## テスト

本プロジェクトでは、コードの品質と動作を保証するためにテストを導入しています。

### 単体テスト (Vitest)
ロジックやユーティリティ関数のテストです。
```bash
npm run test
```

### E2Eテスト (Playwright)
実際のブラウザを使用した動作確認テストです。実行には環境変数が必要です。
```bash
# ブラウザのインストール (初回のみ)
npx playwright install

# テスト実行
npm run test:e2e

# UIモードでの実行
npm run test:e2e:ui
```

---

## アーキテクチャ概要

```
ブラウザ (Next.js)
  │
  ├─ /live          配信・聴取ページ
  │    ├─ 配信開始 → POST /api/livekit/token (トークン取得)
  │    ├─ 配信開始 → Supabase.rooms に INSERT
  │    ├─ 離脱時   → POST /api/live/cleanup (即時削除、keepalive通信)
  │    └─ 離脱警告 → pagehide / beforeunload イベントでの保護
  │
  ├─ /             トップページ（ライブ一覧）
  │    ├─ 表示時   → GET /api/live/sync (LiveKitサーバーの実態と同期)
  │    └─ Supabase リアルタイム購読でルーム一覧を自動更新
  │
  └─ /api/livekit/webhook  LiveKitイベント受信 → ホスト離脱時にルーム強制クリーンアップ
```

---

## トラブルシューティング（よくある落とし穴）

### Q. 「Could not find the 'host_name' (または 'name') column」と表示される
**A. Supabaseのキャッシュリセットが必要です。**
SQL Editor で `notify pgrst, 'reload schema';` を実行してください。

### Q. 環境変数を設定したのに接続できない
**A. 再デプロイ（Redeploy）が必要です。**
Vercelの `Deployments` タブから最新のビルドに対して **Redeploy** を実行してください。

### Q. 配信を終了してもルーム一覧に残り続ける
**A. LiveKit Webhook が正しく設定されているか確認してください。**
また、開発環境では `pagehide` イベントがブラウザによって制限される場合があります。本番環境での動作を確認してください。

---

## 開発者向けコマンド

```bash
npm run dev    # 開発サーバー起動
npm run build  # ビルド
npm run lint   # リンター実行
```
