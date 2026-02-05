# Implementation Plan

本ドキュメントは、OSF API v2 TypeScript クライアントライブラリの実装計画を定義します。
開発は **TDD (Test-Driven Development)** サイクルを厳守し、各ステップでテストカバレッジ >80% を維持しながら進めます。

## Phase 1: プロジェクト初期設定とコア基盤 (Setup & Core Foundation)

このフェーズでは、開発環境の整備と、API クライアントの土台となる通信・エラー処理・型定義を実装します。

### 1.1 環境構築 (Environment Setup)
- [x] ディレクトリ構造の作成 (`src/`, `tests/` 等)
- [x] TypeScript 設定 (`tsconfig.json`) の最適化
- [x] Linter/Formatter 設定 (`eslint`, `prettier`) の確立
- [x] テスト環境 (`jest`, `ts-jest`) のセットアップ

### 1.2 基本型定義 (Core Types)
- [x] 論理データモデル定義 (`docs/data-model/*.yaml`)
- [x] JSON:API レスポンスのジェネリクス型定義 (`JsonApiResponse<T>`)
- [x] 共通エンティティインターフェース定義 (`OsfNode`, `OsfFile`, `OsfUser`)
- [x] エラー型定義 (`OsfApiError`)

### 1.3 ネットワーク層 (Network Layer) - TDD
- [x] **Test:** モックサーバーを用いた HTTP リクエスト/レスポンスのテスト作成
- [x] **Impl:** `HttpClient` クラスの実装 (Node.js native `fetch` 使用)
    - [x] Base URL 管理
    - [x] Authorization Header 付与
    - [x] タイムアウト処理
- [x] **Impl:** エラーハンドリングロジックの実装
    - [x] ステータスコードに基づくカスタムエラー (`OsfAuthenticationError` 等) へのマッピング

## Phase 2: データアダプターとリソース基盤 (Adapters & Base Resource)

JSON:API の複雑さを吸収する変換処理と、リソース操作の共通ロジックを実装します。

### 2.1 アダプター実装 (Adapter Layer) - TDD
- [x] **Test:** JSON:API 形式のサンプルレスポンスを用いた変換テスト作成
- [x] **Impl:** `JsonApiAdapter` の実装
    - [x] `data.attributes` のフラット化
    - [x] リレーションシップ情報の整理

### 2.2 リソース基底クラス (Base Resource)
- [x] **Test:** 基底クラスの共通メソッドに対するテスト作成
- [x] **Impl:** `BaseResource` クラスの実装
    - [x] `HttpClient` の保持
    - [x] 共通の `get`, `list` 処理の枠組み

## Phase 3: リソース実装 (Resource Implementation)

各エンドポイントに対応するリソース操作クラスを順次実装します。

> **実装完了**: 2026-02-05
> テスト: 102件全通過 / カバレッジ: 96.83%

### 3.1 Nodes リソース (Nodes) - TDD
- [x] **Test:** ノード取得、作成、更新、削除の単体テスト (18テスト)
- [x] **Impl:** `Nodes` クラスの実装 (`src/resources/Nodes.ts`)
    - [x] `getById(id)` - ノード取得
    - [x] `listNodes(params)` - ノード一覧 (フィルタ・ページネーション対応)
    - [x] `create(data)` - ノード作成 (CreateNodeInput型)
    - [x] `update(id, data)` - ノード更新 (UpdateNodeInput型)
    - [x] `deleteNode(id)` - ノード削除

### 3.2 Files リソース (Files) - TDD
- [x] **Test:** ファイル情報取得、ダウンロード、削除のテスト (16テスト)
- [x] **Impl:** `Files` クラスの実装 (`src/resources/Files.ts`)
    - [x] メタデータ (OSF API) と実データ (Waterbutler) の扱い分け
    - [x] `getById(fileId)` - ファイルメタデータ取得
    - [x] `listVersions(fileId)` - バージョン一覧取得
    - [x] `listByNode(nodeId, provider)` - ノード内ファイル一覧
    - [x] `listProviders(nodeId)` - ストレージプロバイダー一覧
    - [x] `download(file)` - Waterbutler経由でダウンロード (ArrayBuffer返却)
    - [x] `deleteFile(file)` - Waterbutler経由で削除

### 3.3 Users リソース (Users) - TDD
- [x] **Test:** ユーザー情報取得のテスト (10テスト)
- [x] **Impl:** `Users` クラスの実装 (`src/resources/Users.ts`)
    - [x] `me()` - 認証ユーザー取得
    - [x] `getById(id)` - ID指定ユーザー取得
    - [x] `listUsers(params)` - ユーザー一覧 (フィルタ・ページネーション対応)

## Phase 4: ユーティリティとクライアント統合 (Utils & Integration)

> **実装完了**: 2026-02-05
> テスト: 126件全通過 / カバレッジ: 93.92%

### 4.1 ページネーション (Pagination) - TDD
- [x] **Test:** 複数ページに渡るリストのイテレーションテスト (11テスト)
- [x] **Impl:** `PaginatedResult` および `AsyncIterator` の実装 (`src/pagination/PaginatedResult.ts`)
    - [x] `next` リンクの自動追従
    - [x] `items()` による要素単位イテレーション
    - [x] `toArray()` による全件取得

### 4.2 クライアント統合 (Client Entry Point)
- [x] **Impl:** `OsfClient` クラスの実装 (`src/client.ts`)
    - [x] 各リソースクラスのインスタンス化と公開 (nodes, files, users)
    - [x] 設定情報の注入 (token, baseUrl, timeout)
    - [x] 遅延初期化 (lazy singleton) パターン

### 4.3 リソースクラス拡張
- [x] `Nodes.listNodesPaginated()` - ノード一覧のページネーション対応
- [x] `Users.listUsersPaginated()` - ユーザー一覧のページネーション対応
- [x] `Files.listByNodePaginated()` - ファイル一覧のページネーション対応

## Phase 5: 品質保証とドキュメント (QA & Documentation)

### 5.1 統合テスト (Integration Testing)
- [x] 主要なユースケースを通した E2E シナリオテストの実装
- [x] テストカバレッジの最終確認 (80% 以上必須)

### 5.2 ドキュメント整備
- [x] README.md の更新 (使用例の追加)
- [x] TSDoc コメントの網羅チェック
- [x] CHANGELOG の作成

## 6. 今後の拡張 (Post-MVP)
- [ ] OAuth2 認証フローの追加
- [ ] ブラウザ対応の強化
