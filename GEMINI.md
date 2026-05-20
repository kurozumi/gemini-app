# プロジェクト指示書: コエトバ (koetoba)

## 開発ワークフロー
- **GitHub戦略:** すべての機能追加およびコード修正は**プルリクエスト**を通じて提出する必要があります。
- **PRの説明:** プルリクエストのタイトルと説明は**日本語**で記述し、変更内容に関する詳細な情報を提供してください。
- **自動マージの禁止:** プルリクエストを自動でマージすることは**絶対にしないでください**。PRを作成した後は、ユーザーによるレビューとマージを待ってください。
- **承認プロセス:** 修正完了後にPRを作成し、私が「マージして」と指示した場合のみマージを実行してください。
- **直接プッシュ:** `main` ブランチに直接プッシュしないでください。

## ルールと慣習
- プルリクエストの説明は日本語で行うこと。
- すべてのコード変更はPR経由で行うこと（mainへの直接プッシュは禁止）。
- PR作成前に必ず `npm run build` と `npm run lint` で変更を確認すること。
- コードの修正は「外科的（最小限かつ正確）」に行うこと。
- 未使用のページ、コンポーネント、ファイル（favorites, search, track 等）はプロジェクトの軽量化のため削除済み。今後も不要なものは即座に削除すること。
- Next.js と TypeScript のベストプラクティスに従うこと。

## 外部サービスの設定
### 1. LiveKit (音声配信)
- `LIVEKIT_API_KEY`: APIキー
- `LIVEKIT_API_SECRET`: APIシークレット
- `NEXT_PUBLIC_LIVEKIT_URL`: Project URL (wss://...)
- **Webhook設定**: `room_finished`, `participant_left` を受信してルームをクリーンアップ。

### 2. Supabase (配信掲示板/リアルタイム管理)
- `NEXT_PUBLIC_SUPABASE_URL`: プロジェクトURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon Key
- **必要なテーブル設定**:
  SQL Editor で以下のコマンドを実行してください：
  ```sql
  create table rooms (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    host_name text not null,
    created_at timestamp with time zone default now()
  );
  alter publication supabase_realtime add table rooms;
  ```

## 重要な仕様の履歴
- **セッション管理**: ID衝突防止のため `identity` に `-host`/`-listener` を付加。
- **ルーム自動削除**: `fetch keepalive`、`pagehide` イベント、LiveKit Webhook、およびトップページ表示時の「実態同期API」による3段構えのクリーンアップ。
- **UI/UX**: ガラスモーフィズムを採用した中央寄せデザイン。共有ボタン（Web Share API対応）の搭載。
- **配信フロー**: 「今すぐ配信を始める」→ ルーム名入力 → 自動的に配信開始。
