import fetchMock from 'jest-fetch-mock';
import { OsfClient } from '../../src/client';
import { OsfNotFoundError } from '../../src/network/Errors';

fetchMock.enableMocks();

describe('Integrated Scenarios', () => {
  const client = new OsfClient({
    token: 'test-token',
    baseUrl: 'https://api.osf.io/v2/',
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe('Scenario 1: Project Lifecycle', () => {
    it('should create, update, and delete a project (node)', async () => {
      const nodeId = 'project1';
      
      // 1. Create a project
      fetchMock.mockResponseOnce(JSON.stringify({
        data: {
          id: nodeId,
          type: 'nodes',
          attributes: {
            title: 'My Project',
            category: 'project',
            public: false,
            date_created: '2024-01-01T00:00:00Z',
            date_modified: '2024-01-01T00:00:00Z'
          }
        }
      }));

      const project = await client.nodes.create({
        title: 'My Project',
        category: 'project'
      });
      expect(project.id).toBe(nodeId);
      expect(project.title).toBe('My Project');

      // 2. Update the project
      fetchMock.mockResponseOnce(JSON.stringify({
        data: {
          id: nodeId,
          type: 'nodes',
          attributes: {
            title: 'Updated Project Title',
            category: 'project',
            public: true,
            date_created: '2024-01-01T00:00:00Z',
            date_modified: '2024-01-02T00:00:00Z'
          }
        }
      }));

      const updatedProject = await client.nodes.update(nodeId, {
        title: 'Updated Project Title',
        public: true
      });
      expect(updatedProject.title).toBe('Updated Project Title');
      expect(updatedProject.public).toBe(true);

      // 3. Delete the project
      fetchMock.mockResponseOnce('', { status: 204 });
      await client.nodes.deleteNode(nodeId);

      // 4. Verify deletion (Get returns 404)
      fetchMock.mockResponseOnce(JSON.stringify({
        errors: [{
          status: '404',
          title: 'Not Found',
          detail: 'No node found with that ID.'
        }]
      }), { status: 404 });

      await expect(client.nodes.getById(nodeId)).rejects.toThrow(OsfNotFoundError);
    });
  });

  describe('Scenario 2: User Exploration & Pagination', () => {
    it('should iterate through multiple pages of users', async () => {
      // Mock page 1
      fetchMock.mockResponseOnce(JSON.stringify({
        data: [
          { id: 'user1', type: 'users', attributes: { full_name: 'User One' } },
          { id: 'user2', type: 'users', attributes: { full_name: 'User Two' } }
        ],
        links: {
          next: 'https://api.osf.io/v2/users/?page=2'
        },
        meta: { total: 4, per_page: 2 }
      }));

      // Mock page 2
      fetchMock.mockResponseOnce(JSON.stringify({
        data: [
          { id: 'user3', type: 'users', attributes: { full_name: 'User Three' } },
          { id: 'user4', type: 'users', attributes: { full_name: 'User Four' } }
        ],
        links: {
          next: null
        },
        meta: { total: 4, per_page: 2 }
      }));

      const result = await client.users.listUsersPaginated();
      const users = [];
      for await (const user of result.items()) {
        users.push(user);
      }

      expect(users).toHaveLength(4);
      expect(users[0].full_name).toBe('User One');
      expect(users[3].full_name).toBe('User Four');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('Scenario 3: File Navigation', () => {
    it('should list providers and navigate file tree', async () => {
      const nodeId = 'abc12';

      // 1. List storage providers
      fetchMock.mockResponseOnce(JSON.stringify({
        data: [
          { id: nodeId + ':osfstorage', type: 'files', attributes: { name: 'osfstorage', path: '/' } }
        ]
      }));

      const providers = await client.files.listProviders(nodeId);
      expect(providers.data).toHaveLength(1);
      expect(providers.data[0].name).toBe('osfstorage');

      // 2. List files in osfstorage
      fetchMock.mockResponseOnce(JSON.stringify({
        data: [
          { 
            id: 'file1', 
            type: 'files', 
            attributes: { name: 'data.csv', kind: 'file', path: '/data.csv' },
            links: { download: 'https://files.osf.io/v1/resources/abc12/providers/osfstorage/file1' }
          }
        ]
      }));

      const files = await client.files.listByNode(nodeId, 'osfstorage');
      expect(files.data).toHaveLength(1);
      const file = files.data[0];
      expect(file.name).toBe('data.csv');

      // 3. Get versions
      fetchMock.mockResponseOnce(JSON.stringify({
        data: [
          { id: 'v1', type: 'file_versions', attributes: { size: 1024, content_type: 'text/csv' } }
        ]
      }));

      const versions = await client.files.listVersions('file1');
      expect(versions.data).toHaveLength(1);
      expect(versions.data[0].size).toBe(1024);
    });
  });

  describe('Scenario 4: Registration Creation Flow (Draft → Register)', () => {
    it('should create a draft, update it, and retrieve the resulting registration', async () => {
      const draftId = 'draft1';
      const registrationId = 'reg1';

      // 1. Create a draft registration
      fetchMock.mockResponseOnce(JSON.stringify({
        data: {
          id: draftId,
          type: 'draft_registrations',
          attributes: {
            title: 'My Draft Registration',
            description: '',
            category: 'project',
            tags: [],
            has_project: false,
            datetime_initiated: '2024-01-01T00:00:00Z',
            datetime_updated: '2024-01-01T00:00:00Z',
          }
        }
      }));

      const draft = await client.draftRegistrations.create({
        registration_schema_id: '61e02b6c90de34000ae3447a',
        title: 'My Draft Registration',
      });
      expect(draft.id).toBe(draftId);
      expect(draft.title).toBe('My Draft Registration');

      const createCall = fetchMock.mock.calls[0];
      expect(createCall[0]).toContain('draft_registrations/');
      expect(createCall[1]?.method).toBe('POST');

      // Verify relationships are included in the payload
      const createBody = JSON.parse(createCall[1]?.body as string);
      expect(createBody.data.relationships.registration_schema.data.id).toBe('61e02b6c90de34000ae3447a');

      // 2. Update the draft registration
      fetchMock.mockResponseOnce(JSON.stringify({
        data: {
          id: draftId,
          type: 'draft_registrations',
          attributes: {
            title: 'Updated Draft Title',
            description: 'A detailed description',
            category: 'project',
            tags: ['osf', 'research'],
            has_project: false,
            datetime_initiated: '2024-01-01T00:00:00Z',
            datetime_updated: '2024-01-02T00:00:00Z',
          }
        }
      }));

      const updatedDraft = await client.draftRegistrations.update(draftId, {
        title: 'Updated Draft Title',
        description: 'A detailed description',
      });
      expect(updatedDraft.title).toBe('Updated Draft Title');
      expect(updatedDraft.description).toBe('A detailed description');

      const updateCall = fetchMock.mock.calls[1];
      expect(updateCall[0]).toContain(`draft_registrations/${draftId}/`);
      expect(updateCall[1]?.method).toBe('PATCH');

      // 3. Retrieve the resulting registration
      fetchMock.mockResponseOnce(JSON.stringify({
        data: {
          id: registrationId,
          type: 'registrations',
          attributes: {
            title: 'Updated Draft Title',
            description: 'A detailed description',
            category: 'project',
            current_user_can_comment: true,
            date_created: '2024-01-01T00:00:00Z',
            date_modified: '2024-01-02T00:00:00Z',
            date_registered: '2024-01-02T00:00:00Z',
            fork: false,
            preprint: false,
            public: true,
            registration: true,
            collection: false,
            withdrawn: false,
            pending_embargo_approval: false,
            pending_registration_approval: false,
            pending_withdrawal: false,
            tags: ['osf', 'research'],
          }
        }
      }));

      const registration = await client.registrations.getById(registrationId);
      expect(registration.id).toBe(registrationId);
      expect(registration.title).toBe('Updated Draft Title');
      expect(registration.registration).toBe(true);
      expect(registration.public).toBe(true);

      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('Scenario 5: Preprint Submission Flow', () => {
    it('should create a preprint, then retrieve its contributors and citation', async () => {
      const preprintId = 'preprint1';

      // 1. Create a preprint
      fetchMock.mockResponseOnce(JSON.stringify({
        data: {
          id: preprintId,
          type: 'preprints',
          attributes: {
            title: 'My Research Preprint',
            description: 'A groundbreaking study',
            date_created: '2024-03-01T00:00:00Z',
            date_modified: '2024-03-01T00:00:00Z',
            date_published: '2024-03-01T00:00:00Z',
            doi: '10.31219/osf.io/preprint1',
            is_published: true,
            is_preprint_orphan: false,
            tags: ['science', 'research'],
            public: true,
            reviews_state: 'accepted',
          }
        }
      }));

      const preprint = await client.preprints.create({
        title: 'My Research Preprint',
        description: 'A groundbreaking study',
      });
      expect(preprint.id).toBe(preprintId);
      expect(preprint.title).toBe('My Research Preprint');
      expect(preprint.is_published).toBe(true);

      const createCall = fetchMock.mock.calls[0];
      expect(createCall[0]).toContain('preprints/');
      expect(createCall[1]?.method).toBe('POST');

      // 2. List contributors of the preprint
      fetchMock.mockResponseOnce(JSON.stringify({
        data: [
          {
            id: 'preprint1-user1',
            type: 'contributors',
            attributes: { bibliographic: true, permission: 'admin', index: 0 }
          },
          {
            id: 'preprint1-user2',
            type: 'contributors',
            attributes: { bibliographic: true, permission: 'write', index: 1 }
          },
        ]
      }));

      const contributors = await client.preprints.listContributors(preprintId);
      expect(contributors.data).toHaveLength(2);
      expect(contributors.data[0].permission).toBe('admin');
      expect(contributors.data[1].permission).toBe('write');

      // 3. Get the preprint citation
      fetchMock.mockResponseOnce(JSON.stringify({
        data: {
          id: preprintId,
          type: 'citation',
          attributes: {
            citation: 'Author, A. (2024). My Research Preprint. OSF Preprints. https://doi.org/10.31219/osf.io/preprint1',
          }
        }
      }));

      const citation = await client.preprints.getCitation(preprintId);
      expect(citation.id).toBe(preprintId);
      expect(citation.citation).toContain('My Research Preprint');

      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('Scenario 6: Collaborator Invitation & Permission Management', () => {
    it('should add a contributor, change permissions step by step, then remove', async () => {
      const nodeId = 'proj1';
      const userId = 'user42';

      // 1. Add a contributor with read permission
      fetchMock.mockResponseOnce(JSON.stringify({
        data: {
          id: `${nodeId}-${userId}`,
          type: 'contributors',
          attributes: {
            bibliographic: true,
            permission: 'read',
            index: 1,
          }
        }
      }));

      const contributor = await client.contributors.addToNode(nodeId, {
        userId,
        permission: 'read',
        bibliographic: true,
      });
      expect(contributor.id).toBe(`${nodeId}-${userId}`);
      expect(contributor.permission).toBe('read');

      const addCall = fetchMock.mock.calls[0];
      expect(addCall[0]).toContain(`nodes/${nodeId}/contributors/`);
      expect(addCall[1]?.method).toBe('POST');

      // 2. Upgrade permission: read → write
      fetchMock.mockResponseOnce(JSON.stringify({
        data: {
          id: `${nodeId}-${userId}`,
          type: 'contributors',
          attributes: {
            bibliographic: true,
            permission: 'write',
            index: 1,
          }
        }
      }));

      const writeContributor = await client.contributors.update(nodeId, userId, {
        permission: 'write',
      });
      expect(writeContributor.permission).toBe('write');

      const writeCall = fetchMock.mock.calls[1];
      expect(writeCall[0]).toContain(`nodes/${nodeId}/contributors/${userId}/`);
      expect(writeCall[1]?.method).toBe('PATCH');

      // 3. Upgrade permission: write → admin
      fetchMock.mockResponseOnce(JSON.stringify({
        data: {
          id: `${nodeId}-${userId}`,
          type: 'contributors',
          attributes: {
            bibliographic: true,
            permission: 'admin',
            index: 1,
          }
        }
      }));

      const adminContributor = await client.contributors.update(nodeId, userId, {
        permission: 'admin',
      });
      expect(adminContributor.permission).toBe('admin');

      // 4. Remove the contributor
      fetchMock.mockResponseOnce('', { status: 204 });
      await client.contributors.removeFromNode(nodeId, userId);

      const removeCall = fetchMock.mock.calls[3];
      expect(removeCall[0]).toContain(`nodes/${nodeId}/contributors/${userId}/`);
      expect(removeCall[1]?.method).toBe('DELETE');

      expect(fetchMock).toHaveBeenCalledTimes(4);
    });
  });
});
