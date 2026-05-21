# コエトバ - 声で、つながる。

会員登録不要・匿名で、誰でもすぐに音声配信や聴取ができるリアルタイムプラットフォームです。

## コンセプト
「コエトバ（声×場）」は、名前も知らない誰かと声だけで繋がれる、温かくて気軽な音声掲示板です。
ログインの手間なく、今この瞬間の想いを声に乗せて届けることができます。

## 実装済み機能

| 機能 | 説明 |
| :--- | :--- |
| 匿名音声配信 | 会員登録不要。永続的なユーザーIDでシームレスに参加可能 |
| ルーム名設定 | 配信開始時に独自のルーム名を自由に設定可能 |
| ユニークURL | SupabaseのUUIDを使用した、衝突のない固定配信URL |
| リアルタイムチャット | LiveKit Data Messages を活用した低遅延な交流機能 |
| 視聴者数表示 | 配信中のリスナー数をリアルタイムで表示 |
| ホスト固定 | 各ルームの配信権限を1名に限定。後続は自動的にリスナーへ |
| 究極のルーム管理 | Webhook・Keep-alive・実態同期APIの3段構えで消し忘れを防止 |
| モダンなUI/UX | ガラスモーフィズムを採用した洗練されたデザイン |
| メンテナンスモード | 管理者がSupabaseから機能を一時停止できる Kill Switch |
| 自動テスト・監査 | GitHub Actions による自動テスト、CodeQL、Dependabotを統合 |

## 技術スタック

- **Framework:** Next.js (App Router)
- **Streaming:** LiveKit Cloud
- **Database:** Supabase (PostgreSQL / Real-time)
- **Quality:** Vitest, Playwright, CodeQL, CodeRabbit

---

## セットアップガイド

本プロジェクト（koetoba）を動作させるには、LiveKit と Supabase の設定が必要です。

### 1. LiveKit Cloud の設定
1. [LiveKit Cloud](https://cloud.livekit.io) でプロジェクトを作成。
2. **Settings > Keys** から `Project URL`, `API Key`, `API Secret` を取得。
3. **Settings > Webhooks** で `room_finished`, `participant_left` イベントを有効化。

### 2. Supabase の設定
1. [Supabase](https://supabase.com/) でプロジェクトを作成。
2. **Settings > API** から `URL`, `anon public`, `service_role secret` を取得。
3. **SQL Editor** で以下のSQLを実行して環境を構築。
   ```sql
   -- 1. テーブル作成
   create table rooms (id uuid default gen_random_uuid() primary key, name text not null, host_name text not null, created_at timestamp with time zone default now());
   create table app_config (key text primary key, value text not null, updated_at timestamp with time zone default now());
   
   -- 2. セキュリティ設定 (RLS)
   alter table rooms enable row level security;
   alter table app_config enable row level security;
   create policy "Public select" on rooms for select using (true);
   create policy "Public insert" on rooms for insert with check (true);
   create policy "Config select" on app_config for select using (true);
   
   -- 3. リアルタイム有効化
   alter publication supabase_realtime add table rooms;
   insert into app_config (key, value) values ('is_maintenance', 'false');
   ```

### 3. 環境変数の設定
VercelおよびGitHub Secretsに以下を登録。
- `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

---

## 開発フロー

1. 全ての変更はプルリクエスト（PR）経由で行う。
2. PR作成後、GitHub Actions のテスト通過を確認する。
3. **ユーザーの「マージして」という指示を待ってからマージを実行する。**
4. 直接 `main` ブランチへのプッシュは禁止。

---

## コマンド
```bash
npm run dev    # 開発起動
npm run test   # 単体テスト
npm run test:e2e # E2Eテスト
```
