# セキュリティリスク低減 実装計画 (Issue #50)

本ドキュメントは、セキュリティレビュー（2026-02-16実施）で検出されたリスクに対する改善実装計画を定義します。

## レビューサマリー

| 深刻度 | 件数 | 対応方針 |
|--------|------|----------|
| CRITICAL | 0 | - |
| HIGH | 0 | - |
| MEDIUM | 2 | 本計画で対応 |
| LOW | 3 | 本計画で対応（一部ドキュメント対応） |

---

## Task 1: OAuth2 エラーレスポンスのサニタイズ

**深刻度:** MEDIUM
**対象ファイル:** `src/auth/OsfOAuth2Client.ts`
**関連テスト:** `tests/auth/OsfOAuth2Client.test.ts`

### 問題

`exchangeCode()` と `refreshAccessToken()` および `revokeToken()` において、トークンエンドポイントからのエラーレスポンス本文をそのままエラーメッセージに含めている。サーバーのエラーレスポンスに内部情報やトークン断片が含まれていた場合、ログやスタックトレースを通じて露出するリスクがある。

```typescript
// 現在のコード (exchangeCode, L76-77)
const errorText = await response.text();
throw new Error(`Token exchange failed: ${response.status} ${errorText}`);

// 現在のコード (refreshAccessToken, L103-104)
const errorText = await response.text();
throw new Error(`Token refresh failed: ${response.status} ${errorText}`);

// 現在のコード (revokeToken, L125-126)
const errorText = await response.text();
throw new Error(`Token revocation failed: ${response.status} ${errorText}`);
```

### 修正方針

1. エラーレスポンスから安全なフィールドのみを抽出するヘルパーメソッドを追加
2. 生のレスポンス本文をエラーメッセージに含めず、構造化されたエラー情報（`error` / `error_description`）のみ使用
3. パース失敗時はステータスコードのみのフォールバックメッセージを返す

### 修正内容

```typescript
// OsfOAuth2Client に private ヘルパーメソッドを追加
private async extractErrorMessage(response: Response, context: string): Promise<string> {
  const base = `${context}: ${response.status} ${response.statusText}`;
  try {
    const body = await response.json();
    // OAuth2 標準のエラーフィールドのみ使用
    const detail = body.error_description || body.error;
    return detail ? `${base} - ${detail}` : base;
  } catch {
    return base;
  }
}

// exchangeCode 内 (L76-77 を置換)
const message = await this.extractErrorMessage(response, 'Token exchange failed');
throw new Error(message);

// refreshAccessToken 内 (L103-104 を置換)
const message = await this.extractErrorMessage(response, 'Token refresh failed');
throw new Error(message);

// revokeToken 内 (L125-126 を置換)
const message = await this.extractErrorMessage(response, 'Token revocation failed');
throw new Error(message);
```

### テスト修正

- [ ] 既存のエラーケーステストを更新し、サニタイズされたメッセージ形式を検証
- [ ] JSON レスポンスを返すエラーケースのテストを追加（`error_description` の抽出確認）
- [ ] JSON パースに失敗するエラーケースのテストを追加（ステータスコードのみのフォールバック確認）

---

## Task 2: PKCE code_verifier 生成のモジュロバイアス排除

**深刻度:** MEDIUM
**対象ファイル:** `src/auth/pkce.ts`
**関連テスト:** `tests/auth/pkce.test.ts`

### 問題

`generateCodeVerifier()` 内でモジュロ演算を使用して文字セット（66文字）からインデックスを選択しており、`256 % 66 = 58` のため先頭58文字に僅かな偏りが生じる。

```typescript
// 現在のコード (L32-35)
for (let i = 0; i < length; i++) {
  verifier += UNRESERVED_CHARACTERS[randomBytes[i] % UNRESERVED_CHARACTERS.length];
}
```

### 修正方針

リジェクションサンプリング方式を採用し、バイアスのない均一な文字選択を実現する。`UNRESERVED_CHARACTERS.length`（66）で均等に割り切れない範囲のランダムバイトを棄却する。

### 修正内容

```typescript
export function generateCodeVerifier(length = 128): string {
  if (length < 43 || length > 128) {
    throw new Error('Code verifier length must be between 43 and 128 characters');
  }

  const charsetLen = UNRESERVED_CHARACTERS.length; // 66
  // 256 以下で charsetLen の最大倍数（66 * 3 = 198）
  const maxValid = Math.floor(256 / charsetLen) * charsetLen; // 198

  let verifier = '';
  while (verifier.length < length) {
    const randomBytes = new Uint8Array(length - verifier.length);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < randomBytes.length && verifier.length < length; i++) {
      if (randomBytes[i] < maxValid) {
        verifier += UNRESERVED_CHARACTERS[randomBytes[i] % charsetLen];
      }
      // maxValid 以上のバイトは棄却（リジェクションサンプリング）
    }
  }
  return verifier;
}
```

### テスト修正

- [ ] 既存のテストが引き続き通過することを確認（長さ・文字セットの検証）
- [ ] 生成されるverifierが全てRFC 7636の unreserved characters のみであることを確認
- [ ] 境界値テスト（length=43, length=128）の通過を確認

---

## Task 3: HttpClient の URL バリデーション追加

**深刻度:** LOW
**対象ファイル:** `src/network/HttpClient.ts`
**関連テスト:** `tests/network/HttpClient.test.ts`

### 問題

`resolveUrl()` がフルURLの `endpoint` をそのまま受け入れるため、APIレスポンスに含まれる悪意のあるURLへ認証トークン付きリクエストが送信される理論的リスクがある（特にページネーションの `next` リンク経由）。

```typescript
// 現在のコード (L193-198)
private resolveUrl(endpoint: string): string {
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  return new URL(endpoint, this.baseUrl).toString();
}
```

### 修正方針

1. `HttpClientConfig` に許可ホストリスト（`allowedHosts`）をオプションで追加
2. `resolveUrl()` でフルURLの場合、許可ホストリストが設定されていればホスト検証を実施
3. デフォルト動作は `baseUrl` から自動的に許可ホストを抽出（既存コードとの後方互換性維持）
4. Waterbutler URL（`files.osf.io`）も考慮

### 修正内容

```typescript
// HttpClientConfig に追加
export interface HttpClientConfig {
  token?: string;
  tokenProvider?: () => string | Promise<string>;
  baseUrl?: string;
  timeout?: number;
  /** Optional list of additional allowed hostnames for full-URL requests */
  allowedHosts?: string[];
}

// HttpClient クラスに private フィールド追加
private allowedHosts: Set<string>;

// constructor 内で初期化
const baseHost = new URL(this.baseUrl).hostname;
this.allowedHosts = new Set([
  baseHost,
  ...(config.allowedHosts ?? []),
]);

// resolveUrl を修正
private resolveUrl(endpoint: string): string {
  if (endpoint.startsWith('http')) {
    const url = new URL(endpoint);
    if (!this.allowedHosts.has(url.hostname)) {
      throw new OsfApiError(
        `Request to disallowed host: ${url.hostname}. Allowed: ${[...this.allowedHosts].join(', ')}`
      );
    }
    return endpoint;
  }
  return new URL(endpoint, this.baseUrl).toString();
}
```

### テスト修正

- [ ] 許可ホストへのリクエストが正常に通過することを確認
- [ ] 未許可ホストへのリクエストが `OsfApiError` をスローすることを確認
- [ ] `allowedHosts` を指定して追加ホストを許可できることを確認
- [ ] 相対パスのエンドポイントが従来通り動作することを確認

---

## Task 4: OsfRateLimitError に Retry-After 情報を付与

**深刻度:** LOW
**対象ファイル:** `src/network/Errors.ts`, `src/network/HttpClient.ts`
**関連テスト:** `tests/network/HttpClient.test.ts`

### 問題

429 レスポンス受信時に `Retry-After` ヘッダー情報が保持されず、利用者がリトライタイミングを判断できない。

### 修正方針

1. `OsfRateLimitError` に `retryAfter` プロパティを追加
2. `handleError()` で `Retry-After` ヘッダーを読み取り、エラーオブジェクトに格納

### 修正内容

```typescript
// Errors.ts - OsfRateLimitError を拡張
export class OsfRateLimitError extends OsfApiError {
  /** Seconds to wait before retrying, from Retry-After header */
  readonly retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message);
    this.name = 'OsfRateLimitError';
    this.retryAfter = retryAfter;
  }
}

// HttpClient.ts - handleError 内 case 429 を修正
case 429: {
  const retryAfterHeader = response.headers.get('Retry-After');
  const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;
  throw new OsfRateLimitError(
    errorMessage,
    Number.isNaN(retryAfter) ? undefined : retryAfter,
  );
}
```

### テスト修正

- [ ] `Retry-After` ヘッダー付き 429 レスポンスで `retryAfter` が正しく設定されることを確認
- [ ] `Retry-After` ヘッダーなし 429 レスポンスで `retryAfter` が `undefined` であることを確認
- [ ] 不正な `Retry-After` 値（非数値）の場合に `undefined` になることを確認

---

## Task 5: セキュリティベストプラクティスのドキュメント整備

**深刻度:** LOW
**対象ファイル:** 新規 `docs/security-best-practices.md`

### 問題

トークンの安全な管理やライブラリ利用時のセキュリティ上の注意事項がドキュメント化されていない。

### ドキュメント内容

- [ ] トークンの安全な保管方法（環境変数、シークレットマネージャーの使用推奨）
- [ ] トークンをログに出力しないための注意事項
- [ ] OAuth2 フロー使用時の PKCE の重要性の説明
- [ ] `allowedHosts` オプションの使用推奨（Task 3 完了後）
- [ ] 429 エラー時の `retryAfter` を利用したリトライ戦略の例（Task 4 完了後）

---

## 実装順序と依存関係

```
Task 1 (OAuth2 エラーサニタイズ)     ── 独立、最優先
Task 2 (PKCE モジュロバイアス)       ── 独立、最優先
Task 3 (URL バリデーション)          ── 独立
Task 4 (RateLimitError 拡張)         ── 独立
Task 5 (ドキュメント)                ── Task 3, 4 完了後
```

Task 1〜4 は相互に依存関係がないため並行して実施可能。Task 5 は Task 3・4 の内容を反映するため最後に実施する。

## 完了基準

- [ ] 全タスクの修正コードがマージされている
- [ ] テストカバレッジ 80% 以上を維持している
- [ ] 既存テストが全て通過している
- [ ] 新規テストが追加・通過している
- [ ] セキュリティドキュメントが整備されている
