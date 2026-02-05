import { OsfClient } from '../../src/index';

describe('OsfClient', () => {
  it('should be instantiated with a config object', () => {
    const client = new OsfClient({ token: 'test-token' });
    expect(client).toBeDefined();
  });

  it('should provide access to resources', () => {
    const client = new OsfClient({ token: 'test-token' });
    expect(client.nodes).toBeDefined();
    expect(client.files).toBeDefined();
    expect(client.users).toBeDefined();
  });
});
