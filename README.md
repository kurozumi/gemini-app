# コエトバ - 声で、つながる。

会員登録不要・匿名で、誰でもすぐに音声配信や聴取ができるリアルタイムプラットフォームです。

## コンセプト
「コエトバ（声×場）」は、名前も知らない誰かと声だけで繋がれる、温かくて気軽な音声掲示板です。
ログインの手間なく、今この瞬間の想いを声に乗せて届けることができます。

## 実装済み機能

| 機能 | 説明 |
| :--- | :--- |
| 匿名音声配信 | 会員登録なし、永続的なユーザーIDでシームレスに参加 |
| ルーム名設定 | 配信開始時に好きなルーム名を設定可能 |
| ユニークURL | SupabaseのUUIDを使用した、衝突のない固有の配信URL生成 |
| リアルタイムチャット | LiveKit Data Messages を使用した超低遅延な交流機能 |
| 視聴者数表示 | 配信画面内でのリアルタイムなリスナー数カウント |
| ホスト固定機能 | 1つのルームに配信者は1人だけ。後から来た人は自動でリスナーへ |
| 自動トークン発行 | サーバーサイドAPIでLiveKit接続トークンを安全に生成 |
| 役割ベースの権限制御 | 配信者とリスナーを自動判別し、適切な権限を付与 |
| 究極のルーム管理 | Webhook、Keep-alive、実態同期APIの3段構えでルームの消し忘れを完全防止 |
| モダンなUI/UX | 高度なガラスモーフィズムとアニメーションを採用したタイルデザイン |
| レスポンシブ対応 | PCからスマホ、13インチモニターまで最適化された表示 |
| iOS対応 | 視聴前の警告メッセージ（イヤホン推奨）と手動オーディオアンロック |
| 自動テスト (CI) | GitHub Actions による自動 Lint、Unit、E2E テスト環境 |
| セキュリティ自動点検 | CodeQL による静的解析と Dependabot による依存関係監視 |
| AIコードレビュー | CodeRabbit による自動コードレビューと改善提案 |

## 技術スタック

- **Framework:** Next.js (App Router)
- **Streaming:** LiveKit Cloud
- **Database / Real-time:** Supabase
- **Testing:** Vitest, Playwright
- **CI/CD:** GitHub Actions, Vercel
- **Quality/Security:** CodeQL, Dependabot, CodeRabbit

---

## セットアップガイド

本プロジェクト（koetoba）を動作させるには、LiveKit と Supabase の設定が必要です。

### 1. LiveKit Cloud (音声配信エンジン) の設定

1. [LiveKit Cloud](https://cloud.livekit.io) にログインし、プロジェクトを作成します。
2. **Settings > Keys** から以下の情報を取得します。
   - **Project URL:** `wss://...` で始まるURL
   - **API Key:** 一意の文字列
   - **API Secret:** 秘密鍵

### 2. Supabase (配信掲示板・リアルタイム管理) の設定

1. [Supabase](https://supabase.com/) にログインし、新しいプロジェクトを作成します。
2. **Project Settings > API** から以下の情報を取得します。
   - **Project URL (RESTful endpoint):** `https://...supabase.co`
   - **anon public:** 公開用APIキー
   - **service_role secret:** サーバーサイド用秘密鍵（`SUPABASE_SERVICE_ROLE_KEY` として使用）
3. **SQL Editor** を開き、以下のSQLを実行してテーブルとセキュリティ設定を作成します。

   ```sql
   -- 1. 配信ルーム管理テーブルの作成
   create table rooms (
     id uuid default gen_random_uuid() primary key,
     name text not null,
     host_name text not null,
     created_at timestamp with time zone default now()
   );

   -- 2. アプリ設定管理テーブルの作成
   create table app_config (
     key text primary key,
     value text not null,
     updated_at timestamp with time zone default now()
   );

   -- 3. リアルタイム機能の有効化
   alter publication supabase_realtime add table rooms;

   -- 4. 行レベルセキュリティ (RLS) の有効化
   alter table rooms enable row level security;
   alter table app_config enable row level security;

   -- 5. セキュリティポリシーの設定
   -- 誰でもルーム一覧を見られる
   create policy "Anyone can select rooms" on rooms for select using (true);
   -- 誰でもルームを作れる
   create policy "Anyone can insert rooms" on rooms for insert with check (true);
   -- 誰でも設定値を読み取れる
   create policy "Anyone can select config" on app_config for select using (true);

   -- 6. 初期データ投入
   insert into app_config (key, value) values ('is_maintenance', 'false');

   -- 7. キャッシュを強制リセット
   notify pgrst, 'reload schema';
   ```

### 3. 環境変数の設定 (Vercel & GitHub Actions)

Vercelのプロジェクト設定、およびGitHubの **Settings > Secrets and variables > Actions** に以下の 6 つを登録します。

| Key | Value (例) |
| :--- | :--- |
| `LIVEKIT_API_KEY` | (LiveKit API Key) |
| `LIVEKIT_API_SECRET` | (LiveKit API Secret) |
| `NEXT_PUBLIC_LIVEKIT_URL` | `wss://your-project.livekit.cloud` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Supabase anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | (Supabase service role key) |

> **重要:**
> - `SUPABASE_SERVICE_ROLE_KEY` はサーバーサイドでのみ使用され、RLS（セキュリティ制限）を回避してルームのクリーンアップ等を行うために必要です。
> - GitHub Secrets に登録する際の `NEXT_PUBLIC_SUPABASE_URL` は、末尾の `/rest/v1/` を含めないように注意してください。

### 4. LiveKit Webhook の設定（ルーム自動クリーンアップ）

配信者がブラウザを強制終了した場合でも、ルーム一覧に残骸が残らないようにするための設定です。

1. [LiveKit Cloud](https://cloud.livekit.io) にログインし、**Settings > Webhooks** を開きます。
2. 以下を設定して保存します。
   - **URL:** `https://your-domain.vercel.app/api/livekit/webhook`
   - **Events:** `room_finished`, `participant_left`

---

## テスト

コードの品質と動作を保証するために、以下のテストを実行可能です。

- **単体テスト (Vitest)**: ロジックやユーティリティのテスト (`npm run test`)
- **E2Eテスト (Playwright)**: 実際のブラウザでの動作確認 (`npm run test:e2e`)

---

## 開発フロー

すべての変更はプルリクエストを通じて行います。

1. ブランチ作成 → コード修正
2. **プルリクエスト作成**（タイトル・説明は日本語で記述）
3. GitHub Actions による自動テストをパスすることを確認
4. **ユーザーの確認および「マージして」という指示を待つ**
5. 指示を受けてからマージを実行

---

## アーキテクチャ概要

```
ブラウザ (Next.js)
  │
  ├─ /live (配信・聴取)
  │    ├─ 配信開始 → トークン取得 ＆ Supabase.rooms 登録
  │    ├─ リアルタイムチャット (LiveKit Data Messages)
  │    └─ 離脱時 → cleanup API (keepalive)
  │
  ├─ / (トップページ)
  │    ├─ 表示時 → LiveKitサーバーの実態と同期 (Sync API)
  │    └─ Supabase リアルタイム購読による一覧更新
  │
  └─ Webhook → 異常終了時の強制クリーンアップ
```
