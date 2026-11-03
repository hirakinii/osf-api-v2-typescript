import {
  findMissingPackages,
  formatMissingPackagesMessage,
  NPX_LAUNCH_COMMAND,
  GLOBAL_INSTALL_COMMAND,
  REQUIRED_PACKAGES,
} from '../../src/mcp/peerCheck';

const notFound = (specifier: string): never => {
  const error = new Error(`Cannot find module '${specifier}' from '/some/absolute/path'`) as Error & {
    code?: string;
  };
  error.code = 'MODULE_NOT_FOUND';
  throw error;
};

describe('findMissingPackages', () => {
  it('returns an empty array when every probe resolves', () => {
    expect(findMissingPackages(() => '/resolved')).toEqual([]);
  });

  it('returns only the packages whose probe fails', () => {
    const resolver = (specifier: string): string => (specifier === 'ts-morph' ? notFound(specifier) : '/resolved');
    expect(findMissingPackages(resolver)).toEqual(['ts-morph']);
  });

  it('returns every package when nothing resolves', () => {
    expect(findMissingPackages(notFound)).toEqual(['@modelcontextprotocol/sdk', 'ts-morph']);
  });

  it('passes probe specifiers to the resolver and returns display names', () => {
    const resolver = jest.fn(() => '/resolved');
    const packages = [{ name: 'display-name', probe: 'display-name/sub/path.js' }];

    expect(findMissingPackages(resolver, packages)).toEqual([]);
    expect(resolver).toHaveBeenCalledWith('display-name/sub/path.js');

    resolver.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(findMissingPackages(resolver, packages)).toEqual(['display-name']);
  });

  it('probes the SDK through the subpath that the server imports', () => {
    const sdk = REQUIRED_PACKAGES.find((pkg) => pkg.name === '@modelcontextprotocol/sdk');
    expect(sdk?.probe).toBe('@modelcontextprotocol/sdk/server/stdio.js');
  });

  it('finds every package with the default resolver in the dev environment', () => {
    expect(findMissingPackages()).toEqual([]);
  });
});

describe('formatMissingPackagesMessage', () => {
  const message = formatMissingPackagesMessage(['@modelcontextprotocol/sdk', 'ts-morph']);

  it('lists every missing package', () => {
    expect(message).toContain('@modelcontextprotocol/sdk');
    expect(message).toContain('ts-morph');
  });

  it('includes the exact npx launch command', () => {
    expect(NPX_LAUNCH_COMMAND).toBe('npx -y -p osf-api-v2-typescript -p @modelcontextprotocol/sdk -p ts-morph osf-mcp');
    expect(message).toContain(NPX_LAUNCH_COMMAND);
  });

  it('includes the global install alternative', () => {
    expect(GLOBAL_INSTALL_COMMAND).toBe('npm install -g osf-api-v2-typescript @modelcontextprotocol/sdk ts-morph');
    expect(message).toContain(GLOBAL_INSTALL_COMMAND);
  });

  it('does not leak absolute paths or stack traces', () => {
    expect(message).not.toMatch(/\/(home|usr|tmp|Users)\//);
    expect(message).not.toMatch(/\bat .+:\d+:\d+/);
  });

  it('only lists the packages that are passed in', () => {
    const partial = formatMissingPackagesMessage(['ts-morph']);
    expect(partial).toContain('  - ts-morph');
    expect(partial).not.toContain('  - @modelcontextprotocol/sdk');
  });
});
