import { DraftRegistrations } from '../../src/resources/DraftRegistrations';
import { HttpClient } from '../../src/network/HttpClient';
import { OsfNotFoundError, OsfPermissionError } from '../../src/network/Errors';
import { JsonApiResponse, JsonApiListResponse } from '../../src/types';
import {
  OsfDraftRegistrationAttributes,
  CreateDraftRegistrationInput,
  UpdateDraftRegistrationInput,
} from '../../src/types/draft-registration';
import fetchMock from 'jest-fetch-mock';

/** Helper to build a minimal draft registration attributes object */
function buildDraftRegistrationAttributes(
  overrides: Partial<OsfDraftRegistrationAttributes> = {},
): OsfDraftRegistrationAttributes {
  return {
    title: 'Test Draft Registration',
    description: 'A test draft registration',
    category: 'project',
    tags: [],
    has_project: false,
    datetime_initiated: '2024-01-01T00:00:00.000000',
    datetime_updated: '2024-01-02T00:00:00.000000',
    ...overrides,
  };
}

describe('DraftRegistrations', () => {
  const token = 'test-token';
  const baseUrl = 'https://api.test-osf.io/v2/';
  let httpClient: HttpClient;
  let draftRegistrations: DraftRegistrations;

  beforeEach(() => {
    fetchMock.resetMocks();
    httpClient = new HttpClient({ token, baseUrl });
    draftRegistrations = new DraftRegistrations(httpClient);
  });

  describe('getById(id)', () => {
    it('should fetch draft registration by ID', async () => {
      const mockResponse: JsonApiResponse<OsfDraftRegistrationAttributes> = {
        data: {
          id: 'draft123',
          type: 'draft_registrations',
          attributes: buildDraftRegistrationAttributes({
            title: 'My Draft Registration',
            description: 'A study on testing',
            tags: ['open-science', 'registration'],
          }),
          links: {
            html: 'https://osf.io/registries/drafts/draft123/',
          },
        },
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await draftRegistrations.getById('draft123');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.test-osf.io/v2/draft_registrations/draft123/');

      expect(result.id).toBe('draft123');
      expect(result.type).toBe('draft_registrations');
      expect(result.title).toBe('My Draft Registration');
      expect(result.has_project).toBe(false);
      expect(result.tags).toEqual(['open-science', 'registration']);
    });

    it('should transform response with flattened attributes', async () => {
      const mockResponse: JsonApiResponse<OsfDraftRegistrationAttributes> = {
        data: {
          id: 'draft-456',
          type: 'draft_registrations',
          attributes: buildDraftRegistrationAttributes({
            title: 'Flattened Draft',
            current_user_permissions: ['read', 'write', 'admin'],
            has_project: true,
            registration_responses: { summary: 'Test summary' },
          }),
          relationships: {
            branched_from: {
              links: { related: { href: 'https://api.osf.io/v2/nodes/abc12/' } },
            },
            initiator: {
              links: { related: { href: 'https://api.osf.io/v2/users/user1/' } },
            },
          },
          links: {
            html: 'https://osf.io/registries/drafts/draft-456/',
          },
        },
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await draftRegistrations.getById('draft-456');

      expect(result.title).toBe('Flattened Draft');
      expect(result.current_user_permissions).toEqual(['read', 'write', 'admin']);
      expect(result.has_project).toBe(true);
      expect(result.registration_responses).toEqual({ summary: 'Test summary' });
      expect(result.relationships?.branched_from).toBeDefined();
      expect(result.relationships?.initiator).toBeDefined();
    });

    it('should throw OsfNotFoundError for non-existent draft registration', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

      await expect(draftRegistrations.getById('non-existent')).rejects.toThrow(OsfNotFoundError);
    });

    it('should throw OsfPermissionError for draft registration without access', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
        status: 403,
      });

      await expect(draftRegistrations.getById('private-draft')).rejects.toThrow(OsfPermissionError);
    });
  });

  describe('listDraftRegistrations(params)', () => {
    it('should fetch paginated list of draft registrations', async () => {
      const mockResponse: JsonApiListResponse<OsfDraftRegistrationAttributes> = {
        data: [
          {
            id: 'draft-1',
            type: 'draft_registrations',
            attributes: buildDraftRegistrationAttributes({ title: 'Draft One' }),
          },
          {
            id: 'draft-2',
            type: 'draft_registrations',
            attributes: buildDraftRegistrationAttributes({ title: 'Draft Two', category: 'analysis' }),
          },
        ],
        meta: {
          total: 50,
          per_page: 10,
        },
        links: {
          self: 'https://api.osf.io/v2/draft_registrations/',
          first: 'https://api.osf.io/v2/draft_registrations/?page=1',
          last: 'https://api.osf.io/v2/draft_registrations/?page=5',
          next: 'https://api.osf.io/v2/draft_registrations/?page=2',
        },
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await draftRegistrations.listDraftRegistrations();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.test-osf.io/v2/draft_registrations/');

      expect(result.data).toHaveLength(2);
      expect(result.data[0].title).toBe('Draft One');
      expect(result.data[1].title).toBe('Draft Two');
      expect(result.meta?.total).toBe(50);
    });

    it('should apply filter parameters', async () => {
      const mockResponse: JsonApiListResponse<OsfDraftRegistrationAttributes> = {
        data: [],
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      await draftRegistrations.listDraftRegistrations({
        'filter[title]': 'test',
      });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('filter%5Btitle%5D=test');
    });

    it('should apply pagination parameters', async () => {
      const mockResponse: JsonApiListResponse<OsfDraftRegistrationAttributes> = {
        data: [],
        meta: { total: 50, per_page: 10 },
        links: {
          self: 'https://api.osf.io/v2/draft_registrations/?page=3',
        },
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      await draftRegistrations.listDraftRegistrations({ page: 3 });

      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain('page=3');
    });

    it('should handle empty results', async () => {
      const mockResponse: JsonApiListResponse<OsfDraftRegistrationAttributes> = {
        data: [],
        meta: { total: 0 },
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await draftRegistrations.listDraftRegistrations({ 'filter[title]': 'nonexistent' });

      expect(result.data).toHaveLength(0);
      expect(result.meta?.total).toBe(0);
    });
  });

  describe('listDraftRegistrationsPaginated(params)', () => {
    it('should return PaginatedResult for draft registrations', async () => {
      const mockResponse: JsonApiListResponse<OsfDraftRegistrationAttributes> = {
        data: [
          {
            id: 'draft-1',
            type: 'draft_registrations',
            attributes: buildDraftRegistrationAttributes({ title: 'Paginated Draft 1' }),
          },
        ],
        meta: { total: 20, per_page: 10 },
        links: {
          self: 'https://api.osf.io/v2/draft_registrations/',
          next: 'https://api.osf.io/v2/draft_registrations/?page=2',
        },
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await draftRegistrations.listDraftRegistrationsPaginated();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Paginated Draft 1');
      expect(result.hasNext).toBe(true);
    });
  });

  describe('create(data)', () => {
    it('should create a new draft registration with required registration_schema_id', async () => {
      const mockResponse: JsonApiResponse<OsfDraftRegistrationAttributes> = {
        data: {
          id: 'new-draft',
          type: 'draft_registrations',
          attributes: buildDraftRegistrationAttributes({
            title: 'New Draft Registration',
            description: 'A newly created draft',
          }),
          links: {
            html: 'https://osf.io/registries/drafts/new-draft/',
          },
        },
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const input: CreateDraftRegistrationInput = {
        registration_schema_id: '61e02b6c90de34000ae3447a',
        title: 'New Draft Registration',
        description: 'A newly created draft',
      };
      const result = await draftRegistrations.create(input);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.test-osf.io/v2/draft_registrations/');
      expect(options?.method).toBe('POST');

      const body = JSON.parse(options?.body as string);
      expect(body.data.type).toBe('draft_registrations');
      expect(body.data.attributes.title).toBe('New Draft Registration');
      expect(body.data.attributes.description).toBe('A newly created draft');
      expect(body.data.relationships.registration_schema.data.type).toBe('registration_schemas');
      expect(body.data.relationships.registration_schema.data.id).toBe('61e02b6c90de34000ae3447a');

      expect(result.id).toBe('new-draft');
      expect(result.title).toBe('New Draft Registration');
    });

    it('should create a draft registration with branched_from relationship', async () => {
      const mockResponse: JsonApiResponse<OsfDraftRegistrationAttributes> = {
        data: {
          id: 'branched-draft',
          type: 'draft_registrations',
          attributes: buildDraftRegistrationAttributes({
            title: 'Branched Draft',
            has_project: true,
          }),
          links: {
            html: 'https://osf.io/registries/drafts/branched-draft/',
          },
        },
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const input: CreateDraftRegistrationInput = {
        registration_schema_id: '61e02b6c90de34000ae3447a',
        branched_from: 'abc12',
        title: 'Branched Draft',
      };
      const result = await draftRegistrations.create(input);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      const body = JSON.parse(options?.body as string);

      expect(body.data.relationships.branched_from.data.type).toBe('nodes');
      expect(body.data.relationships.branched_from.data.id).toBe('abc12');
      expect(result.id).toBe('branched-draft');
    });

    it('should throw OsfPermissionError without write access', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
        status: 403,
      });

      await expect(
        draftRegistrations.create({
          registration_schema_id: '61e02b6c90de34000ae3447a',
          title: 'Unauthorized',
        }),
      ).rejects.toThrow(OsfPermissionError);
    });
  });

  describe('update(id, data)', () => {
    it('should update draft registration fields', async () => {
      const mockResponse: JsonApiResponse<OsfDraftRegistrationAttributes> = {
        data: {
          id: 'draft123',
          type: 'draft_registrations',
          attributes: buildDraftRegistrationAttributes({
            title: 'Updated Draft',
            registration_responses: { summary: 'Test Value' },
          }),
          links: {
            html: 'https://osf.io/registries/drafts/draft123/',
          },
        },
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const input: UpdateDraftRegistrationInput = {
        title: 'Updated Draft',
        registration_responses: { summary: 'Test Value' },
      };
      const result = await draftRegistrations.update('draft123', input);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.test-osf.io/v2/draft_registrations/draft123/');
      expect(options?.method).toBe('PATCH');

      const body = JSON.parse(options?.body as string);
      expect(body.data.type).toBe('draft_registrations');
      expect(body.data.id).toBe('draft123');
      expect(body.data.attributes.title).toBe('Updated Draft');
      expect(body.data.attributes.registration_responses).toEqual({ summary: 'Test Value' });

      expect(result.title).toBe('Updated Draft');
    });

    it('should throw OsfNotFoundError for non-existent draft registration', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

      await expect(draftRegistrations.update('non-existent', { title: 'Test' })).rejects.toThrow(OsfNotFoundError);
    });

    it('should throw OsfPermissionError without admin access', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
        status: 403,
      });

      await expect(draftRegistrations.update('read-only', { title: 'Test' })).rejects.toThrow(OsfPermissionError);
    });
  });

  describe('delete(id)', () => {
    it('should delete a draft registration', async () => {
      fetchMock.mockResponseOnce('', { status: 204 });

      await draftRegistrations.delete('draft123');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.test-osf.io/v2/draft_registrations/draft123/');
      expect(options?.method).toBe('DELETE');
    });

    it('should throw OsfNotFoundError for non-existent draft registration', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

      await expect(draftRegistrations.delete('non-existent')).rejects.toThrow(OsfNotFoundError);
    });

    it('should throw OsfPermissionError without admin access', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Permission denied.' }] }), {
        status: 403,
      });

      await expect(draftRegistrations.delete('no-access')).rejects.toThrow(OsfPermissionError);
    });
  });

  describe('listContributors(id)', () => {
    it('should fetch contributors for a draft registration', async () => {
      const mockResponse: JsonApiListResponse<Record<string, unknown>> = {
        data: [
          {
            id: 'draft123-user1',
            type: 'contributors',
            attributes: {
              bibliographic: true,
              permission: 'admin',
              index: 0,
            },
          },
          {
            id: 'draft123-user2',
            type: 'contributors',
            attributes: {
              bibliographic: true,
              permission: 'read',
              index: 1,
            },
          },
        ],
        meta: { total: 2, per_page: 10 },
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await draftRegistrations.listContributors('draft123');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.test-osf.io/v2/draft_registrations/draft123/contributors/');

      expect(result.data).toHaveLength(2);
    });

    it('should throw OsfNotFoundError for non-existent draft registration', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ errors: [{ detail: 'Not found.' }] }), { status: 404 });

      await expect(draftRegistrations.listContributors('non-existent')).rejects.toThrow(OsfNotFoundError);
    });
  });
});
