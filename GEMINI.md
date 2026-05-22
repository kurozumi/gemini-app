# プロジェクト指示書: コエトバ (koetoba)

## 開発ワークフロー
- **GitHub戦略:** すべての変更はプルリクエストを通じて行い、ユーザーの承認（「マージして」という指示）を待ってからマージすること。
- **プルリクエスト:** 説明文（Title, Body）は日本語で記述すること。
- **自動テスト:** GitHub Actions (CI) での全テストパスを必須とする。
- **品質管理:** CodeQL、Dependabot、CodeRabbitを運用。

## 外部サービスの設定
### 1. LiveKit (音声・チャット)
- `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL`
- Webhook: `room_finished`, `participant_left` を監視。

### 2. Supabase (DB・リアルタイム)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- RLSを有効化。削除操作は `service_role` 権限でのみ許可。

## 重要な仕様履歴
- **セッション**: `identity` に役割サフィックスを付加。IDは `localStorage` で永続化。
- **ルーム管理**: Keep-alive fetch と実態同期 API による自動削除。
- **UI/UX**: ガラスモーフィズムを採用した中央寄せデザイン。
- **フロー**: 「今すぐ配信を始める」→ ルーム名入力 → 配信開始。
- **セキュリティ**: 匿名ユーザーには「作成・閲覧」のみを許可。
