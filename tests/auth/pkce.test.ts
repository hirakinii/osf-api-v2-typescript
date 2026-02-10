import { generateCodeVerifier, computeCodeChallenge, generatePkceChallenge } from '../../src/auth/pkce';

const UNRESERVED_CHARS_REGEX = /^[A-Za-z0-9\-._~]+$/;
const BASE64URL_REGEX = /^[A-Za-z0-9\-_]+$/;

describe('generateCodeVerifier', () => {
  it('should generate a verifier with default length of 128', () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toHaveLength(128);
  });

  it('should generate a verifier with custom length', () => {
    const verifier = generateCodeVerifier(43);
    expect(verifier).toHaveLength(43);
  });

  it('should only contain unreserved characters', () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toMatch(UNRESERVED_CHARS_REGEX);
  });

  it('should throw for length less than 43', () => {
    expect(() => generateCodeVerifier(42)).toThrow(
      'Code verifier length must be between 43 and 128 characters',
    );
  });

  it('should throw for length greater than 128', () => {
    expect(() => generateCodeVerifier(129)).toThrow(
      'Code verifier length must be between 43 and 128 characters',
    );
  });

  it('should generate different values on each call', () => {
    const a = generateCodeVerifier();
    const b = generateCodeVerifier();
    expect(a).not.toBe(b);
  });
});

describe('computeCodeChallenge', () => {
  it('should return a base64url string without +, /, or =', async () => {
    const challenge = await computeCodeChallenge('test-verifier');
    expect(challenge).toMatch(BASE64URL_REGEX);
  });

  it('should match RFC 7636 Appendix B test vector', async () => {
    // RFC 7636 Appendix B:
    //   code_verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    //   code_challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const expected = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
    const challenge = await computeCodeChallenge(verifier);
    expect(challenge).toBe(expected);
  });
});

describe('generatePkceChallenge', () => {
  it('should return a matching codeVerifier and codeChallenge', async () => {
    const { codeVerifier, codeChallenge } = await generatePkceChallenge();

    expect(codeVerifier).toHaveLength(128);
    expect(codeChallenge).toMatch(BASE64URL_REGEX);

    // Verify consistency: challenge should match independently computed value
    const recomputed = await computeCodeChallenge(codeVerifier);
    expect(codeChallenge).toBe(recomputed);
  });

  it('should accept a custom verifier length', async () => {
    const { codeVerifier } = await generatePkceChallenge(64);
    expect(codeVerifier).toHaveLength(64);
  });
});
