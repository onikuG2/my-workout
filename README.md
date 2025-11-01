<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# マイワークアウト

カスタムワークアウトの作成、管理、実行、履歴追跡ができるアプリケーションです。

## 機能

*   ワークアウトの作成、編集、削除
*   ワークアウトの実行（タイマー機能付き）
*   完了したワークアウトの履歴表示と削除

## 技術スタック

*   **フレームワーク:** React
*   **言語:** TypeScript
*   **ビルドツール:** Vite

## 開発環境のセットアップ

### 前提条件

*   Node.js (推奨バージョン: LTS)

### ローカルでの実行

1.  依存関係のインストール:
    ```bash
    npm install
    ```
2.  `.env.local` ファイルに `GEMINI_API_KEY` を設定します（AI Studioアプリの場合）。
3.  アプリケーションの起動:
    ```bash
    npm run dev
    ```

## プロジェクト構造

*   `src/`: アプリケーションのソースコード。
    *   `App.tsx`: メインコンポーネント。アプリケーションのルーティングと状態管理を担当。
    *   `types.ts`: アプリケーション全体で使用される型定義（`Workout`, `Exercise`, `WorkoutHistoryEntry`など）。
    *   `components/`: 再利用可能なUIコンポーネント。
        *   `WorkoutList.tsx`: ワークアウトの一覧表示と管理。
        *   `WorkoutCreator.tsx`: ワークアウトの作成・編集フォーム。
        *   `WorkoutPlayer.tsx`: ワークアウト実行時のUIとロジック。
        *   `WorkoutHistory.tsx`: 完了したワークアウトの履歴表示。
        *   `GoogleDriveSync.tsx`, `LocalFileSync.tsx`: データ同期関連のコンポーネント（現在未実装または未使用の可能性あり）。
        *   `icons/`: 各種アイコンコンポーネント。
        *   `modals/`: モーダルダイアログコンポーネント。

## データ永続化

ワークアウトデータと履歴は、ブラウザの `localStorage` に保存されます。`localStorage` にデータがない場合は、フォールバックとしてCookieから読み込みます。データの保存時には `localStorage` とCookieの両方に書き込まれます。

View your app in AI Studio: https://ai.studio/apps/drive/16m0xGKfGC5Sg4951gPp2BDKqOkPltPiF