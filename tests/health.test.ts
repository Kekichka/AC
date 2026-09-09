import { describe, it, expect } from 'vitest';
import { GET } from '../app/api/health/route';

describe('GET /api/health', () => {
  it('повертає JSON зі статусом ok та кодом 200', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(typeof data.uptime).toBe('number');
    expect(data.timestamp).toBeDefined();
  });
});
