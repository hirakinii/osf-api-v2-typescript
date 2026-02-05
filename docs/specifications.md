# OSF API v2 Client Library Specifications

本文書は、`REQUIREMENTS.md` で定義された要件に基づき、実装の詳細仕様を定めます。

## 1. アーキテクチャ設計

### 1.1 全体構造 (Layered Architecture)
本ライブラリは以下の層で構成します。

1.  **Client Layer (`OsfClient`):** ライブラリのエントリーポイント。設定の保持と各リソースへのアクセスポイントを提供。
2.  **Resource Layer (`src/resources/`):** 各リソース (Nodes, Files, Users) 固有の操作ロジック定義。
3.  **Adapter Layer (`src/adapter/`):** JSON:API 形式のデータの正規化・直列化、およびデータモデルへの変換を担当。
4.  **Network Layer (`src/network/`):** HTTP リクエストの実行、認証ヘッダーの付与、エラーハンドリングの共通化。

### 1.2 ディレクトリ構成
```text
src/
├── client.ts           # エントリーポイント (OsfClient)
├── index.ts            # 公開モジュールのエクスポート
├── types/              # 型定義 (Request/Response/Entities)
│   ├── index.ts
│   ├── node.ts
│   ├── file.ts
│   └── user.ts
├── resources/          # リソース操作クラス
│   ├── BaseResource.ts
│   ├── Nodes.ts
│   ├── Files.ts
│   └── Users.ts
├── adapter/            # データ変換・シリアライザ
│   ├── JsonApiAdapter.ts
│   └── Normalizer.ts
├── network/            # HTTP通信・エラーハンドリング
│   ├── HttpClient.ts
│   └── Errors.ts
└── utils/              # ユーティリティ
    └── Pagination.ts
```

## 2. 実装詳細仕様

### 2.1 HTTP クライアント (`network/HttpClient.ts`)
*   **技術選定:** Node.js Native `fetch` API を使用。
*   **機能:**
    *   Base URL (`https://api.osf.io/v2/`) の管理。
    *   認証トークンのヘッダー付与 (`Authorization: Bearer <token>`).
    *   共通エラーハンドリング。
*   **インターフェース:**
    ```typescript
    interface HttpClientConfig {
        token: string;
        baseUrl?: string; // Default: https://api.osf.io/v2/
    }
    ```

### 2.2 エラーハンドリング (`network/Errors.ts`)
APIからのレスポンスステータスに基づき、以下のカスタムエラーをスローします。
全てのカスタムエラーは `OsfApiError` を継承します。

*   `OsfAuthenticationError` (401)
*   `OsfPermissionError` (403)
*   `OsfNotFoundError` (404)
*   `OsfRateLimitError` (429)
*   `OsfserverError` (500-599)

### 2.3 データモデルと型定義 (`types/*.ts`)
JSON:API の構造を考慮しつつ、ユーザーが扱いやすいフラットなインターフェースを定義します。

```typescript
// Raw JSON:API Response Type (Internal use)
interface JsonApiResponse<T> {
    data: {
        id: string;
        type: string;
        attributes: T;
        relationships?: Record<string, any>;
    };
    links?: Record<string, string>;
}

// User Facing Entity Type
export interface OsfNode {
    id: string;
    title: string;
    description: string;
    public: boolean;
    tags: string[];
    dateCreated: string;
    dateModified: string;
    // ... helper methods or properties for relationships
}
```

### 2.4 リソースクラス (`resources/*.ts`)
各リソースクラスは、API エンドポイントに対応するメソッドを持ちます。

#### `Nodes` Resource
*   `get(nodeId: string): Promise<OsfNode>`
*   `list(params?: ListParams): Promise<PaginatedResult<OsfNode>>`
*   `create(data: CreateNodeParams): Promise<OsfNode>`
*   `update(nodeId: string, data: UpdateNodeParams): Promise<OsfNode>`
*   `delete(nodeId: string): Promise<void>`
*   `getChildren(nodeId: string): Promise<PaginatedResult<OsfNode>>`

#### `Files` Resource
*   `get(fileId: string): Promise<OsfFile>`
*   `download(fileId: string): Promise<ReadableStream | Buffer>`
    *   OSF API から `download` リンクを取得し、リダイレクト先の Waterbutler からデータを取得するフローを実装。
*   `upload(nodeId: string, file: Stream | Buffer, name: string): Promise<OsfFile>`

### 2.5 ページネーション (`utils/Pagination.ts`)
ページネーションされたレスポンスを扱うためのヘルパークラスを提供します。

```typescript
export class PaginatedResult<T> {
    data: T[];
    nextPageUrl: string | null;
    
    // 次のページを自動的に取得するメソッドなど
    async *[Symbol.asyncIterator](): AsyncIterator<T> { ... }
    async next(): Promise<PaginatedResult<T> | null> { ... }
}
```

## 3. 開発フローとルール

### 3.1 仕様駆動およびテスト駆動開発 (Spec-DD & TDD)
本プロジェクトでは、実装前に必ず仕様とテストを定義するプロセスを順守します。

1.  **仕様策定:** 実装前に機能仕様を明確化し、ドキュメント (`docs/` 配下) に反映させる。
2.  **Test-Driven Development (TDD):**
    *   **.agent/rules/testing.md に準拠**し、以下のサイクルを回すことを義務付けます。
        1.  **RED:** 失敗するテストを書く。
        2.  **GREEN:** テストをパスさせるための最小限の実装を行う。
        3.  **REFACTOR:** コードを整理し、品質を高める。
    *   **カバレッジ:** 最低 80% のテストカバレッジを維持する。

### 3.2 ツールチェーン
*   **Lint/Format:** `eslint`, `prettier` を使用し、コード品質を保つ。
*   **Test:** `jest` を使用。
    *   **Unit Tests:** 各リソースクラス、Adapterロジック。
    *   **Integration Tests:** 実際に OSF API (またはモックサーバー) を叩くテストケース。
*   **Build:** `tsc` にて `dist/` ディレクトリへコンパイル。

## 4. 将来の拡張性
*   OAuth2 認証フローの実装（認証プロバイダクラスの追加）。
*   ブラウザ向けビルドの最適化（File API 周りの条件分岐など）。
