import fetchMock from 'jest-fetch-mock';
import { OsfClient } from '../src/client';
import { OsfOAuth2Client } from '../src/auth/OsfOAuth2Client';
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
import { Subjects } from '../src/resources/Subjects';
import { Licenses } from '../src/resources/Licenses';
import { ViewOnlyLinks } from '../src/resources/ViewOnlyLinks';
import { Identifiers } from '../src/resources/Identifiers';
import { Citations } from '../src/resources/Citations';
import { PreprintProviders } from '../src/resources/PreprintProviders';
import { RegistrationProviders } from '../src/resources/RegistrationProviders';
import { CollectionProviders } from '../src/resources/CollectionProviders';
import { Scopes } from '../src/resources/Scopes';
import { Applications } from '../src/resources/Applications';
import { Tokens } from '../src/resources/Tokens';

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

    it('should accept oauth2Client configuration', () => {
      const oauth2Client = new OsfOAuth2Client({
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000/callback',
      });
      const client = new OsfClient({ oauth2Client });
      expect(client).toBeInstanceOf(OsfClient);
    });

    it('should accept oauth2Client with tokenSet', () => {
      const oauth2Client = new OsfOAuth2Client({
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000/callback',
      });
      const tokenSet = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
      };
      const client = new OsfClient({ oauth2Client, tokenSet });
      expect(client).toBeInstanceOf(OsfClient);
    });

    it('should accept tokenProvider configuration', () => {
      const tokenProvider = () => 'custom-token';
      const client = new OsfClient({ tokenProvider });
      expect(client).toBeInstanceOf(OsfClient);
    });

    it('should throw error when no auth option is provided', () => {
      expect(() => new OsfClient({})).toThrow(
        'One of token, oauth2Client, or tokenProvider must be provided'
      );
    });

    it('should use oauth2Client getAccessToken for API calls', async () => {
      const oauth2Client = new OsfOAuth2Client({
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000/callback',
      });
      oauth2Client.setTokenSet({
        accessToken: 'oauth2-access-token',
        refreshToken: 'oauth2-refresh-token',
        expiresAt: Date.now() + 3600000,
      });

      const client = new OsfClient({ oauth2Client });

      fetchMock.mockResponseOnce(
        JSON.stringify({
          data: {
            id: 'me-123',
            type: 'users',
            attributes: {
              full_name: 'OAuth2 User',
              given_name: 'OAuth2',
              middle_names: '',
              family_name: 'User',
              suffix: '',
              active: true,
              date_registered: '2024-01-01T00:00:00.000000',
            },
          },
        }),
      );

      await client.users.me();

      const [, options] = fetchMock.mock.calls[0];
      const headers = new Headers(options?.headers as HeadersInit);
      expect(headers.get('Authorization')).toBe('Bearer oauth2-access-token');
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

    it('should provide subjects accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.subjects).toBeInstanceOf(Subjects);
      expect(client.subjects).toBe(client.subjects);
    });

    it('should provide licenses accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.licenses).toBeInstanceOf(Licenses);
      expect(client.licenses).toBe(client.licenses);
    });

    it('should provide viewOnlyLinks accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.viewOnlyLinks).toBeInstanceOf(ViewOnlyLinks);
      expect(client.viewOnlyLinks).toBe(client.viewOnlyLinks);
    });

    it('should provide identifiers accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.identifiers).toBeInstanceOf(Identifiers);
      expect(client.identifiers).toBe(client.identifiers);
    });

    it('should provide citations accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.citations).toBeInstanceOf(Citations);
      expect(client.citations).toBe(client.citations);
    });

    it('should provide preprintProviders accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.preprintProviders).toBeInstanceOf(PreprintProviders);
      expect(client.preprintProviders).toBe(client.preprintProviders);
    });

    it('should provide registrationProviders accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.registrationProviders).toBeInstanceOf(RegistrationProviders);
      expect(client.registrationProviders).toBe(client.registrationProviders);
    });

    it('should provide collectionProviders accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.collectionProviders).toBeInstanceOf(CollectionProviders);
      expect(client.collectionProviders).toBe(client.collectionProviders);
    });

    it('should provide scopes accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.scopes).toBeInstanceOf(Scopes);
      expect(client.scopes).toBe(client.scopes);
    });

    it('should provide applications accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.applications).toBeInstanceOf(Applications);
      expect(client.applications).toBe(client.applications);
    });

    it('should provide tokens accessor', () => {
      const client = new OsfClient({ token: 'test-token' });
      expect(client.tokens).toBeInstanceOf(Tokens);
      expect(client.tokens).toBe(client.tokens);
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
