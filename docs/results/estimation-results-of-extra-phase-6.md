# Phase 6: クライアント統合と品質保証 (Integration & QA) — 工数見積もり

## 見積もり基準

Phase 1〜5 で実装済みのリソース・テスト・サンプルコードの現状を精査し、残作業を特定。

---

## 6.1 OsfClient 拡張 — **完了済み (作業不要)**

| 項目 | 状況 |
|---|---|
| `client.registrations` | 統合済み (`client.ts` L135-140) |
| `client.contributors` | 統合済み (`client.ts` L147-152) |
| `client.institutions` | 統合済み (`client.ts` L159-164) |
| `client.preprints` | 統合済み (`client.ts` L171-176) |
| `client.draftRegistrations` | 統合済み (`client.ts` L183-188) |
| `client.collections` | 統合済み (`client.ts` L195-200) |
| `client.wikis` | 統合済み (`client.ts` L207-212) |
| `client.comments` | 統合済み (`client.ts` L219-224) |
| `client.logs` | 統合済み (`client.ts` L231-236) |
| `client.subjects` | 統合済み (`client.ts` L243-248) |
| `client.licenses` | 統合済み (`client.ts` L255-260) |

プラン外のリソースも統合済み: `viewOnlyLinks`, `identifiers`, `citations`, `preprintProviders`, `registrationProviders`, `collectionProviders`, `scopes`, `applications`, `tokens`

**見積もり: 0行 / 0分**

---

## 6.2 統合テスト — 約 30〜40 分

### 現状

- 既存の統合テスト (`tests/integration/Scenarios.test.ts`): 3 シナリオ実装済み
  - Scenario 1: Project Lifecycle (Create → Update → Delete → 404 確認)
  - Scenario 2: User Exploration & Pagination (複数ページのイテレーション)
  - Scenario 3: File Navigation (Provider → Files → Versions)
- テストカバレッジ: Statements 96.37%, Branches 86.76%, Functions 95.6%, Lines 96.76% — **80% 閾値を大幅に超過**

### 6.2.1 Registration 作成フロー (Draft → Register)

| 項目 | 詳細 |
|---|---|
| テスト内容 | DraftRegistration 作成 → 更新 → Registration 化の一連フロー |
| モック対象 | `POST /draft_registrations/`, `PATCH /draft_registrations/{id}/`, `GET /registrations/{id}/` |
| 特徴 | 複数リソース横断 (DraftRegistrations → Registrations) |
| 見積もり | ~60行 / ~15分 |

### 6.2.2 Preprint 投稿フロー

| 項目 | 詳細 |
|---|---|
| テスト内容 | Preprint 作成 → ファイル・Contributors 取得の一連フロー |
| モック対象 | `POST /preprints/`, `GET /preprints/{id}/contributors/`, `GET /preprints/{id}/citation/` |
| 特徴 | サブリソース取得を含む |
| 見積もり | ~50行 / ~10分 |

### 6.2.3 コラボレーターの招待・権限管理

| 項目 | 詳細 |
|---|---|
| テスト内容 | Contributor 追加 → 権限変更 → 削除の一連フロー |
| モック対象 | `POST /nodes/{id}/contributors/`, `PATCH /nodes/{id}/contributors/{user_id}/`, `DELETE /nodes/{id}/contributors/{user_id}/` |
| 特徴 | CRUD 全操作、権限 (read → write → admin) の段階的変更 |
| 見積もり | ~60行 / ~10分 |

### 6.2.4 テストカバレッジ確認

| 項目 | 詳細 |
|---|---|
| 現状 | 全メトリクス 80% 超 (最低 86.76%) |
| 見積もり | 0分 (追加作業不要) |

---

## 6.3 ドキュメント更新 — 約 30〜40 分

### 6.3.1 README.md 更新

| 項目 | 詳細 |
|---|---|
| 現状 | Nodes, Files, Registrations, Contributors, Institutions, Pagination, Error Handling の例を記載 |
| 追加対象 | Preprints, DraftRegistrations, Collections, Wikis, Comments, Logs, Subjects, Licenses, ViewOnlyLinks, Identifiers, Citations, Providers, Auth (計13リソース) |
| 見積もり | ~150行追加 / ~15分 |

### 6.3.2 TSDoc コメントの網羅確認

| 項目 | 詳細 |
|---|---|
| 確認対象 | 全 22 リソースクラスの public メソッド |
| 見積もり | 確認 ~10分 + 不足分の追記 ~5分 |

### 6.3.3 CHANGELOG 更新

| 項目 | 詳細 |
|---|---|
| 現状 | v0.1.0 (Nodes, Files, Users) のみ記載 |
| 追加対象 | Phase 1〜5 で追加した 19 リソースのエントリ |
| 見積もり | ~40行追加 / ~10分 |

### 6.3.4 サンプルコード追加

| 項目 | 詳細 |
|---|---|
| 現状 | `examples/` に 20 ファイル、全リソースをカバー済み |
| `examples/README.md` | 全サンプルの説明・環境変数一覧を記載済み |
| 見積もり | 0行 / 0分 (追加作業不要) |

---

## 総合見積もり

| タスク | 状況 | コード行数 (概算) | 所要時間 (概算) |
|---|---|---|---|
| 6.1 OsfClient 拡張 | 完了済み | 0行 | 0分 |
| 6.2 統合テスト (3シナリオ) | 未着手 | ~170行 | 30〜40分 |
| 6.3 README.md 更新 | 一部完了 | ~150行 | ~15分 |
| 6.3 TSDoc 確認・補完 | 未確認 | ~20行 (想定) | ~15分 |
| 6.3 CHANGELOG 更新 | 未着手 | ~40行 | ~10分 |
| 6.3 サンプルコード | 完了済み | 0行 | 0分 |
| **合計** | | **~380行** | **約 60〜80分** |

## 備考

- 6.1 は Phase 1〜5 の各実装時にクライアント統合を同時に行ったため、全リソースが統合済み
- 6.2 の統合テストはモックベース (jest-fetch-mock) であり、既存の 3 シナリオと同パターンで機械的に実装可能
- 6.3 のサンプルコードも Phase 1〜5 で各リソースの例を同時に作成したため、20 ファイルが揃っている
- テストカバレッジは全メトリクスで 80% 閾値を大幅に上回っている (最低 86.76%)
