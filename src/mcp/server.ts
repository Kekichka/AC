import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { HybridSearchEngine } from '../rag/search';
import { formatCitation } from '../rag/cite';
import type { IndexFile } from '../rag/store';

// Схеми валідації аргументів інструментів за специфікацією mcp-spec.md
export const SearchArgsSchema = z.object({
  query: z.string().min(1).max(500),
  topK: z.number().int().min(1).max(10).optional().default(5),
});

export const ChunkArgsSchema = z.object({
  chunkId: z.string().regex(/^[a-zA-Z0-9_-]+#[0-9]{4}$/, 'Невалідний формат chunkId; шлях файлової системи заборонено'),
});

export class McpServerCore {
  private engine: HybridSearchEngine;
  private indexData: IndexFile;

  constructor(indexPath = 'data/index.json') {
    this.engine = new HybridSearchEngine(indexPath);
    this.indexData = JSON.parse(readFileSync(indexPath, 'utf8')) as IndexFile;
  }

  // Оголошення інструментів за стандартом MCP
  getToolsList() {
    return [
      {
        name: 'search_documents',
        description: 'Гібридний пошук (BM25 + Cosine + RRF) по колекції технічної документації MCP',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Пошуковий запит (до 500 символів)' },
            topK: { type: 'number', description: 'Кількість результатів (1-10)', default: 5 },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_document_chunk',
        description: 'Отримання фрагмента документа за стабільним chunkId з перевіркою меж безпеки',
        inputSchema: {
          type: 'object',
          properties: {
            chunkId: { type: 'string', description: 'ID фрагмента у форматі docId#0000' },
          },
          required: ['chunkId'],
        },
      },
      {
        name: 'list_available_documents',
        description: 'Перелік усіх доступних документів корпусу та їхніх ліцензій',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  // Безпечний виклик інструментів
  async callTool(name: string, args: unknown): Promise<{ content: { type: string; text: string }[]; isError?: boolean }> {
    switch (name) {
      case 'search_documents': {
        const parsed = SearchArgsSchema.safeParse(args);
        if (!parsed.success) {
          return { content: [{ type: 'text', text: `Помилка валідації параметрів: ${parsed.error.message}` }], isError: true };
        }
        const { query, topK } = parsed.data;
        const res = await this.engine.search(query, topK);
        if (res.isRefusal) {
          return { content: [{ type: 'text', text: `[ВІДМОВА]: ${res.refusalReason}` }] };
        }
        const out = res.results.map((r, i) => `${i + 1}. ${formatCitation(r.chunk)}\n${r.chunk.text}`).join('\n\n');
        return { content: [{ type: 'text', text: out }] };
      }

      case 'get_document_chunk': {
        // Перевірка безпеки на path traversal та спецсимволи
        if (typeof args === 'object' && args !== null && 'chunkId' in args) {
          const rawId = String((args as { chunkId: unknown }).chunkId);
          if (rawId.includes('/') || rawId.includes('\\') || rawId.includes('..')) {
            return {
              content: [{ type: 'text', text: 'Порушення безпеки: path traversal та слеші суворо заборонені!' }],
              isError: true,
            };
          }
        }

        const parsed = ChunkArgsSchema.safeParse(args);
        if (!parsed.success) {
          return { content: [{ type: 'text', text: `Помилка безпеки / схеми: ${parsed.error.message}` }], isError: true };
        }

        const chunk = this.indexData.chunks.find((c) => c.id === parsed.data.chunkId);
        if (!chunk) {
          return { content: [{ type: 'text', text: `Фрагмент '${parsed.data.chunkId}' не знайдено в індексі.` }], isError: true };
        }

        return {
          content: [
            {
              type: 'text',
              text: `${formatCitation(chunk)}\nТекст:\n${chunk.text}`,
            },
          ],
        };
      }

      case 'list_available_documents': {
        const list = this.indexData.documents.map((d) => `- ${d.id} (${d.lengthChars} chars) -> ${d.path}`).join('\n');
        return { content: [{ type: 'text', text: `Доступні документи в корпусі (${this.indexData.documents.length}):\n${list}` }] };
      }

      default:
        return { content: [{ type: 'text', text: `Невідомий інструмент: ${name}` }], isError: true };
    }
  }

  // Обробник JSON-RPC 2.0 повідомлень для stdio транспорту
  async handleJsonRpc(message: string): Promise<string | null> {
    try {
      const req = JSON.parse(message);
      const { id, method, params } = req;

      if (method === 'initialize') {
        return JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'mcp-knowledge-server', version: '1.0.0' },
          },
        });
      }

      if (method === 'notifications/initialized') {
        return null; // Сповіщення не вимагає відповіді
      }

      if (method === 'tools/list') {
        return JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: { tools: this.getToolsList() },
        });
      }

      if (method === 'tools/call') {
        const toolResult = await this.callTool(params.name, params.arguments);
        return JSON.stringify({
          jsonrpc: '2.0',
          id,
          result: toolResult,
        });
      }

      if (method === 'ping') {
        return JSON.stringify({ jsonrpc: '2.0', id, result: {} });
      }

      return JSON.stringify({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Метод '${method}' не підтримується` },
      });
    } catch {
      return JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error: невалідний JSON' },
      });
    }
  }
}

// Запуск stdio-сервера при безпосередньому виклику з CLI
if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  const server = new McpServerCore();
  process.stdin.setEncoding('utf8');

  let buffer = '';
  process.stdin.on('data', async (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.trim()) {
        const response = await server.handleJsonRpc(line.trim());
        if (response) {
          process.stdout.write(response + '\n');
        }
      }
    }
  });

  process.stderr.write('[MCP Server] Запущено на stdio транспорті...\n');
}