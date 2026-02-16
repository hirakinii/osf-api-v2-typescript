import { PkceChallenge } from './types';

// RFC 3986 unreserved characters: ALPHA / DIGIT / "-" / "." / "_" / "~"
const UNRESERVED_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

/**
 * Encode a Uint8Array to a base64url string (no padding).
 * Uses btoa() for browser compatibility instead of Node.js Buffer.
 */
function base64UrlEncode(data: Uint8Array): string {
  // Convert Uint8Array to binary string for btoa()
  let binaryString = '';
  for (let i = 0; i < data.length; i++) {
    binaryString += String.fromCharCode(data[i]);
  }
  return btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generate a cryptographically random code verifier string.
 * @param length - Length of the verifier (43-128 characters per RFC 7636)
 * @returns A random string composed of unreserved characters
 */
export function generateCodeVerifier(length = 128): string {
  if (length < 43 || length > 128) {
    throw new Error('Code verifier length must be between 43 and 128 characters');
  }

  const charsetLen = UNRESERVED_CHARACTERS.length; // 66
  // Largest multiple of charsetLen that fits in a byte (66 * 3 = 198)
  const maxValid = Math.floor(256 / charsetLen) * charsetLen; // 198

  let verifier = '';
  while (verifier.length < length) {
    const randomBytes = new Uint8Array(length - verifier.length);
    crypto.getRandomValues(randomBytes);
    for (let i = 0; i < randomBytes.length && verifier.length < length; i++) {
      if (randomBytes[i] < maxValid) {
        verifier += UNRESERVED_CHARACTERS[randomBytes[i] % charsetLen];
      }
      // Bytes >= maxValid are rejected (rejection sampling)
    }
  }
  return verifier;
}

/**
 * Compute the S256 code challenge from a code verifier.
 * Uses Web Crypto API (crypto.subtle.digest) for browser compatibility.
 * @param codeVerifier - The code verifier string
 * @returns base64url-encoded SHA-256 hash
 */
export async function computeCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Generate a complete PKCE challenge pair (verifier + challenge).
 * @param verifierLength - Length of the code verifier (43-128)
 * @returns A PkceChallenge with codeVerifier and codeChallenge
 */
export async function generatePkceChallenge(verifierLength = 128): Promise<PkceChallenge> {
  const codeVerifier = generateCodeVerifier(verifierLength);
  const codeChallenge = await computeCodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}
