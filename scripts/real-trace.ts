import { NodeSDK } from '@opentelemetry/sdk-node';
import { generateText, registerTelemetry } from 'ai';
import { google } from '@ai-sdk/google';
import { LangfuseVercelAiSdkIntegration } from '@langfuse/vercel-ai-sdk';
import { langfuseSpanProcessor } from '../src/otel/langfuse';
import { HybridSearchEngine } from '../src/rag/search';
import { formatCitation } from '../src/rag/cite';

async function main() {
  const sdk = new NodeSDK({ spanProcessors: [langfuseSpanProcessor] });
  sdk.start();

  // Реєструємо міст між Vercel AI SDK та Langfuse!
  registerTelemetry(new LangfuseVercelAiSdkIntegration());

  const engine = new HybridSearchEngine();
  const query = 'Which two official transport mechanisms are specified in MCP?';
  const searchRes = await engine.search(query, 5);

  const contextText = searchRes.results
    .map((r) => `${formatCitation(r.chunk)}\n${r.chunk.text}`)
    .join('\n\n---\n\n');

  console.log('Викликаємо Gemini 3.8 Flash з телеметрією...');
  const result = await generateText({
    model: google('gemini-3.8-flash'),
    system: `You are an MCP assistant. Answer strictly using context:\n${contextText}`,
    prompt: query,
    experimental_telemetry: {
      isEnabled: true,
      functionId: 'eval-run-query',
    },
  });

  console.log('Відповідь:', result.text);

  // Примусове скидання буфера в Langfuse
  await langfuseSpanProcessor.forceFlush();
  await sdk.shutdown();
  console.log('✓ Трасу генерації доставлено!');
}

main().catch(console.error);