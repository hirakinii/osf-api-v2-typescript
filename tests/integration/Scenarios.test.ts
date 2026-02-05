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
});
