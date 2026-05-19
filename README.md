# コエトバ - 声で、つながる。

会員登録不要・匿名で、誰でもすぐに音声配信や聴取ができるリアルタイムプラットフォームです。

## コンセプト
「コエトバ（声×場）」は、名前も知らない誰かと声だけで繋がれる、温かくて気軽な音声掲示板です。
ログインの手間なく、今この瞬間の想いを声に乗せて届けることができます。

## 技術スタック
- **Framework:** Next.js (App Router)
- **Streaming:** LiveKit Cloud
- **Database / Real-time:** Supabase
- **Hosting:** Vercel

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
   - **Project URL:** `https://...supabase.co`
   - **anon public:** 公開用APIキー
3. **SQL Editor** を開き、以下のSQLを実行してテーブルを作成します。
   ```sql
   -- 配信ルームを管理するテーブルを作成
   create table rooms (
     id uuid default gen_random_uuid() primary key,
     name text not null,
     host_name text not null,
     created_at timestamp with time zone default now()
   );

   -- リアルタイム機能を有効化
   alter publication supabase_realtime add table rooms;

   -- 匿名ユーザーの読み書きを許可 (RLSの無効化)
   alter table rooms disable row level security;
   ```

### 3. Vercel への環境変数設定

Vercelのプロジェクト設定（Settings > Environment Variables）に以下の 5 つを追加します。

| Key | Value (例) |
| :--- | :--- |
| `LIVEKIT_API_KEY` | (LiveKit API Key) |
| `LIVEKIT_API_SECRET` | (LiveKit API Secret) |
| `NEXT_PUBLIC_LIVEKIT_URL` | `wss://your-project.livekit.cloud` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Supabase anon key) |

---

## トラブルシューティング（よくある落とし穴）

### Q. 環境変数を設定したのに接続できない
**A. 再デプロイ（Redeploy）が必要です。**
Vercelでは環境変数を追加しただけでは実行中のアプリに反映されません。`Deployments` タブから最新のビルドの `...` メニューを開き、**Redeploy** を実行してください。

### Q. トップページに配信中リストが表示されない
**A. Supabaseのセキュリティ設定（RLS）を確認してください。**
デフォルトでは外部からのアクセスが禁止されています。SQL Editorで `alter table rooms disable row level security;` を実行したか確認してください。また、実際に「配信者」としてライブを開始している間のみリストに表示されます。

### Q. iPhoneで音が聞こえない
**A. ユーザー操作（タップ）が必要です。**
iOS Safari等のブラウザでは、自動再生が厳しく制限されています。リスナーとして入室した後、画面に表示される **「🔊 ライブを聴く」** ボタンを必ずタップしてください。

### Q. LiveKitのURLがエラーになる
**A. 接頭辞を確認してください。**
URLが `https://` ではなく **`wss://`** で始まっていることを確認してください。

---

## 開発者向けコマンド

```bash
npm run dev    # 開発サーバー起動
npm run build  # ビルド
npm run lint   # リンター実行
```
