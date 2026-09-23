import { after } from 'next/server';
import { ToolLoopAgent, tool, isStepCount } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { langfuseSpanProcessor } from '@/src/otel/langfuse';

export const maxDuration = 60;

const agent = new ToolLoopAgent({
  model: google('gemini-3.6-flash'),
  instructions: 'Для поточного часу використовуй інструмент getTime.',
  tools: {
    getTime: tool({
      description: 'Поточний час сервера (ISO 8601)',
      inputSchema: z.object({}),
      execute: async () => ({ now: new Date().toISOString() }),
    }),
  },
  stopWhen: isStepCount(3),
  telemetry: { functionId: 'lab01-agent' },
});

export async function POST(req: Request) {
  after(async () => {
    await langfuseSpanProcessor.forceFlush();
  });

  const body = (await req.json().catch(() => ({}))) as { prompt?: unknown };
  const prompt = typeof body.prompt === 'string' ? body.prompt : 'Котра зараз година?';

  try {
    const result = await agent.generate({ prompt });
    return Response.json({ text: result.text, usage: result.usage });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
