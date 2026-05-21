# プロジェクト指示書: コエトバ (koetoba)

## 開発ワークフロー
- **GitHub戦略:** すべての機能追加およびコード修正は**プルリクエスト（PR）**を通じて提出する必要があります。
- **PRの説明:** プルリクエストのタイトルと説明は**日本語**で記述し、変更内容に関する詳細な情報を提供してください。
- **自動マージの禁止:** プルリクエストを自動でマージすることは**絶対にしないでください**。
- **承認プロセス:** 修正完了後にPRを作成し、私が「マージして」と明確に指示した場合のみマージを実行してください。
- **直接プッシュ:** `main` ブランチに直接プッシュしないでください。
- **自動テスト:** GitHub Actions (CI) が設定されています。すべてのチェックが緑色になることを確認してから報告してください。

## ルールと慣習
- すべてのコード変更はPR経由で行うこと（mainへの直接プッシュは禁止）。
- PR作成前に必ず `npm run build` と `npm run lint` で変更を確認すること。
- コードの修正は「外科的（最小限かつ正確）」に行うこと。
- 未使用のページ、コンポーネント、ファイル（favorites, search, track 等）はプロジェクトの軽量化のため削除済み。今後も不要なものは即座に削除すること。
- Next.js と TypeScript のベストプラクティスに従うこと。型エラーを放置しないこと。

## 外部サービスの設定
### 1. LiveKit (音声配信)
- `LIVEKIT_API_KEY`: APIキー
- `LIVEKIT_API_SECRET`: APIシークレット
- `NEXT_PUBLIC_LIVEKIT_URL`: Project URL (wss://...)
- **Webhook設定**: `room_finished`, `participant_left` を受信してルームをクリーンアップ。

### 2. Supabase (配信掲示板/リアルタイム管理)
- `NEXT_PUBLIC_SUPABASE_URL`: プロジェクトURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon Key
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (サーバーサイド用・RLS回避用)
- **テーブル設定**: `rooms`, `app_config` テーブルの作成と RLS の有効化が必要。

## 重要な仕様の履歴
- **セッション管理**: ID衝突防止のため `identity` に `-host`/`-listener` を付加。
- **ルーム自動削除**: `fetch keepalive`、`pagehide` イベント、LiveKit Webhook、およびトップページ表示時の「実態同期API」による3段構えのクリーンアップ。
- **セキュリティ (RLS)**: 匿名ユーザーには「ルームの作成・閲覧」のみを許可。ルームの削除・同期はサーバーサイドで `service_role` キーを使用して安全に実行。
- **配信フロー**: 「今すぐ配信を始める」→ ルーム名入力 → 自動的に配信開始。
- **ビルド設定**: `next.config.ts` は型競合回避のため `next.config.js` に変更済み。ビルド時の型チェックは CI で保証。
