import { describe, expect, it } from 'vitest';
import { McpServerCore } from '../src/mcp/server';

describe('MCP Application Integration (Крок 09)', () => {
  const server = new McpServerCore();

  it('застосунок: callTool search_documents повертає валідні результати', async () => {
    const res = await server.callTool('search_documents', { query: 'stdio SSE', topK: 2 });
    expect(res.isError).toBeFalsy();
    expect(res.content[0]?.text).toContain('mcp-trans-02');
  });

  it('агент: getToolsList надає схеми JSON Schema для кожного інструмента', () => {
    const tools = server.getToolsList();
    expect(tools.length).toBeGreaterThanOrEqual(3);
    for (const t of tools) {
      expect(t.name).toBeDefined();
      expect(t.inputSchema).toBeDefined();
    }
  });
});