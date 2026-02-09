# Implementation Plan: Other Entity APIs

本ドキュメントは、OSF API v2 TypeScript クライアントライブラリにおける追加エンティティの実装計画を定義します。
既存の Nodes / Files / Users 実装をベースに、OSF のコア機能を拡充していきます。

開発は引き続き **TDD (Test-Driven Development)** サイクルを厳守し、テストカバレッジ >80% を維持しながら進めます。

---

## 現在の実装状況

| エンティティ | ステータス | 備考 |
|------------|----------|------|
| Nodes | 完了 | CRUD + ページネーション対応 |
| Files | 完了 | メタデータ取得 + Waterbutler連携 |
| Users | 完了 | 取得 + ページネーション対応 |

---

## Phase 1: コア機能拡充 (Core Feature Expansion)

OSF の根幹となる研究成果の永続化・共有機能を実装します。

### 1.1 Registrations リソース - TDD

研究の永続的なスナップショット。OSF の最重要機能の一つ。

#### 型定義
- [x] `src/types/registration.ts` の作成
    - [x] `OsfRegistrationAttributes` インターフェース
    - [x] `RegistrationListParams` フィルタ型
    - [x] `RegistrationState` 列挙型 (public, embargoed, withdrawn 等)

#### テスト作成
- [x] **Test:** Registration 取得テスト
- [x] **Test:** Registration 一覧取得テスト (フィルタ・ページネーション)
- [x] **Test:** Registration 更新テスト (メタデータ編集)
- [x] **Test:** Registration の子要素取得テスト (children, contributors, files)

#### 実装
- [x] **Impl:** `Registrations` クラスの実装 (`src/resources/Registrations.ts`)
    - [x] `getById(id)` - Registration 取得
    - [x] `listRegistrations(params)` - 一覧取得
    - [x] `listRegistrationsPaginated(params)` - ページネーション対応一覧
    - [x] `update(id, data)` - メタデータ更新
    - [x] `listChildren(id)` - 子 Registration 一覧
    - [x] `listContributors(id)` - コントリビューター一覧
    - [x] `listFiles(id, provider)` - ファイル一覧
    - [x] `listWikis(id)` - Wiki 一覧
    - [x] `listLogs(id)` - ログ一覧

### 1.2 Contributors リソース - TDD

ノード/Registration のコントリビューター管理。Nodes 実装と密接に関連。

#### 型定義
- [x] `src/types/contributor.ts` の作成
    - [x] `OsfContributorAttributes` インターフェース
    - [x] `ContributorPermission` 列挙型 (read, write, admin)
    - [x] `CreateContributorInput` 型
    - [x] `UpdateContributorInput` 型

#### テスト作成
- [x] **Test:** Contributor 取得テスト
- [x] **Test:** Node の Contributor 一覧取得テスト
- [x] **Test:** Contributor 追加テスト
- [x] **Test:** Contributor 権限更新テスト
- [x] **Test:** Contributor 削除テスト

#### 実装
- [x] **Impl:** `Contributors` クラスの実装 (`src/resources/Contributors.ts`)
    - [x] `getByNodeAndUser(nodeId, userId)` - 特定コントリビューター取得
    - [x] `listByNode(nodeId, params)` - ノードのコントリビューター一覧
    - [x] `listByNodePaginated(nodeId, params)` - ページネーション対応
    - [x] `addToNode(nodeId, data)` - コントリビューター追加
    - [x] `update(nodeId, userId, data)` - 権限更新
    - [x] `removeFromNode(nodeId, userId)` - コントリビューター削除
    - [x] `listByRegistration(registrationId, params)` - Registration 用

### 1.3 Institutions リソース - TDD

研究機関。ユーザーやノードのアフィリエーション管理。

#### 型定義
- [x] `src/types/institution.ts` の作成
    - [x] `OsfInstitutionAttributes` インターフェース
    - [x] `InstitutionListParams` フィルタ型

#### テスト作成
- [x] **Test:** Institution 取得テスト
- [x] **Test:** Institution 一覧取得テスト
- [x] **Test:** Institution 所属ユーザー一覧テスト
- [x] **Test:** Institution 所属ノード一覧テスト

#### 実装
- [x] **Impl:** `Institutions` クラスの実装 (`src/resources/Institutions.ts`)
    - [x] `getById(id)` - 機関取得
    - [x] `listInstitutions(params)` - 一覧取得
    - [x] `listInstitutionsPaginated(params)` - ページネーション対応
    - [x] `listUsers(institutionId)` - 所属ユーザー一覧
    - [x] `listNodes(institutionId)` - 所属ノード一覧
    - [x] `listRegistrations(institutionId)` - 所属 Registration 一覧

---

## Phase 2: 学術出版機能 (Academic Publishing)

プレプリントと登録ワークフローを実装します。

### 2.1 Preprints リソース - TDD

査読前論文の共有機能。arXiv 等と類似の機能。

#### 型定義
- [x] `src/types/preprint.ts` の作成
    - [x] `OsfPreprintAttributes` インターフェース
    - [x] `PreprintListParams` フィルタ型
    - [x] `PreprintReviewsState` / `PreprintDataLinksState` 型
    - [x] `CreatePreprintInput` 型
    - [x] `UpdatePreprintInput` 型

#### テスト作成
- [x] **Test:** Preprint 取得テスト
- [x] **Test:** Preprint 一覧取得テスト
- [x] **Test:** Preprint 作成テスト
- [x] **Test:** Preprint 更新テスト
- [x] **Test:** Preprint コントリビューター一覧テスト
- [x] **Test:** Preprint ファイル一覧テスト

#### 実装
- [x] **Impl:** `Preprints` クラスの実装 (`src/resources/Preprints.ts`)
    - [x] `getById(id)` - Preprint 取得
    - [x] `listPreprints(params)` - 一覧取得
    - [x] `listPreprintsPaginated(params)` - ページネーション対応
    - [x] `create(data)` - Preprint 作成
    - [x] `update(id, data)` - Preprint 更新
    - [x] `listContributors(id)` - コントリビューター一覧
    - [x] `listFiles(id)` - ファイル一覧
    - [x] `getCitation(id, styleId)` - 引用取得

### 2.2 Draft Registrations リソース - TDD

Registration の下書き管理。Registration 作成ワークフローの一部。

#### 型定義
- [x] `src/types/draft-registration.ts` の作成
    - [x] `OsfDraftRegistrationAttributes` インターフェース
    - [x] `DraftRegistrationListParams` フィルタ型
    - [x] `CreateDraftRegistrationInput` 型
    - [x] `UpdateDraftRegistrationInput` 型

#### テスト作成
- [x] **Test:** Draft Registration 取得テスト
- [x] **Test:** Draft Registration 一覧取得テスト
- [x] **Test:** Draft Registration 作成テスト
- [x] **Test:** Draft Registration 更新テスト
- [x] **Test:** Draft Registration 削除テスト

#### 実装
- [x] **Impl:** `DraftRegistrations` クラスの実装 (`src/resources/DraftRegistrations.ts`)
    - [x] `getById(id)` - Draft Registration 取得
    - [x] `listDraftRegistrations(params)` - 一覧取得
    - [x] `listDraftRegistrationsPaginated(params)` - ページネーション対応
    - [x] `create(data)` - 作成
    - [x] `update(id, data)` - 更新
    - [x] `delete(id)` - 削除
    - [x] `listContributors(id)` - コントリビューター一覧

---

## Phase 3: コラボレーション機能 (Collaboration Features)

コンテンツ整理とコラボレーションツールを実装します。

### 3.1 Collections リソース - TDD

コンテンツのグループ化・キュレーション機能。

#### 型定義
- [x] `src/types/collection.ts` の作成
    - [x] `OsfCollectionAttributes` インターフェース
    - [x] `CollectionListParams` フィルタ型
    - [x] `CreateCollectionInput` 型

#### テスト作成
- [x] **Test:** Collection 取得テスト
- [x] **Test:** Collection 一覧取得テスト
- [x] **Test:** Collection 作成テスト
- [x] **Test:** Collection 削除テスト
- [x] **Test:** Collection のリンクノード一覧テスト

#### 実装
- [x] **Impl:** `Collections` クラスの実装 (`src/resources/Collections.ts`)
    - [x] `getById(id)` - Collection 取得
    - [x] `listCollections(params)` - 一覧取得
    - [x] `listCollectionsPaginated(params)` - ページネーション対応
    - [x] `create(data)` - 作成
    - [x] `delete(id)` - 削除
    - [x] `listLinkedNodes(id)` - リンクノード一覧
    - [x] `listLinkedRegistrations(id)` - リンク Registration 一覧
    - [x] `addLinkedNode(id, nodeId)` - ノードをリンク
    - [x] `removeLinkedNode(id, nodeId)` - リンク解除

### 3.2 Wikis リソース - TDD

プロジェクトドキュメンテーション機能。

#### 型定義
- [x] `src/types/wiki.ts` の作成
    - [x] `OsfWikiAttributes` インターフェース
    - [x] `WikiVersionAttributes` インターフェース

#### テスト作成
- [x] **Test:** Wiki 取得テスト
- [x] **Test:** Wiki コンテンツ取得テスト
- [x] **Test:** Wiki バージョン一覧テスト
- [x] **Test:** Wiki バージョン作成テスト

#### 実装
- [x] **Impl:** `Wikis` クラスの実装 (`src/resources/Wikis.ts`)
    - [x] `getById(id)` - Wiki 取得
    - [x] `getContent(id)` - コンテンツ取得
    - [x] `listVersions(id)` - バージョン一覧
    - [x] `createVersion(id, content)` - 新バージョン作成

### 3.3 Comments リソース - TDD

ディスカッション・コメント機能。

#### 型定義
- [x] `src/types/comment.ts` の作成
    - [x] `OsfCommentAttributes` インターフェース
    - [x] `CreateCommentInput` 型
    - [x] `UpdateCommentInput` 型

#### テスト作成
- [x] **Test:** Comment 取得テスト
- [x] **Test:** Node のコメント一覧テスト
- [x] **Test:** Comment 作成テスト
- [x] **Test:** Comment 更新テスト
- [x] **Test:** Comment 削除テスト

#### 実装
- [x] **Impl:** `Comments` クラスの実装 (`src/resources/Comments.ts`)
    - [x] `getById(id)` - コメント取得
    - [x] `listByNode(nodeId)` - ノードのコメント一覧
    - [x] `listByNodePaginated(nodeId)` - ページネーション対応
    - [x] `create(nodeId, data)` - コメント作成
    - [x] `update(id, data)` - コメント更新
    - [x] `delete(id)` - コメント削除

---

## Phase 4: 監査・分類機能 (Audit & Classification)

ログ、サブジェクト、その他の補助機能を実装します。

### 4.1 Logs リソース - TDD

アクティビティログ・監査機能。

#### 型定義
- [x] `src/types/log.ts` の作成
    - [x] `OsfLogAttributes` インターフェース
    - [x] `LogAction` 列挙型

#### テスト作成
- [x] **Test:** Log 取得テスト
- [x] **Test:** Node のログ一覧テスト
- [x] **Test:** Actions 一覧テスト
- [ ] **Test:** `tests/client.test.ts` への Log 関連テスト追加

#### 実装
- [x] **Impl:** `Logs` クラスの実装 (`src/resources/Logs.ts`)
    - [x] `getById(id)` - ログ取得
    - [x] `listByNode(nodeId)` - ノードのログ一覧
    - [x] `listByNodePaginated(nodeId)` - ページネーション対応
    - [x] `listActions()` - アクション一覧

### 4.2 Subjects リソース - TDD

タクソノミー・分類機能。

#### 型定義
- [ ] `src/types/subject.ts` の作成
    - [ ] `OsfSubjectAttributes` インターフェース

#### テスト作成
- [ ] **Test:** Subject 取得テスト
- [ ] **Test:** Subject 一覧取得テスト
- [ ] **Test:** Subject の子要素取得テスト
- [ ] **Test:** `tests/client.test.ts` への Subject 関連テスト追加

#### 実装
- [ ] **Impl:** `Subjects` クラスの実装 (`src/resources/Subjects.ts`)
    - [ ] `getById(id)` - Subject 取得
    - [ ] `listSubjects(params)` - 一覧取得
    - [ ] `listSubjectsPaginated(params)` - ページネーション対応
    - [ ] `listChildren(id)` - 子 Subject 一覧

### 4.3 Licenses リソース - TDD

ライセンス情報の取得。

#### 型定義
- [ ] `src/types/license.ts` の作成
    - [ ] `OsfLicenseAttributes` インターフェース

#### テスト作成
- [ ] **Test:** License 取得テスト
- [ ] **Test:** License 一覧取得テスト
- [ ] **Test:** `tests/client.test.ts` への License 関連テスト追加

#### 実装
- [ ] **Impl:** `Licenses` クラスの実装 (`src/resources/Licenses.ts`)
    - [ ] `getById(id)` - ライセンス取得
    - [ ] `listLicenses()` - 一覧取得

---

## Phase 5: 管理機能 (Administrative Features)

認証、プロバイダー、その他の管理機能を実装します。

### 5.1 View Only Links リソース
- [ ] `ViewOnlyLinks` クラスの実装
    - [ ] `getById(id)` - VOL 取得
    - [ ] `listNodes(linkId)` - VOL でアクセス可能なノード一覧

### 5.2 Identifiers リソース
- [ ] `Identifiers` クラスの実装
    - [ ] `getById(id)` - 識別子取得
    - [ ] `listByNode(nodeId)` - ノードの識別子一覧

### 5.3 Citations リソース
- [ ] `Citations` クラスの実装
    - [ ] `listStyles()` - 引用スタイル一覧
    - [ ] `getStyle(id)` - スタイル詳細取得

### 5.4 Providers リソース (オプション)
- [ ] `PreprintProviders` クラスの実装
- [ ] `RegistrationProviders` クラスの実装
- [ ] `CollectionProviders` クラスの実装

### 5.5 認証関連 (オプション)
- [ ] `Applications` クラスの実装 (OAuth アプリ管理)
- [ ] `Tokens` クラスの実装 (PAT 管理)
- [ ] `Scopes` クラスの実装 (OAuth スコープ)

---

## Phase 6: クライアント統合と品質保証 (Integration & QA)

### 6.1 OsfClient 拡張
- [ ] 新規リソースクラスの統合
    - [ ] `client.registrations`
    - [ ] `client.contributors`
    - [ ] `client.institutions`
    - [ ] `client.preprints`
    - [ ] `client.draftRegistrations`
    - [ ] `client.collections`
    - [ ] `client.wikis`
    - [ ] `client.comments`
    - [ ] `client.logs`
    - [ ] `client.subjects`
    - [ ] `client.licenses`

### 6.2 統合テスト
- [ ] 主要ユースケースの E2E テスト
    - [ ] Registration 作成フロー (Draft → Register)
    - [ ] Preprint 投稿フロー
    - [ ] コラボレーターの招待・権限管理
- [ ] テストカバレッジ確認 (80% 以上維持)

### 6.3 ドキュメント更新
- [ ] README.md の更新 (新 API の使用例追加)
- [ ] TSDoc コメントの網羅確認
- [ ] CHANGELOG の更新
- [ ] サンプルコードの追加

---

## 優先度まとめ

| 優先度 | Phase | 対象エンティティ | 理由 |
|-------|-------|-----------------|------|
| 高 | 1 | Registrations, Contributors, Institutions | OSF コア機能。研究の永続化と共同研究者管理 |
| 高 | 2 | Preprints, Draft Registrations | 学術出版機能。登録ワークフロー |
| 中 | 3 | Collections, Wikis, Comments | コラボレーション・ドキュメント機能 |
| 中 | 4 | Logs, Subjects, Licenses | 監査・分類・メタデータ機能 |
| 低 | 5 | View Only Links, Identifiers, Citations, Providers | 補助・管理機能 |

---

## 見積もり

| Phase | 想定工数 | 備考 |
|-------|---------|------|
| Phase 1 | 3-4 日 | 3 リソース + 型定義 |
| Phase 2 | 2-3 日 | 2 リソース |
| Phase 3 | 2-3 日 | 3 リソース |
| Phase 4 | 1-2 日 | 3 リソース (比較的シンプル) |
| Phase 5 | 1-2 日 | オプション機能 |
| Phase 6 | 1-2 日 | 統合・QA |
| **合計** | **10-16 日** | |

---

## 参考: API エンドポイント一覧

### Registrations
- `GET /registrations/` - 一覧取得
- `GET /registrations/{id}/` - 詳細取得
- `PATCH /registrations/{id}/` - 更新
- `GET /registrations/{id}/children/` - 子 Registration
- `GET /registrations/{id}/contributors/` - コントリビューター
- `GET /registrations/{id}/files/{provider}/` - ファイル
- `GET /registrations/{id}/wikis/` - Wiki
- `GET /registrations/{id}/logs/` - ログ

### Preprints
- `GET /preprints/` - 一覧取得
- `POST /preprints/` - 作成
- `GET /preprints/{id}/` - 詳細取得
- `PATCH /preprints/{id}/` - 更新
- `GET /preprints/{id}/contributors/` - コントリビューター
- `GET /preprints/{id}/files/` - ファイル

### Contributors
- `GET /nodes/{id}/contributors/` - ノードのコントリビューター一覧
- `POST /nodes/{id}/contributors/` - 追加
- `GET /nodes/{id}/contributors/{user_id}/` - 詳細
- `PATCH /nodes/{id}/contributors/{user_id}/` - 更新
- `DELETE /nodes/{id}/contributors/{user_id}/` - 削除

### Institutions
- `GET /institutions/` - 一覧
- `GET /institutions/{id}/` - 詳細
- `GET /institutions/{id}/users/` - 所属ユーザー
- `GET /institutions/{id}/nodes/` - 所属ノード
- `GET /institutions/{id}/registrations/` - 所属 Registration
