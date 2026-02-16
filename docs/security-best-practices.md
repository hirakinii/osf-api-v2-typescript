# Security Best Practices

This document describes security considerations and best practices when using the OSF API v2 TypeScript client.

## Token Management

### Secure Storage

Never hard-code tokens in source code. Use one of the following approaches:

- **Environment variables** - Store tokens in environment variables and read them at runtime.

  ```typescript
  import { OsfClient } from 'osf-api-v2-typescript';

  const client = new OsfClient({
    token: process.env.OSF_TOKEN,
  });
  ```

- **Secret managers** - For production deployments, use a secret manager such as AWS Secrets Manager, Google Cloud Secret Manager, HashiCorp Vault, or Azure Key Vault. Retrieve secrets at application startup and pass them to the client.

- **Dynamic token provider** - Use `tokenProvider` for OAuth2 flows where tokens may be refreshed automatically.

  ```typescript
  const client = new OsfClient({
    tokenProvider: async () => {
      // Retrieve or refresh the token from your secure store
      return await getTokenFromSecureStore();
    },
  });
  ```

### Avoid Logging Tokens

Tokens should never appear in application logs, error messages, or stack traces.

- Do not log the `HttpClientConfig` object directly, as it may contain the `token` field.
- Do not log request headers, as they contain the `Authorization` header.
- When debugging API errors, rely on the structured error properties (`message`, `statusCode`) rather than raw request/response data.

## OAuth2 and PKCE

When using the OAuth2 authorization code flow, always use PKCE (Proof Key for Code Exchange). The built-in `OsfOAuth2Client` generates PKCE parameters automatically via `generateAuthorizationUrl()`.

```typescript
import { OsfOAuth2Client } from 'osf-api-v2-typescript';

const oauth = new OsfOAuth2Client({
  clientId: process.env.OSF_CLIENT_ID!,
  redirectUri: 'https://your-app.example.com/callback',
});

// PKCE code_verifier and code_challenge are generated automatically
const { url, codeVerifier } = oauth.generateAuthorizationUrl();

// Store codeVerifier securely in the user's session (server-side)
// Never expose it to the client browser
```

PKCE prevents authorization code interception attacks. The `code_verifier` must be kept secret and stored only in server-side sessions or secure storage.

## Host Allowlisting

The client validates that full-URL requests (e.g., pagination links from API responses) are sent only to trusted hosts. By default, the base URL host (`api.osf.io`) is allowed.

If your application needs to follow links to additional hosts (e.g., `files.osf.io` for Waterbutler file operations), add them via the `allowedHosts` configuration:

```typescript
const client = new OsfClient({
  token: process.env.OSF_TOKEN,
  allowedHosts: ['files.osf.io'],
});
```

Requests to hosts not in the allowlist will throw an `OsfApiError`. This prevents accidentally sending authentication tokens to untrusted third-party servers via manipulated API responses.

## Rate Limit Handling

When the API returns a 429 (Too Many Requests) response, the client throws an `OsfRateLimitError` with a `retryAfter` property indicating how many seconds to wait before retrying.

```typescript
import { OsfRateLimitError } from 'osf-api-v2-typescript';

async function fetchWithRetry(fn: () => Promise<unknown>, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof OsfRateLimitError && attempt < maxRetries - 1) {
        const waitSeconds = error.retryAfter ?? 10;
        await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
        continue;
      }
      throw error;
    }
  }
}
```

Key points:

- Always respect the `retryAfter` value when present.
- Use a fallback wait time (e.g., 10 seconds) when `retryAfter` is not provided.
- Limit the number of retry attempts to avoid infinite loops.
- Consider implementing exponential backoff for repeated rate limit errors.
