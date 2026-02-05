# Implementation Plan

本ドキュメントは、OSF API v2 TypeScript クライアントライブラリの実装計画を定義します。
開発は **TDD (Test-Driven Development)** サイクルを厳守し、各ステップでテストカバレッジ >80% を維持しながら進めます。

## Phase 1: プロジェクト初期設定とコア基盤 (Setup & Core Foundation)

このフェーズでは、開発環境の整備と、API クライアントの土台となる通信・エラー処理・型定義を実装します。

### 1.1 環境構築 (Environment Setup)
- [ ] ディレクトリ構造の作成 (`src/`, `tests/` 等)
- [ ] TypeScript 設定 (`tsconfig.json`) の最適化
- [ ] Linter/Formatter 設定 (`eslint`, `prettier`) の確立
- [ ] テスト環境 (`jest`, `ts-jest`) のセットアップ

### 1.2 基本型定義 (Core Types)
- [ ] JSON:API レスポンスのジェネリクス型定義 (`JsonApiResponse<T>`)
- [ ] 共通エンティティインターフェース定義 (`OsfNode`, `OsfFile`, `OsfUser`)
- [ ] エラー型定義 (`OsfApiError`)

### 1.3 ネットワーク層 (Network Layer) - TDD
- [ ] **Test:** モックサーバーを用いた HTTP リクエスト/レスポンスのテスト作成
- [ ] **Impl:** `HttpClient` クラスの実装 (Node.js native `fetch` 使用)
    - [ ] Base URL 管理
    - [ ] Authorization Header 付与
    - [ ] タイムアウト処理
- [ ] **Impl:** エラーハンドリングロジックの実装
    - [ ] ステータスコードに基づくカスタムエラー (`OsfAuthenticationError` 等) へのマッピング

## Phase 2: データアダプターとリソース基盤 (Adapters & Base Resource)

JSON:API の複雑さを吸収する変換処理と、リソース操作の共通ロジックを実装します。

### 2.1 アダプター実装 (Adapter Layer) - TDD
- [ ] **Test:** JSON:API 形式のサンプルレスポンスを用いた変換テスト作成
- [ ] **Impl:** `JsonApiAdapter` の実装
    - [ ] `data.attributes` のフラット化
    - [ ] リレーションシップ情報の整理

### 2.2 リソース基底クラス (Base Resource)
- [ ] **Test:** 基底クラスの共通メソッドに対するテスト作成
- [ ] **Impl:** `BaseResource` クラスの実装
    - [ ] `HttpClient` の保持
    - [ ] 共通の `get`, `list` 処理の枠組み

## Phase 3: リソース実装 (Resource Implementation)

各エンドポイントに対応するリソース操作クラスを順次実装します。

### 3.1 Nodes リソース (Nodes) - TDD
- [ ] **Test:** ノード取得、作成、更新、削除の単体テスト & 統合テスト
- [ ] **Impl:** `Nodes` クラスの実装
    - [ ] `get(id)`
    - [ ] `list(params)`
    - [ ] `create(data)`
    - [ ] `update(id, data)`
    - [ ] `delete(id)`

### 3.2 Files リソース (Files) - TDD
- [ ] **Test:** ファイル情報取得、ダウンロード、アップロードのテスト (Stream/Buffer モック使用)
- [ ] **Impl:** `Files` クラスの実装
    - [ ] メタデータと実データ (Waterbutler) の扱い分け
    - [ ] `download(id)`: Stream 返却
    - [ ] `upload(nodeId, data)`

### 3.3 Users リソース (Users) - TDD
- [ ] **Test:** ユーザー情報取得のテスト
- [ ] **Impl:** `Users` クラスの実装
    - [ ] `me()`
    - [ ] `get(id)`

## Phase 4: ユーティリティとクライアント統合 (Utils & Integration)

### 4.1 ページネーション (Pagination) - TDD
- [ ] **Test:** 複数ページに渡るリストのイテレーションテスト
- [ ] **Impl:** `PaginatedResult` および `AsyncIterator` の実装
    - [ ] `next` リンクの自動追従

### 4.2 クライアント統合 (Client Entry Point)
- [ ] **Impl:** `OsfClient` クラスの実装
    - [ ] 各リソースクラスのインスタンス化と公開
    - [ ] 設定情報の注入

## Phase 5: 品質保証とドキュメント (QA & Documentation)

### 5.1 統合テスト (Integration Testing)
- [ ] 主要なユースケースを通した E2E シナリオテストの実装
- [ ] テストカバレッジの最終確認 (80% 以上必須)

### 5.2 ドキュメント整備
- [ ] README.md の更新 (使用例の追加)
- [ ] TSDoc コメントの網羅チェック
- [ ] CHANGELOG の作成

## 6. 今後の拡張 (Post-MVP)
- [ ] OAuth2 認証フローの追加
- [ ] ブラウザ対応の強化
