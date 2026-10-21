import { NextResponse } from 'next/server';
import { McpServerCore } from '../../../src/mcp/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tool = 'search_documents', args = {} } = body;

    const server = new McpServerCore();
    const result = await server.callTool(tool, args);

    return NextResponse.json({
      status: result.isError ? 'error' : 'ok',
      tool,
      args,
      result: result.content,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}