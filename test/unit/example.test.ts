import { OsfClient } from '../../src/index';

describe('OsfClient', () => {
    it('should be instantiated with a token', () => {
        const client = new OsfClient('test-token');
        expect(client).toBeDefined();
    });

    it('should return a fetch string', () => {
        const client = new OsfClient('test-token');
        expect(client.get('/nodes')).toBe('Fetching /nodes with token test-token');
    });
});
