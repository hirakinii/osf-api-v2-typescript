import fetchMock from 'jest-fetch-mock';
import { OsfClient } from '../src/client';
import { Nodes } from '../src/resources/Nodes';
import { Files } from '../src/resources/Files';
import { Users } from '../src/resources/Users';
import { Registrations } from '../src/resources/Registrations';
import { Contributors } from '../src/resources/Contributors';
import { Institutions } from '../src/resources/Institutions';
import { Preprints } from '../src/resources/Preprints';
import { DraftRegistrations } from '../src/resources/DraftRegistrations';
import { Collections } from '../src/resources/Collections';
import { Wikis } from '../src/resources/Wikis';
import { Logs } from '../src/resources/Logs';

fetchMock.enableMocks();

describe('OsfClient', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe('constructor', () => {
    it('should accept token configuration', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client).toBeInstanceOf(OsfClient);
    });

    it('should accept optional baseUrl', () => {
      const client = new OsfClient({
        token: 'test-token',
        baseUrl: 'https://api.staging.osf.io/v2/',
      });
      expect(client).toBeInstanceOf(OsfClient);
    });

    it('should accept optional timeout', () => {
      const client = new OsfClient({
        token: 'test-token',
        timeout: 60000,
      });
      expect(client).toBeInstanceOf(OsfClient);
    });

    it('should accept all configuration options', () => {
      const client = new OsfClient({
        token: 'test-token',
        baseUrl: 'https://api.staging.osf.io/v2/',
        timeout: 60000,
      });
      expect(client).toBeInstanceOf(OsfClient);
    });
  });

  describe('resource accessors', () => {
    it('should provide nodes accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.nodes).toBeInstanceOf(Nodes);
    });

    it('should provide files accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.files).toBeInstanceOf(Files);
    });

    it('should provide users accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.users).toBeInstanceOf(Users);
    });

    it('should return same instance on repeated access (lazy singleton)', () => {
      const client = new OsfClient({ token: 'test-token' });
      const nodes1 = client.nodes;
      const nodes2 = client.nodes;
      expect(nodes1).toBe(nodes2);
    });

    it('should return same files instance on repeated access', () => {
      const client = new OsfClient({ token: 'test-token' });
      const files1 = client.files;
      const files2 = client.files;
      expect(files1).toBe(files2);
    });

    it('should return same users instance on repeated access', () => {
      const client = new OsfClient({ token: 'test-token' });
      const users1 = client.users;
      const users2 = client.users;
      expect(users1).toBe(users2);
    });

    it('should provide registrations accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.registrations).toBeInstanceOf(Registrations);
      expect(client.registrations).toBe(client.registrations);
    });

    it('should provide contributors accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.contributors).toBeInstanceOf(Contributors);
      expect(client.contributors).toBe(client.contributors);
    });

    it('should provide institutions accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.institutions).toBeInstanceOf(Institutions);
      expect(client.institutions).toBe(client.institutions);
    });

    it('should provide preprints accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.preprints).toBeInstanceOf(Preprints);
      expect(client.preprints).toBe(client.preprints);
    });

    it('should provide draftRegistrations accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.draftRegistrations).toBeInstanceOf(DraftRegistrations);
      expect(client.draftRegistrations).toBe(client.draftRegistrations);
    });

    it('should provide collections accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.collections).toBeInstanceOf(Collections);
      expect(client.collections).toBe(client.collections);
    });

    it('should provide wikis accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.wikis).toBeInstanceOf(Wikis);
      expect(client.wikis).toBe(client.wikis);
    });

    it('should provide logs accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.logs).toBeInstanceOf(Logs);
      expect(client.logs).toBe(client.logs);
    });
  });

  describe('integration', () => {
    it('should make authenticated API calls through users resource', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          data: {
            id: 'me-123',
            type: 'users',
            attributes: {
              full_name: 'Test User',
              given_name: 'Test',
              middle_names: '',
              family_name: 'User',
              suffix: '',
              active: true,
              date_registered: '2024-01-01T00:00:00.000000',
            },
          },
        }),
      );

      const client = new OsfClient({ token: 'test-token' });
      const me = await client.users.me();

      expect(me.full_name).toBe('Test User');
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const [, options] = fetchMock.mock.calls[0];
      expect(options?.headers).toBeDefined();
      // Headers can be a Headers object or a plain object
      const headers = new Headers(options?.headers as HeadersInit);
      expect(headers.get('Authorization')).toBe('Bearer test-token');
    });

    it('should use custom baseUrl when provided', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          data: {
            id: 'node-1',
            type: 'nodes',
            attributes: {
              title: 'Test Node',
              category: 'project',
              description: '',
              public: true,
              date_created: '2024-01-01T00:00:00.000000',
              date_modified: '2024-01-01T00:00:00.000000',
            },
          },
        }),
      );

      const client = new OsfClient({
        token: 'test-token',
        baseUrl: 'https://api.staging.osf.io/v2/',
      });

      await client.nodes.getById('node-1');

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('api.staging.osf.io');
    });

    it('should use default baseUrl when not provided', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({
          data: {
            id: 'node-1',
            type: 'nodes',
            attributes: {
              title: 'Test Node',
              category: 'project',
              description: '',
              public: true,
              date_created: '2024-01-01T00:00:00.000000',
              date_modified: '2024-01-01T00:00:00.000000',
            },
          },
        }),
      );

      const client = new OsfClient({ token: 'test-token' });

      await client.nodes.getById('node-1');

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('api.osf.io');
    });
  });
});
