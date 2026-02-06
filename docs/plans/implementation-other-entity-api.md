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
- [ ] `src/types/registration.ts` の作成
    - [ ] `OsfRegistrationAttributes` インターフェース
    - [ ] `RegistrationListParams` フィルタ型
    - [ ] `RegistrationState` 列挙型 (public, embargoed, withdrawn 等)

#### テスト作成
- [ ] **Test:** Registration 取得テスト
- [ ] **Test:** Registration 一覧取得テスト (フィルタ・ページネーション)
- [ ] **Test:** Registration 更新テスト (メタデータ編集)
- [ ] **Test:** Registration の子要素取得テスト (children, contributors, files)

#### 実装
- [ ] **Impl:** `Registrations` クラスの実装 (`src/resources/Registrations.ts`)
    - [ ] `getById(id)` - Registration 取得
    - [ ] `listRegistrations(params)` - 一覧取得
    - [ ] `listRegistrationsPaginated(params)` - ページネーション対応一覧
    - [ ] `update(id, data)` - メタデータ更新
    - [ ] `listChildren(id)` - 子 Registration 一覧
    - [ ] `listContributors(id)` - コントリビューター一覧
    - [ ] `listFiles(id, provider)` - ファイル一覧
    - [ ] `listWikis(id)` - Wiki 一覧
    - [ ] `listLogs(id)` - ログ一覧

### 1.2 Contributors リソース - TDD

ノード/Registration のコントリビューター管理。Nodes 実装と密接に関連。

#### 型定義
- [ ] `src/types/contributor.ts` の作成
    - [ ] `OsfContributorAttributes` インターフェース
    - [ ] `ContributorPermission` 列挙型 (read, write, admin)
    - [ ] `CreateContributorInput` 型
    - [ ] `UpdateContributorInput` 型

#### テスト作成
- [ ] **Test:** Contributor 取得テスト
- [ ] **Test:** Node の Contributor 一覧取得テスト
- [ ] **Test:** Contributor 追加テスト
- [ ] **Test:** Contributor 権限更新テスト
- [ ] **Test:** Contributor 削除テスト

#### 実装
- [ ] **Impl:** `Contributors` クラスの実装 (`src/resources/Contributors.ts`)
    - [ ] `getByNodeAndUser(nodeId, userId)` - 特定コントリビューター取得
    - [ ] `listByNode(nodeId, params)` - ノードのコントリビューター一覧
    - [ ] `listByNodePaginated(nodeId, params)` - ページネーション対応
    - [ ] `addToNode(nodeId, data)` - コントリビューター追加
    - [ ] `update(nodeId, userId, data)` - 権限更新
    - [ ] `removeFromNode(nodeId, userId)` - コントリビューター削除
    - [ ] `listByRegistration(registrationId, params)` - Registration 用

### 1.3 Institutions リソース - TDD

研究機関。ユーザーやノードのアフィリエーション管理。

#### 型定義
- [ ] `src/types/institution.ts` の作成
    - [ ] `OsfInstitutionAttributes` インターフェース
    - [ ] `InstitutionListParams` フィルタ型

#### テスト作成
- [ ] **Test:** Institution 取得テスト
- [ ] **Test:** Institution 一覧取得テスト
- [ ] **Test:** Institution 所属ユーザー一覧テスト
- [ ] **Test:** Institution 所属ノード一覧テスト

#### 実装
- [ ] **Impl:** `Institutions` クラスの実装 (`src/resources/Institutions.ts`)
    - [ ] `getById(id)` - 機関取得
    - [ ] `listInstitutions(params)` - 一覧取得
    - [ ] `listInstitutionsPaginated(params)` - ページネーション対応
    - [ ] `listUsers(institutionId)` - 所属ユーザー一覧
    - [ ] `listNodes(institutionId)` - 所属ノード一覧
    - [ ] `listRegistrations(institutionId)` - 所属 Registration 一覧

---

## Phase 2: 学術出版機能 (Academic Publishing)

プレプリントと登録ワークフローを実装します。

### 2.1 Preprints リソース - TDD

査読前論文の共有機能。arXiv 等と類似の機能。

#### 型定義
- [ ] `src/types/preprint.ts` の作成
    - [ ] `OsfPreprintAttributes` インターフェース
    - [ ] `PreprintListParams` フィルタ型
    - [ ] `PreprintState` 列挙型
    - [ ] `CreatePreprintInput` 型
    - [ ] `UpdatePreprintInput` 型

#### テスト作成
- [ ] **Test:** Preprint 取得テスト
- [ ] **Test:** Preprint 一覧取得テスト
- [ ] **Test:** Preprint 作成テスト
- [ ] **Test:** Preprint 更新テスト
- [ ] **Test:** Preprint コントリビューター一覧テスト
- [ ] **Test:** Preprint ファイル一覧テスト

#### 実装
- [ ] **Impl:** `Preprints` クラスの実装 (`src/resources/Preprints.ts`)
    - [ ] `getById(id)` - Preprint 取得
    - [ ] `listPreprints(params)` - 一覧取得
    - [ ] `listPreprintsPaginated(params)` - ページネーション対応
    - [ ] `create(data)` - Preprint 作成
    - [ ] `update(id, data)` - Preprint 更新
    - [ ] `listContributors(id)` - コントリビューター一覧
    - [ ] `listFiles(id)` - ファイル一覧
    - [ ] `getCitation(id, styleId)` - 引用取得

### 2.2 Draft Registrations リソース - TDD

Registration の下書き管理。Registration 作成ワークフローの一部。

#### 型定義
- [ ] `src/types/draft-registration.ts` の作成
    - [ ] `OsfDraftRegistrationAttributes` インターフェース
    - [ ] `DraftRegistrationListParams` フィルタ型
    - [ ] `CreateDraftRegistrationInput` 型
    - [ ] `UpdateDraftRegistrationInput` 型

#### テスト作成
- [ ] **Test:** Draft Registration 取得テスト
- [ ] **Test:** Draft Registration 一覧取得テスト
- [ ] **Test:** Draft Registration 作成テスト
- [ ] **Test:** Draft Registration 更新テスト
- [ ] **Test:** Draft Registration 削除テスト

#### 実装
- [ ] **Impl:** `DraftRegistrations` クラスの実装 (`src/resources/DraftRegistrations.ts`)
    - [ ] `getById(id)` - Draft Registration 取得
    - [ ] `listDraftRegistrations(params)` - 一覧取得
    - [ ] `listDraftRegistrationsPaginated(params)` - ページネーション対応
    - [ ] `create(data)` - 作成
    - [ ] `update(id, data)` - 更新
    - [ ] `delete(id)` - 削除
    - [ ] `listContributors(id)` - コントリビューター一覧

---

## Phase 3: コラボレーション機能 (Collaboration Features)

コンテンツ整理とコラボレーションツールを実装します。

### 3.1 Collections リソース - TDD

コンテンツのグループ化・キュレーション機能。

#### 型定義
- [ ] `src/types/collection.ts` の作成
    - [ ] `OsfCollectionAttributes` インターフェース
    - [ ] `CollectionListParams` フィルタ型
    - [ ] `CreateCollectionInput` 型

#### テスト作成
- [ ] **Test:** Collection 取得テスト
- [ ] **Test:** Collection 一覧取得テスト
- [ ] **Test:** Collection 作成テスト
- [ ] **Test:** Collection 削除テスト
- [ ] **Test:** Collection のリンクノード一覧テスト

#### 実装
- [ ] **Impl:** `Collections` クラスの実装 (`src/resources/Collections.ts`)
    - [ ] `getById(id)` - Collection 取得
    - [ ] `listCollections(params)` - 一覧取得
    - [ ] `listCollectionsPaginated(params)` - ページネーション対応
    - [ ] `create(data)` - 作成
    - [ ] `delete(id)` - 削除
    - [ ] `listLinkedNodes(id)` - リンクノード一覧
    - [ ] `listLinkedRegistrations(id)` - リンク Registration 一覧
    - [ ] `addLinkedNode(id, nodeId)` - ノードをリンク
    - [ ] `removeLinkedNode(id, nodeId)` - リンク解除

### 3.2 Wikis リソース - TDD

プロジェクトドキュメンテーション機能。

#### 型定義
- [ ] `src/types/wiki.ts` の作成
    - [ ] `OsfWikiAttributes` インターフェース
    - [ ] `WikiVersionAttributes` インターフェース

#### テスト作成
- [ ] **Test:** Wiki 取得テスト
- [ ] **Test:** Wiki コンテンツ取得テスト
- [ ] **Test:** Wiki バージョン一覧テスト
- [ ] **Test:** Wiki バージョン作成テスト

#### 実装
- [ ] **Impl:** `Wikis` クラスの実装 (`src/resources/Wikis.ts`)
    - [ ] `getById(id)` - Wiki 取得
    - [ ] `getContent(id)` - コンテンツ取得
    - [ ] `listVersions(id)` - バージョン一覧
    - [ ] `createVersion(id, content)` - 新バージョン作成

### 3.3 Comments リソース - TDD

ディスカッション・コメント機能。

#### 型定義
- [ ] `src/types/comment.ts` の作成
    - [ ] `OsfCommentAttributes` インターフェース
    - [ ] `CreateCommentInput` 型
    - [ ] `UpdateCommentInput` 型

#### テスト作成
- [ ] **Test:** Comment 取得テスト
- [ ] **Test:** Node のコメント一覧テスト
- [ ] **Test:** Comment 作成テスト
- [ ] **Test:** Comment 更新テスト
- [ ] **Test:** Comment 削除テスト

#### 実装
- [ ] **Impl:** `Comments` クラスの実装 (`src/resources/Comments.ts`)
    - [ ] `getById(id)` - コメント取得
    - [ ] `listByNode(nodeId)` - ノードのコメント一覧
    - [ ] `listByNodePaginated(nodeId)` - ページネーション対応
    - [ ] `create(nodeId, data)` - コメント作成
    - [ ] `update(id, data)` - コメント更新
    - [ ] `delete(id)` - コメント削除

---

## Phase 4: 監査・分類機能 (Audit & Classification)

ログ、サブジェクト、その他の補助機能を実装します。

### 4.1 Logs リソース - TDD

アクティビティログ・監査機能。

#### 型定義
- [ ] `src/types/log.ts` の作成
    - [ ] `OsfLogAttributes` インターフェース
    - [ ] `LogAction` 列挙型

#### テスト作成
- [ ] **Test:** Log 取得テスト
- [ ] **Test:** Node のログ一覧テスト
- [ ] **Test:** Actions 一覧テスト

#### 実装
- [ ] **Impl:** `Logs` クラスの実装 (`src/resources/Logs.ts`)
    - [ ] `getById(id)` - ログ取得
    - [ ] `listByNode(nodeId)` - ノードのログ一覧
    - [ ] `listByNodePaginated(nodeId)` - ページネーション対応
    - [ ] `listActions()` - アクション一覧

### 4.2 Subjects リソース - TDD

タクソノミー・分類機能。

#### 型定義
- [ ] `src/types/subject.ts` の作成
    - [ ] `OsfSubjectAttributes` インターフェース

#### テスト作成
- [ ] **Test:** Subject 取得テスト
- [ ] **Test:** Subject 一覧取得テスト
- [ ] **Test:** Subject の子要素取得テスト

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
