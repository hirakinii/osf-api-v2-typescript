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
| [basic_usage.ts](basic_usage.ts) | クライアントの初期化、認証ユーザーの取得、公開ノードの一覧、認証ユーザーがコントリビューターとなっているノードの一覧 |
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
| [view_only_links.ts](view_only_links.ts) | View Only Link の詳細取得、アクセス可能なノード一覧 |
| [identifiers.ts](identifiers.ts) | 識別子（DOI / ARK）の一覧・詳細取得、ノード / Registration 別の取得、ページネーション |
| [citations.ts](citations.ts) | 引用スタイルの一覧・詳細取得、タイトルフィルタ、ページネーション |
| [providers.ts](providers.ts) | Preprint / Registration / Collection プロバイダーの一覧・詳細取得、名前フィルタ |
| [auth.ts](auth.ts) | OAuth アプリの CRUD、PAT の作成・削除、OAuth スコープの一覧・詳細取得 |
| [oauth2.ts](oauth2.ts) | OAuth2 Authorization Code + PKCE フロー、トークン交換・リフレッシュ・失効 |

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
| `VOL_ID` | view_only_links.ts | View Only Link の ID（必須） |
| `IDENTIFIER_ID` | identifiers.ts | 特定識別子の詳細取得用 ID（省略可） |
| `REGISTRATION_ID` | identifiers.ts | Registration の識別子一覧取得用 ID（省略可） |
| `CITATION_STYLE_ID` | citations.ts | 引用スタイル ID（省略時は `apa`） |
| `PREPRINT_PROVIDER_ID` | providers.ts | プレプリントプロバイダー ID（省略時は `osf`） |
| `REGISTRATION_PROVIDER_ID` | providers.ts | Registration プロバイダー ID（省略時は `osf`） |
| `COLLECTION_PROVIDER_ID` | providers.ts | コレクションプロバイダー ID（省略可） |
| `SCOPE_ID` | auth.ts | OAuth スコープ ID（省略時は `osf.full_read`） |
| `APP_CLIENT_ID` | auth.ts | OAuth アプリの client_id（省略可） |
| `DEMO_APP_CRUD` | auth.ts | `true` に設定すると OAuth アプリの作成・更新・削除デモを実行 |
| `TOKEN_ID` | auth.ts | PAT の ID（省略可） |
| `DEMO_TOKEN_CRUD` | auth.ts | `true` に設定すると PAT の作成・削除デモを実行 |
| `OAUTH_CLIENT_ID` | oauth2.ts | OAuth アプリの client_id（必須） |
| `OAUTH_REDIRECT_URI` | oauth2.ts | OAuth アプリのリダイレクト URI（必須） |
| `OAUTH_AUTH_CODE` | oauth2.ts | 認可後に取得した authorization code（省略可） |
| `OAUTH_CODE_VERIFIER` | oauth2.ts | Step 2 で生成された code verifier（省略可） |
| `DEMO_REVOKE` | oauth2.ts | `true` に設定するとトークン失効デモを実行 |

## 注意事項

- `nodes_management.ts`、`contributors.ts`、`draft_registrations.ts`、`collections.ts`、`comments.ts`、`auth.ts`（CRUD デモ有効時）、`oauth2.ts`（トークン失効デモ有効時）は実際にデータを作成・変更・削除します。テスト用のプロジェクトで実行することを推奨します。
- その他のサンプルは読み取り専用の操作のみです。
