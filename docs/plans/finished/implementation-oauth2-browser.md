# Implementation Plan: OAuth2 認証フロー追加 + ブラウザ対応強化

## Context

現在の `OsfClient` は Personal Access Token (PAT) のみをサポートしており、`token: string` を必須パラメータとして受け取る。OAuth2 Authorization Code + PKCE フローを追加することで、ブラウザベースのアプリケーションやサードパーティアプリからの安全な認証を実現する。また、現在 CJS のみのビルドを ESM + UMD デュアルビルドに拡張し、モダンバンドラーや CDN 経由での利用を可能にする。

開発は引き続き **TDD (Test-Driven Development)** サイクルを厳守し、テストカバレッジ >80% を維持しながら進める。

## OSF OAuth2 エンドポイント情報

| Endpoint | URL |
|----------|-----|
| Authorization | `https://accounts.osf.io/oauth2/authorize` |
| Token | `POST https://accounts.osf.io/oauth2/token` |
| Revoke | `POST https://accounts.osf.io/oauth2/revoke` |

- Grant types: `authorization_code`, `refresh_token`
- Access token 有効期限: 3600秒
- Refresh token: `access_type=offline` 指定時のみ発行、期限なし
- PKCE: `code_challenge_method=S256`

### Authorization Request パラメータ

| Parameter | 値 | 説明 |
|-----------|-----|------|
| `response_type` | `code` | 必須 |
| `client_id` | アプリ ID | 必須 |
| `redirect_uri` | コールバック URL | 必須 |
| `scope` | `osf.full_read`, `osf.full_write` 等 | 任意 |
| `state` | ランダム文字列 | CSRF 防止 |
| `access_type` | `online` / `offline` | `offline` で refresh token 発行 |
| `approval_prompt` | `auto` / `force` | ユーザー同意画面の制御 |
| `code_challenge` | Base64url(SHA-256(code_verifier)) | PKCE |
| `code_challenge_method` | `S256` | PKCE |

### Token Exchange パラメータ

| Parameter | 値 |
|-----------|-----|
| `grant_type` | `authorization_code` or `refresh_token` |
| `code` | 認可コード (authorization_code grant) |
| `client_id` | アプリ ID |
| `redirect_uri` | コールバック URL |
| `code_verifier` | PKCE code verifier |

### Token Response

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "scope": "..."
}
```

---

## 実装順序

依存関係を考慮し、以下の順序で実装する:

1. **Phase A** - `Buffer` 型除去 (ブラウザ対応の前提)
2. **Phase B** - `src/auth/` モジュール新規作成 (OAuth2 + PKCE)
3. **Phase C** - `HttpClient` / `OsfClient` への OAuth2 統合
4. **Phase D** - ESM + UMD デュアルビルド基盤

---

## Phase A: `Buffer` 型の除去

### 変更ファイル
- `src/network/HttpClient.ts` - `put()` の `Buffer` → `Uint8Array` に変更
- `tests/network/HttpClient.test.ts` - `Uint8Array` テスト追加

### 詳細
`put()` シグネチャを `ArrayBuffer | Blob | Buffer | string` → `ArrayBuffer | Blob | Uint8Array | string` に変更。Node.js の `Buffer` は `Uint8Array` を継承するため、既存コードは型チェックを通る（後方互換）。

### TDD ステップ
1. `Uint8Array` を `put()` に渡すテストを追加
2. シグネチャを変更し、テスト通過を確認

---

## Phase B: Auth モジュール新規作成

### 新規ファイル
| File | 内容 |
|------|------|
| `src/auth/types.ts` | `OAuth2Config`, `AuthorizationUrlParams`, `PkceChallenge`, `TokenResponse`, `TokenSet`, `TokenProvider` |
| `src/auth/pkce.ts` | `generateCodeVerifier()`, `computeCodeChallenge()`, `generatePkceChallenge()` |
| `src/auth/OsfOAuth2Client.ts` | OAuth2 フロー管理クラス |
| `src/auth/index.ts` | Barrel export |
| `tests/auth/pkce.test.ts` | PKCE ユニットテスト |
| `tests/auth/OsfOAuth2Client.test.ts` | OAuth2 クライアントテスト |

### B.1 Auth 型定義 (`src/auth/types.ts`)

```typescript
/** Configuration for OAuth2 Authorization Code flow */
export interface OAuth2Config {
  clientId: string;
  redirectUri: string;
  scope?: string;
  casBaseUrl?: string; // defaults to https://accounts.osf.io
}

/** Parameters for building the authorization URL */
export interface AuthorizationUrlParams {
  state?: string;
  accessType?: 'online' | 'offline';
  approvalPrompt?: 'auto' | 'force';
}

/** PKCE challenge pair */
export interface PkceChallenge {
  codeVerifier: string;
  codeChallenge: string;
}

/** OAuth2 token response from the token endpoint */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

/** Stored token set with expiration tracking */
export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // ms since epoch
  scope?: string;
}

/** Function that provides the current access token */
export type TokenProvider = () => string | Promise<string>;
```

### B.2 PKCE 実装 (`src/auth/pkce.ts`)

**実装方針**:
- `crypto.getRandomValues()` + `crypto.subtle.digest('SHA-256')` (Web Crypto API) を使用
- `btoa()` でBase64エンコード後、base64url に変換
- Node.js 固有 API (`Buffer`, `crypto` module) は一切不使用 → ブラウザ互換

**エクスポート関数**:
- `generateCodeVerifier(length = 128)` - `crypto.getRandomValues(new Uint8Array(length))` でランダムバイト生成、unreserved 文字にマッピング
- `computeCodeChallenge(codeVerifier)` - `crypto.subtle.digest('SHA-256', ...)` + base64url エンコード
- `generatePkceChallenge(verifierLength = 128)` - 上記2つを組み合わせ

**内部ヘルパー**:
- `base64UrlEncode(data: Uint8Array)` - `btoa()` → `+` を `-` に、`/` を `_` に、`=` パディング除去

**テストケース** (`tests/auth/pkce.test.ts`):
- `generateCodeVerifier()`: デフォルト長128文字、カスタム長指定、unreserved 文字のみ、43未満/128超でエラー、毎回異なる値
- `computeCodeChallenge()`: base64url 文字列（`+`, `/`, `=` なし）、RFC 7636 Appendix B テストベクタで検証
- `generatePkceChallenge()`: `codeVerifier` と `codeChallenge` の整合性

### B.3 OsfOAuth2Client 実装 (`src/auth/OsfOAuth2Client.ts`)

**クラス設計**:
```typescript
class OsfOAuth2Client {
  private config: OAuth2Config;
  private casBaseUrl: string;
  private currentTokenSet: TokenSet | null;
  private refreshPromise: Promise<TokenSet> | null; // 同時リフレッシュ防止

  constructor(config: OAuth2Config)
  async buildAuthorizationUrl(params?: AuthorizationUrlParams): Promise<{
    url: string;
    codeVerifier: string;
    codeChallenge: string;
  }>
  async exchangeCode(code: string, codeVerifier: string): Promise<TokenSet>
  async refreshAccessToken(refreshToken?: string): Promise<TokenSet>
  async revokeToken(token?: string): Promise<void>
  async getAccessToken(): Promise<string>
  setTokenSet(tokenSet: TokenSet): void
  getTokenSet(): TokenSet | null
  isTokenExpired(): boolean
}
```

**設計ポイント**:
- Token endpoint への通信は `fetch()` を直接使用（`HttpClient` ではなく）
  - 理由: `accounts.osf.io` は API base URL と異なり、`Content-Type: application/x-www-form-urlencoded` を使用
- `getAccessToken()` は有効期限を60秒のバッファ付きでチェックし、自動リフレッシュ
- 同時リクエスト時のリフレッシュ競合を防ぐため、refresh promise をキャッシュ:

```typescript
async getAccessToken(): Promise<string> {
  if (!this.currentTokenSet) throw new Error('No token set');
  if (this.isTokenExpired()) {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshAccessToken().finally(() => {
        this.refreshPromise = null;
      });
    }
    await this.refreshPromise;
  }
  return this.currentTokenSet.accessToken;
}
```

**テストケース** (`tests/auth/OsfOAuth2Client.test.ts`):
- **constructor**: `clientId`/`redirectUri` 未指定でエラー、デフォルト `casBaseUrl`、カスタム `casBaseUrl`
- **buildAuthorizationUrl**: URL構造、パラメータ（`response_type`, `client_id`, `redirect_uri`, `code_challenge`, `code_challenge_method`）、オプショナルパラメータ（`scope`, `state`, `access_type`, `approval_prompt`）
- **exchangeCode**: POST先、リクエストボディ（`grant_type`, `code`, `client_id`, `redirect_uri`, `code_verifier`）、`TokenSet` 返却、エラーケース
- **refreshAccessToken**: `grant_type=refresh_token`、旧 refresh token の保持、refresh token なしでエラー
- **revokeToken**: POST先、内部トークンクリア
- **getAccessToken**: 未期限切れ → 現在のトークン返却、期限切れ → 自動リフレッシュ、期限切れ + refresh token なし → エラー、トークン未設定 → エラー
- **setTokenSet / getTokenSet**: 保存・取得、コピー返却（参照ではない）、未設定時 `null`

### B.4 Barrel Export (`src/auth/index.ts`)

```typescript
export * from './types';
export * from './pkce';
export * from './OsfOAuth2Client';
```

---

## Phase C: HttpClient / OsfClient 統合

### 変更ファイル
- `src/network/HttpClient.ts` - `tokenProvider` サポート追加
- `src/client.ts` - `OsfClientConfig` 拡張、コンストラクタ改修
- `src/index.ts` - `auth` モジュールの barrel export 追加
- `tests/network/HttpClient.test.ts` - tokenProvider テスト追加
- `tests/client.test.ts` - OAuth2 設定テスト追加

### C.1 HttpClientConfig 変更

```typescript
export interface HttpClientConfig {
  /** Static token string (PAT or OAuth2 access token) */
  token?: string;
  /** Dynamic token provider function (for OAuth2 auto-refresh) */
  tokenProvider?: () => string | Promise<string>;
  /** Base URL for the API (defaults to https://api.osf.io/v2/) */
  baseUrl?: string;
  /** Request timeout in milliseconds (defaults to 30000) */
  timeout?: number;
}
```

### C.2 HttpClient 変更

- プロパティ: `private token?: string` + `private tokenProvider?: () => string | Promise<string>`
- コンストラクタ: `token` か `tokenProvider` のいずれか必須をバリデーション
- 新規 private メソッド `getToken()`: `tokenProvider` があれば呼び出し、なければ `token` を返却
- `request()` / `getRaw()`: `headers.set('Authorization', ...)` 前に `await this.getToken()` を呼ぶ

**テストケース** (追加分):
- `tokenProvider` を指定して動的トークン解決
- async `tokenProvider` のサポート
- リクエストごとに `tokenProvider` が呼ばれる
- `token` も `tokenProvider` も未指定でエラー

### C.3 OsfClientConfig 変更

```typescript
export interface OsfClientConfig {
  /** Personal access token for authentication (simplest mode) */
  token?: string;
  /** OAuth2 client for automatic token refresh */
  oauth2Client?: OsfOAuth2Client;
  /** Pre-obtained OAuth2 token set (used with oauth2Client) */
  tokenSet?: TokenSet;
  /** Custom async token provider function */
  tokenProvider?: () => string | Promise<string>;
  /** Base URL for the API (defaults to https://api.osf.io/v2/) */
  baseUrl?: string;
  /** Request timeout in milliseconds (defaults to 30000) */
  timeout?: number;
}
```

### C.4 OsfClient コンストラクタ変更

```typescript
constructor(config: OsfClientConfig) {
  let tokenProvider: (() => string | Promise<string>) | undefined;
  let token: string | undefined;

  if (config.token) {
    token = config.token;
  } else if (config.oauth2Client) {
    if (config.tokenSet) {
      config.oauth2Client.setTokenSet(config.tokenSet);
    }
    tokenProvider = () => config.oauth2Client!.getAccessToken();
  } else if (config.tokenProvider) {
    tokenProvider = config.tokenProvider;
  } else {
    throw new Error('One of token, oauth2Client, or tokenProvider must be provided');
  }

  this.httpClient = new HttpClient({
    token,
    tokenProvider,
    baseUrl: config.baseUrl,
    timeout: config.timeout,
  });
}
```

**テストケース** (追加分):
- `token` で PAT モード（従来互換）
- `oauth2Client` + `tokenSet` で OAuth2 モード
- `tokenProvider` でカスタムモード
- いずれも未指定でエラー
- OAuth2 モードで実際に API コール時のヘッダー検証

### C.5 Barrel Export 更新

`src/index.ts` に追加:
```typescript
// Auth (OAuth2 + PKCE)
export * from './auth';
```

---

## Phase D: ESM + UMD デュアルビルド

### D.1 tsconfig.json 変更

`outDir` を `./dist` → `./dist/cjs` に変更。

### D.2 ESM 用 tsconfig 新規作成 (`tsconfig.esm.json`)

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "ES2020",
    "moduleResolution": "bundler",
    "outDir": "./dist/esm",
    "declaration": true,
    "declarationDir": "./dist/esm"
  }
}
```

### D.3 UMD ビルドスクリプト新規作成 (`scripts/build-umd.mjs`)

esbuild を使用した IIFE バンドル:
- `dist/umd/osf-api-v2.js` (非圧縮)
- `dist/umd/osf-api-v2.min.js` (圧縮)
- グローバル名: `OsfApiV2`
- ターゲット: `es2020`
- ソースマップ付き

### D.4 package.json 変更

```json
{
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/cjs/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/esm/index.d.ts", "default": "./dist/esm/index.js" },
      "require": { "types": "./dist/cjs/index.d.ts", "default": "./dist/cjs/index.js" },
      "default": "./dist/cjs/index.js"
    }
  },
  "scripts": {
    "build": "npm run build:cjs && npm run build:esm && npm run build:umd",
    "build:cjs": "tsc",
    "build:esm": "tsc -p tsconfig.esm.json",
    "build:umd": "node scripts/build-umd.mjs"
  },
  "devDependencies": {
    "esbuild": "^0.25.0"
  }
}
```

### D.5 .gitignore 確認

`dist/` が既に含まれていることを確認（CJS/ESM/UMD 全出力をカバー）。

---

## 後方互換性

| 変更点 | 影響 |
|--------|------|
| `OsfClientConfig.token`: `string` → `string?` | `{ token: 'xxx' }` は引き続き動作 |
| `HttpClientConfig.token`: `string` → `string?` | 同上 |
| `put()` の `Buffer` → `Uint8Array` | `Buffer` は `Uint8Array` のサブクラスのため互換 |
| `dist/index.js` → `dist/cjs/index.js` | `exports` フィールドが優先されるため、Node.js 12.7+ で問題なし |

**破壊的変更なし。**

---

## テスト戦略

| テストファイル | 対象 | モック |
|---------------|------|--------|
| `tests/auth/pkce.test.ts` | PKCE ユーティリティ | なし (native crypto) |
| `tests/auth/OsfOAuth2Client.test.ts` | OAuth2 フロー全体 | `jest-fetch-mock` |
| `tests/network/HttpClient.test.ts` (追加) | tokenProvider, Uint8Array | `jest-fetch-mock` |
| `tests/client.test.ts` (追加) | OAuth2 設定モード | `jest-fetch-mock` |

### 検証手順
1. `npm test` - 全テスト通過 + カバレッジ 80% 以上
2. `npm run build` - CJS, ESM, UMD 3形式のビルド成功
3. `node -e "const { OsfClient, OsfOAuth2Client } = require('./dist/cjs'); console.log('CJS OK')"` - CJS 動作確認
4. `node --input-type=module -e "import { OsfClient, OsfOAuth2Client } from './dist/esm/index.js'; console.log('ESM OK')"` - ESM 動作確認
5. UMD ファイルの存在確認: `dist/umd/osf-api-v2.js`, `dist/umd/osf-api-v2.min.js`

---

## リスク評価

| リスク | 可能性 | 影響 | 軽減策 |
|--------|--------|------|--------|
| `crypto.subtle` テスト環境で未利用可能 | 低 (Node.js 25+) | 高 | Node.js 19+ 最低要件を明記 |
| ESM/CJS デュアルパッケージの互換性問題 | 低 | 低 | ライブラリはステートレス、シングルトンなし |
| esbuild UMD バンドルサイズ | 低 | 低 | 予想 50-100KB (非圧縮)、CDN 利用には十分 |
| トークンリフレッシュの競合 | 中 | 中 | refresh promise キャッシュで対応 |

---

## 参考資料

- [OSF CAS OAuth2 Server Documentation](https://github.com/CenterForOpenScience/cas-overlay/blob/develop/docs/osf-cas-as-an-oauth-server.md)
- [OSF API v2 Developer Documentation](https://developer.osf.io/)
- [RFC 7636 - PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
- [Node.js Web Crypto API](https://nodejs.org/api/webcrypto.html)
