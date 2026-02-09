# Integration Tests

`Scenarios.test.ts` には、複数リソースを横断する主要ユースケースの統合テストが含まれています。
すべてのテストは `jest-fetch-mock` によるモックベースで動作し、実際の API 呼び出しは行いません。

## シナリオ一覧

| # | シナリオ | 使用リソース | 検証内容 |
|---|---------|-------------|---------|
| 1 | Project Lifecycle | Nodes | Create → Update → Delete → 404 確認 |
| 2 | User Exploration & Pagination | Users | 複数ページの非同期イテレーション |
| 3 | File Navigation | Files | Provider 一覧 → ファイル一覧 → バージョン取得 |
| 4 | Registration Creation Flow | DraftRegistrations, Registrations | Draft 作成 → 更新 → Registration 取得 |
| 5 | Preprint Submission Flow | Preprints | Preprint 作成 → Contributors 取得 → Citation 取得 |
| 6 | Collaborator Invitation & Permission Management | Contributors | 追加 (read) → 権限変更 (write → admin) → 削除 |

## 実行方法

```bash
npx jest tests/integration/
```
