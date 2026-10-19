import { describe, expect, it } from 'vitest';
import { McpServerCore } from '../src/mcp/server';

describe('MCP Server & Security Boundaries (Крок 08)', () => {
  const server = new McpServerCore();

  it('повертає список із 3 інструментів у tools/list', () => {
    const tools = server.getToolsList();
    expect(tools).toHaveLength(3);
    const names = tools.map((t) => t.name);
    expect(names).toContain('search_documents');
    expect(names).toContain('get_document_chunk');
    expect(names).toContain('list_available_documents');
  });

  it('успішно виконує search_documents для валідного запиту', async () => {
    const res = await server.callTool('search_documents', { query: 'stdio transport' });
    expect(res.isError).toBeFalsy();
    expect(res.content[0]?.text).toContain('mcp-trans-02');
  });

  it('відмовляє, якщо topK виходить за межі [1..10]', async () => {
    const res = await server.callTool('search_documents', { query: 'test', topK: 999 });
    expect(res.isError).toBe(true);
    expect(res.content[0]?.text).toContain('Помилка валідації');
  });

  it('ТЕСТ БЕЗПЕКИ: блокує path traversal спробу (../../.env.local)', async () => {
    const maliciousArgs = { chunkId: '../../.env.local' };
    const res = await server.callTool('get_document_chunk', maliciousArgs);

    // Тест має бути зеленим саме тому, що сервер відмовив у виході за межі!
    expect(res.isError).toBe(true);
    expect(res.content[0]?.text).toContain('Порушення безпеки: path traversal та слеші суворо заборонені');
  });

  it('ТЕСТ БЕЗПЕКИ: блокує невалідний формат chunkId', async () => {
    const res = await server.callTool('get_document_chunk', { chunkId: 'invalid-format-without-hash' });
    expect(res.isError).toBe(true);
    expect(res.content[0]?.text).toContain('Помилка безпеки');
  });

  it('обробляє ініціалізацію JSON-RPC 2.0 за специфікацією', async () => {
    const initReq = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05' },
    });
    const res = await server.handleJsonRpc(initReq);
    expect(res).not.toBeNull();
    const parsed = JSON.parse(res!);
    expect(parsed.result.serverInfo.name).toBe('mcp-knowledge-server');
    expect(parsed.result.capabilities.tools).toBeDefined();
  });
});