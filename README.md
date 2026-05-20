# コエトバ - 声で、つながる。

会員登録不要・匿名で、誰でもすぐに音声配信や聴取ができるリアルタイムプラットフォームです。

## コンセプト
「コエトバ（声×場）」は、名前も知らない誰かと声だけで繋がれる、温かくて気軽な音声掲示板です。
ログインの手間なく、今この瞬間の想いを声に乗せて届けることができます。

## 実装済み機能

| 機能 | 説明 |
| :--- | :--- |
| 匿名音声配信 | 会員登録なし、ランダムなユーザーIDで即座に参加 |
| 自動トークン発行 | サーバーサイドAPIでLiveKit接続トークンを安全に生成 |
| 役割ベースの権限制御 | 配信者（host）は音声Publish可能、リスナーはSubscribeのみ |
| ライブルーム一覧 | Supabaseのリアルタイム更新で配信中ルームを自動表示・削除 |
| ルームのライフサイクル管理 | 配信開始時にSupabaseへ登録、切断時に自動削除 |
| LiveKit Webhook | LiveKitイベント受信によるルームの確実なクリーンアップ |
| iOS対応 | iOS SafariのAutoPlay制限を回避する手動オーディオアンロック |
| サーバーサイドログ | `/api/logs` への非同期ロギングでブラウザ外のエラーも捕捉 |

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

### 3. Vercel への環境変数設定

Vercelのプロジェクト設定（Settings > Environment Variables）に以下の 5 つを追加します。

| Key | Value (例) |
| :--- | :--- |
| `LIVEKIT_API_KEY` | (LiveKit API Key) |
| `LIVEKIT_API_SECRET` | (LiveKit API Secret) |
| `NEXT_PUBLIC_LIVEKIT_URL` | `wss://your-project.livekit.cloud` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Supabase anon key) |

### 4. LiveKit Webhook の設定（ルーム自動クリーンアップ）

配信者がブラウザを強制終了した場合でも、ルーム一覧に残骸が残らないようにするためのWebhook設定です。

1. [LiveKit Cloud](https://cloud.livekit.io) にログインし、プロジェクトを選択します。
2. **Settings > Webhooks** を開きます。
3. 以下を設定して保存します。

   | 項目 | 値 |
   | :--- | :--- |
   | URL | `https://your-domain.vercel.app/api/livekit/webhook` |
   | Events | `room_finished`, `participant_disconnected` |

> **注意:** Webhook URLは本番環境（Vercelの本番URL）を使用してください。ローカル開発環境ではlocalhost宛にLiveKitからリクエストを送れないため、[ngrok](https://ngrok.com/) 等でトンネルを作成する必要があります。

---

## アーキテクチャ概要

```
ブラウザ (Next.js)
  │
  ├─ /live          配信・聴取ページ
  │    ├─ 配信開始 → POST /api/livekit/token (トークン取得)
  │    ├─ 配信開始 → Supabase.rooms に INSERT
  │    └─ 切断時   → Supabase.rooms から DELETE
  │
  ├─ /             トップページ（ライブ一覧）
  │    └─ Supabase リアルタイム購読でルーム一覧を自動更新
  │
  └─ /api/livekit/webhook  LiveKitイベント受信 → ルーム強制クリーンアップ
```

---

## トラブルシューティング（よくある落とし穴）

### Q. 「Could not find the 'host_name' (または 'name') column」と表示される
**A. Supabaseのキャッシュリセットが必要です。**
SQL Editor で `notify pgrst, 'reload schema';` を実行してください。これにより Supabase の API が最新のテーブル構造を認識します。

### Q. 「new row violates row-level security policy」と表示される
**A. 権限設定が不足しています。**
SQL Editor で以下の 2 行を実行してください：
```sql
alter table rooms disable row level security;
grant all on table rooms to anon, authenticated, service_role;
```

### Q. 環境変数を設定したのに接続できない
**A. 再デプロイ（Redeploy）が必要です。**
Vercelでは環境変数を追加しただけでは実行中のアプリに反映されません。`Deployments` タブから最新のビルドの `...` メニューを開き、**Redeploy** を実行してください。

### Q. トップページに配信中リストが表示されない
**A. 実際に「配信者」としてライブを開始しているか確認してください。**
現在の仕様では、誰かが「配信者」として接続している間だけリストに表示されます。また、ブラウザのコンソール（F12）にエラーが出ていないか確認してください。

### Q. iPhoneで音が聞こえない
**A. ユーザー操作（タップ）が必要です。**
iOS Safari等のブラウザでは、自動再生が厳しく制限されています。リスナーとして入室した後、画面に表示される **「🔊 ライブを聴く」** ボタンを必ずタップしてください。

### Q. LiveKitのURLがエラーになる
**A. 接頭辞を確認してください。**
URLが `https://` ではなく **`wss://`** で始まっていることを確認してください。

### Q. 配信を終了してもルーム一覧に残り続ける
**A. Webhook が未設定か、配信者が正常に切断されていません。**
LiveKit の Webhook（`/api/livekit/webhook`）を設定することで、ブラウザを強制終了した場合でもルームが自動削除されます。設定手順は「[LiveKit Webhook の設定](#4-livekit-webhook-の設定ルーム自動クリーンアップ)」を参照してください。

---

## 開発者向けコマンド

```bash
npm run dev    # 開発サーバー起動
npm run build  # ビルド
npm run lint   # リンター実行
```
