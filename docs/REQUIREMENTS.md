# OSF API v2 Client Library Requirements

このドキュメントは、OSF (Open Science Framework) API v2 TypeScript クライアントライブラリの機能要件および非機能要件を定義するものです。

## 1. 機能要件 (Functional Requirements)

### 1.1 認証 (Authentication)
*   **Personal Access Token (PAT):**
    *   Bearer Token 認証を標準でサポートする。
    *   クライアント初期化時にトークンを設定可能とする。
*   **OAuth2 (設計考慮):**
    *   将来的な OAuth2 対応を見据え、認証ヘッダー生成処理を拡張可能なインターフェースとして設計する（MVPでは実装不要）。

### 1.2 リソース操作 (Core Resources)
以下の主要リソースに対する操作を提供する。

#### Nodes (Projects/Components)
*   **CRUD:** ノードの作成、取得、更新、削除。
*   **構造操作:** 子コンポーネントの操作、親子関係の解決。
*   **メタデータ:** タイトル、説明、公開設定 (Public/Private)、タグ、ライセンス等の読み書き。

#### Files (Storage)
*   **ファイル操作:** ファイル情報の取得、移動、コピー、削除。
*   **データ転送:**
    *   メタデータAPIと、実データサーバー (Waterbutler) 間のやり取りを隠蔽する。
    *   Node.js の `Buffer` や `Stream` を用いたファイルのアップロード・ダウンロード機能を提供する。

#### Users
*   **ユーザー情報:** `Me` (自分自身) および特定ユーザー情報の取得。
*   **リレーション:** ユーザーに関連するノード一覧の取得。

### 1.3 JSON:API の抽象化 (Data Abstraction)
OSF API が準拠する JSON:API 仕様の複雑さを隠蔽する。

*   **レスポンスの平坦化:**
    *   深くネストした JSON:API レスポンス (`data.attributes.title` 等) を、フラットなオブジェクト (`node.title`) として扱えるようにマッピングする。
*   **リレーション解決:**
    *   関連リソース（Contributors, Children 等）へのアクセスを、メソッドチェーンや直感的なメソッド（例: `node.getContributors()`）で提供する。

### 1.4 ページネーション (Pagination)
*   **自動ページング:** API のページネーション (`next` link) を意識せず、全件取得などが容易に行えるユーティリティを提供する。
*   **イテレータ:** `AsyncIterator` をサポートし、`for await ... of`構文でのループ処理を可能にする。

### 1.5 エラーハンドリング (Error Handling)
*   **カスタム例外:** HTTP ステータスコードをそのまま返すのではなく、ライブラリ固有の例外クラス（`OsfAuthenticationError`, `OsfNotFoundError` 等）に変換して throw する。
*   **詳細情報:** エラーメッセージに API からのレスポンス詳細を含める。

## 2. 非機能要件 (Non-Functional Requirements)

### 2.1 型安全性 (Type Safety)
*   **TypeScript:** 全ての実装を TypeScript で行い、厳格な型チェックを行う。
*   **完全な型定義:** リクエストパラメータ、レスポンスボディ、エラーオブジェクトなど、公開される全てのインターフェースに型定義を提供する。`any` 型の使用を原則禁止する。

### 2.2 依存関係 (Dependencies)
*   **Minimal Dependencies:** プロダクションの依存パッケージ (`dependencies`) は必要最小限に留める。
    *   HTTP クライアントは、Node.js 標準の `fetch` API の使用を優先し、外部ライブラリ依存を減らす（あるいは軽量なラッパーのみ許容する）。

### 2.3 ユーザビリティ (Usability)
*   **直感的な API 設計:** 
    *   `new OsfClient({ token })` のように簡単にインスタンス化できること。
    *   リソース階層構造を意識したメソッド体系 (`client.nodes.get(...)`) にすること。
*   **ドキュメント:**
    *   全ての公開メソッド・クラスに TSDoc (JSDoc) を記述し、IDE での補完・ドキュメント表示に対応する。

### 2.4 環境 (Environment)
*   **Node.js LTS:** 主なターゲット環境は現在の Node.js Active LTS (v18, v20, v22) とする。
*   **Browser Compatible (Option):** 可能な限りブラウザ環境でも動作する設計（ファイルシステム依存部分を除く）を心がける。
