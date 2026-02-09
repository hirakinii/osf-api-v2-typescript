# Examples

OSF API v2 TypeScript クライアントのサンプルコード集です。

## 前提条件

1. OSF の Personal Access Token を取得してください（[OSF Settings](https://osf.io/settings/tokens/)）
2. 環境変数にトークンを設定します:

```bash
export OSF_TOKEN='your-personal-access-token'
```

## 実行方法

```bash
npx ts-node examples/<ファイル名>.ts
```

## サンプル一覧

| ファイル | 説明 |
| --- | --- |
| [basic_usage.ts](basic_usage.ts) | クライアントの初期化、認証ユーザーの取得、公開ノードの一覧 |
| [nodes_management.ts](nodes_management.ts) | ノード（プロジェクト）の作成・更新・取得・削除（CRUD） |
| [file_operations.ts](file_operations.ts) | ストレージプロバイダの一覧、ファイル一覧、メタデータ取得、ダウンロード |
| [pagination_demo.ts](pagination_demo.ts) | `PaginatedResult` を使った自動ページネーション（ページ単位 / アイテム単位） |
| [registrations.ts](registrations.ts) | Registration の一覧・詳細取得、子 Registration / Contributors / Files の取得 |
| [contributors.ts](contributors.ts) | Contributor の一覧・詳細取得、追加・権限更新・削除、フィルタリング |
| [institutions.ts](institutions.ts) | Institution の一覧・詳細取得、所属ユーザー / ノード / Registration の取得 |
| [preprints.ts](preprints.ts) | Preprint の一覧・詳細取得、Contributors / Files / Citation の取得、ページネーション |
| [draft_registrations.ts](draft_registrations.ts) | Draft Registration の作成・更新・削除（CRUD）、Contributors の取得、ページネーション |
| [collections.ts](collections.ts) | Collection の作成・削除、ノードのリンク / アンリンク、関連リソースの取得 |
| [wikis.ts](wikis.ts) | Wiki ページのメタデータ・コンテンツ取得、バージョン一覧、新バージョン作成 |
| [comments.ts](comments.ts) | Comment の作成・更新・削除、返信、ページネーション |
| [logs.ts](logs.ts) | ノードのアクティビティログ一覧・詳細取得、アクションフィルタ、ページネーション |
| [subjects.ts](subjects.ts) | タクソノミー（Subject）の一覧・詳細取得、テキスト検索、子 Subject の探索 |
| [licenses.ts](licenses.ts) | ライセンスの一覧・詳細取得、名前フィルタ、ページネーション |

## サンプルごとの環境変数

一部のサンプルでは追加の環境変数が必要です:

| 環境変数 | 必要なサンプル | 説明 |
| --- | --- | --- |
| `OSF_TOKEN` | すべて | OSF Personal Access Token |
| `NODE_ID` | contributors.ts, comments.ts, logs.ts | 操作対象のノード ID（contributors.ts では省略時に公開ノードを自動選択） |
| `TARGET_USER_ID` | contributors.ts | 追加 / 更新 / 削除する対象ユーザー ID（省略時は読み取り操作のみ） |
| `WIKI_ID` | wikis.ts | 操作対象の Wiki ページ ID |
| `LOG_ID` | logs.ts | 特定ログの詳細取得用 ID（省略可） |
| `SUBJECT_ID` | subjects.ts | 特定 Subject の詳細・子 Subject 取得用 ID（省略可） |
| `LICENSE_ID` | licenses.ts | 特定ライセンスの詳細取得用 ID（省略可） |

## 注意事項

- `nodes_management.ts`、`contributors.ts`、`draft_registrations.ts`、`collections.ts`、`comments.ts` は実際にデータを作成・変更・削除します。テスト用のプロジェクトで実行することを推奨します。
- その他のサンプルは読み取り専用の操作のみです。
