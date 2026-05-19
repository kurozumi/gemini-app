# プロジェクト指示書: gemini-app

## 開発ワークフロー
- **GitHub戦略:** すべての機能追加およびコード修正は**プルリクエスト**を通じて提出する必要があります。
- **PRの説明:** プルリクエストのタイトルと説明は**日本語**で記述し、変更内容に関する詳細な情報を提供してください。
- **自動マージの禁止:** プルリクエストを自動でマージすることは**絶対にしないでください**。PRを作成した後は、ユーザーによるレビューとマージを待ってください。
- **直接プッシュ:** `main` ブランチに直接プッシュしないでください。

## ルールと慣習（過去の指示）
- プルリクエストの説明は日本語で行うこと。
- すべてのコード変更はPR経由で行うこと（mainへの直接プッシュは禁止）。
- PR作成前に必ず `npm run build` と `npm run lint` で変更を確認すること。
- コードの修正は「外科的（最小限かつ正確）」に行うこと。
- Next.js と TypeScript のベストプラクティスに従うこと。

## 外部サービスの設定
### 1. LiveKit (音声配信)
- `LIVEKIT_API_KEY`: APIキー
- `LIVEKIT_API_SECRET`: APIシークレット
- `NEXT_PUBLIC_LIVEKIT_URL`: Project URL (wss://...)

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
