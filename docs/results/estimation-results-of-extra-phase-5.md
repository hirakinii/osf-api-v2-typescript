# Phase 5: 管理機能 (Administrative Features) — 工数見積もり

## 見積もり基準

既存の `Licenses` リソース (シンプルな2エンドポイント・読み取り専用) を1単位 (小) として基準に設定。

各リソースで必要な成果物:
- 型定義ファイル (`src/types/xxx.ts`)
- リソースクラス (`src/resources/Xxx.ts`)
- テストファイル (`tests/resources/Xxx.test.ts`)
- バレルエクスポート更新 (`src/types/index.ts`, `src/resources/index.ts`)
- クライアント統合 (`src/client.ts` に lazy getter 追加)

---

## 5.1 View Only Links — 小 (Licenses と同程度)

| 項目 | 詳細 |
|---|---|
| APIエンドポイント | `GET /view_only_links/{link_id}/` — VOL 取得 |
|  | `GET /view_only_links/{link_id}/nodes/` — VOL でアクセス可能なノード一覧 |
| 特徴 | 読み取り専用、シンプルな属性 |
| 見積もり | 型 ~20行 + リソース ~35行 + テスト ~120行 |

## 5.2 Identifiers — 小 (Licenses と同程度)

| 項目 | 詳細 |
|---|---|
| APIエンドポイント | `GET /identifiers/{identifier_id}/` — 識別子取得 |
|  | `GET /nodes/{node_id}/identifiers/` — ノードの識別子一覧 |
| 特徴 | 読み取り専用、属性は `category` と `value` の2つのみ |
| 見積もり | 型 ~20行 + リソース ~35行 + テスト ~120行 |

## 5.3 Citations — 小 (Licenses より少し小さい)

| 項目 | 詳細 |
|---|---|
| APIエンドポイント | `GET /citations/styles/` — 引用スタイル一覧 |
|  | `GET /citations/styles/{style_id}/` — スタイル詳細取得 |
| 特徴 | 読み取り専用、認証不要、エラーケースなし |
| 見積もり | 型 ~20行 + リソース ~30行 + テスト ~100行 |

## 5.4 Providers — 中〜大 (3リソースの合計)

各 Provider は基本パターン (list + getById) は共通だが、サブリソースのエンドポイントが多い。

### 5.4.1 PreprintProviders

| 項目 | 詳細 |
|---|---|
| 基本エンドポイント | `GET /preprint_providers/` — 一覧 |
|  | `GET /preprint_providers/{provider_id}/` — 詳細取得 |
| サブリソース (12+) | preprints, taxonomies, highlighted taxonomies, licenses, moderators (CRUD), withdraw requests, citation styles |
| 見積もり (基本のみ) | 型 ~20行 + リソース ~30行 + テスト ~100行 |
| 見積もり (全サブリソース) | 型 ~30行 + リソース ~80行 + テスト ~250行 |

### 5.4.2 RegistrationProviders

| 項目 | 詳細 |
|---|---|
| 基本エンドポイント | `GET /providers/registrations/` — 一覧 |
|  | `GET /providers/registrations/{provider_id}/` — 詳細取得 |
| サブリソース (16+) | registrations, taxonomies, highlighted taxonomies, licenses, actions, requests, schemas, subjects, highlighted subjects, moderators (CRUD) |
| 見積もり (基本のみ) | 型 ~20行 + リソース ~30行 + テスト ~100行 |
| 見積もり (全サブリソース) | 型 ~30行 + リソース ~90行 + テスト ~280行 |

### 5.4.3 CollectionProviders

| 項目 | 詳細 |
|---|---|
| 基本エンドポイント | `GET /providers/collections/` — 一覧 |
|  | `GET /providers/collections/{provider_id}/` — 詳細取得 |
| サブリソース (9+) | licenses, submissions, subjects, highlighted subjects, taxonomies (deprecated), moderators |
| 見積もり (基本のみ) | 型 ~20行 + リソース ~30行 + テスト ~100行 |
| 見積もり (全サブリソース) | 型 ~25行 + リソース ~60行 + テスト ~200行 |

## 5.5 認証関連 — 中 (3リソースの合計)

### 5.5.1 Applications (OAuth アプリ管理)

| 項目 | 詳細 |
|---|---|
| APIエンドポイント | `GET /applications/` — アプリ一覧 |
|  | `POST /applications/` — アプリ作成 |
|  | `GET /applications/{client_id}/` — アプリ詳細取得 |
|  | `PATCH /applications/{client_id}/` — アプリ更新 |
|  | `DELETE /applications/{client_id}/` — アプリ無効化 |
| 特徴 | CRUD 全操作、属性は name, description, home_url, callback_url |
| 見積もり | 型 ~25行 + リソース ~60行 + テスト ~200行 |

### 5.5.2 Tokens (PAT 管理)

| 項目 | 詳細 |
|---|---|
| APIエンドポイント | `GET /tokens/` — トークン一覧 |
|  | `POST /tokens/` — トークン作成 |
|  | `GET /tokens/{_id}/` — トークン詳細取得 |
|  | `DELETE /tokens/{_id}/` — トークン無効化 |
|  | `GET /tokens/{_id}/scopes/` — トークンのスコープ一覧 |
| 特徴 | CRUD + サブリソース、作成時に relationships (scopes) が必要 |
| 見積もり | 型 ~25行 + リソース ~55行 + テスト ~200行 |

### 5.5.3 Scopes (OAuth スコープ)

| 項目 | 詳細 |
|---|---|
| APIエンドポイント | `GET /scopes/` — スコープ一覧 |
|  | `GET /scopes/{scope_id}/` — スコープ詳細取得 |
| 特徴 | 読み取り専用、認証不要 |
| 見積もり | 型 ~15行 + リソース ~30行 + テスト ~100行 |

---

## 総合見積もり

| 範囲 | リソース数 | 合計コード行数 (概算) |
|---|---|---|
| 5.1 〜 5.3 (必須) | 3 | ~500行 |
| 5.4 Providers (オプション・基本のみ) | 3 | ~450行 |
| 5.4 Providers (オプション・全サブリソース) | 3 | ~1,000行 |
| 5.5 認証関連 (オプション) | 3 | ~700行 |
| **全体 (基本スコープ)** | **9** | **~1,650行** |
| **全体 (フルスコープ)** | **9** | **~2,200行** |

## 備考

- パターンが確立されているため、実装は機械的に進められる
- 5.1〜5.3 は特にシンプルで、既存の Licenses リソースと同等の工数
- 5.4 Providers はスコープ次第で工数が大きく変動 (基本 list/get のみ vs 全サブリソース)
- 5.5 認証関連は CRUD 操作があるため 5.1〜5.3 より工数が多いが、既存の Nodes 等と同パターン
