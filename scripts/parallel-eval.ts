import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { HybridSearchEngine } from '../src/rag/search';
import { formatCitation } from '../src/rag/cite';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { trace } from '@opentelemetry/api';
import { langfuseSpanProcessor } from '../src/otel/langfuse';

/** БЮДЖЕТ. Записується ДО запуску і дослівно переноситься в budget.md. */
export interface Budget {
  readonly maxBranches: number;
  readonly maxTokens: number;
  readonly maxWallMs: number;
}

export const BUDGET: Budget = { maxBranches: 4, maxTokens: 200_000, maxWallMs: 10 * 60_000 };

export interface BranchResult {
  readonly id: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly ms: number;
}

export async function runPool<T>(
  tasks: readonly (() => Promise<T>)[],
  budget: Budget,
  spentTokens: () => number,
): Promise<{ results: (T | Error)[]; stoppedEarly: boolean }> {
  const results: (T | Error)[] = new Array(tasks.length);
  const startedAt = performance.now();
  let next = 0;
  let stoppedEarly = false;

  const worker = async (): Promise<void> => {
    while (next < tasks.length) {
      if (spentTokens() >= budget.maxTokens || performance.now() - startedAt >= budget.maxWallMs) {
        stoppedEarly = true;
        return;
      }
      const i = next++;
      try {
        results[i] = await tasks[i]!();
      } catch (error) {
        results[i] = error instanceof Error ? error : new Error(String(error));
      }
    }
  };

  const width = Math.max(1, Math.min(budget.maxBranches, tasks.length));
  await Promise.all(Array.from({ length: width }, worker));
  return { results, stoppedEarly };
}

const OUT = 'docs/lab2/parallel-run.json';

interface Entry { id: string; query: string; must_cite: string[] }

async function main() {
  const widthArg = Number(process.argv[2] ?? 1);
  const width = Number.isFinite(widthArg) && widthArg > 0 ? widthArg : 1;
  const currentBudget: Budget = { ...BUDGET, maxBranches: width };

  const sdk = new NodeSDK({ spanProcessors: [langfuseSpanProcessor] });
  sdk.start();

  const entries: Entry[] = readFileSync('docs/lab2/golden/queries.jsonl', 'utf8')
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const engine = new HybridSearchEngine();
  let spent = 0;

  const tasks = entries.map((entry) => async (): Promise<BranchResult> => {
    const started = performance.now();
    const searchRes = await engine.search(entry.query, 5);
    const inTokens = 180 + searchRes.results.length * 90;
    const outTokens = 75;
    spent += inTokens + outTokens;
    // емуляція мережевої затримки читання
    await new Promise((r) => setTimeout(r, 60));
    return {
      id: entry.id,
      inputTokens: inTokens,
      outputTokens: outTokens,
      ms: Math.round(performance.now() - started),
    };
  });

  console.log(`\n▶ Старт прогону (Ширина пулу: ${width}, Запитів: ${tasks.length})...`);
  const wallStart = performance.now();
  const { results, stoppedEarly } = await runPool(tasks, currentBudget, () => spent);
  const wallMs = Math.round(performance.now() - wallStart);

  const ok = results.filter((r): r is BranchResult => !(r instanceof Error));
  const failed = results.filter((r): r is Error => r instanceof Error);
  const sumBranchMs = ok.reduce((n, r) => n + r.ms, 0);

  const totalIn = ok.reduce((n, r) => n + r.inputTokens, 0);
  const totalOut = ok.reduce((n, r) => n + r.outputTokens, 0);
  const costUsd = Number(((totalIn * 0.1 + totalOut * 0.4) / 1_000_000).toFixed(6));

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(
    OUT,
    JSON.stringify(
      {
        runAt: new Date().toISOString(),
        width,
        wallMs,
        sumBranchMs,
        speedup: Number((sumBranchMs / wallMs).toFixed(2)),
        inputTokens: totalIn,
        outputTokens: totalOut,
        costUsd,
        done: ok.length,
        failed: failed.length,
        stoppedEarly,
        branches: ok,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`\nРезультат (Ширина: ${width}):`);
  console.log(`  Час стіни (wallMs):    ${wallMs} мс`);
  console.log(`  Сума часу гілок:       ${sumBranchMs} мс`);
  console.log(`  Прискорення (speedup): ${(sumBranchMs / wallMs).toFixed(2)}x`);
  console.log(`  Токени (in/out):       ${totalIn} / ${totalOut}`);
  console.log(`  Вартість:              $${costUsd}`);

  // Відправляємо трасу в Langfuse через OpenTelemetry
  const tracer = trace.getTracer('parallel-tracer');
  const spanName = width === 1 ? 'parallel-before' : 'parallel-after';
  const span = tracer.startSpan(spanName, {
    attributes: {
      'langfuse.trace.name': spanName,
      'langfuse.tags': ['lab2', 'step-07', width === 1 ? 'sequential' : 'parallel'],
      'langfuse.observation.input': `Pool run with concurrency width = ${width}`,
      'langfuse.observation.output': `Completed: ${ok.length} queries in ${wallMs}ms (speedup: ${(sumBranchMs / wallMs).toFixed(2)}x)`,
      'parallel.width': width,
      'parallel.wall_ms': wallMs,
      'parallel.sum_branch_ms': sumBranchMs,
      'gen_ai.usage.prompt_tokens': totalIn,
      'gen_ai.usage.completion_tokens': totalOut,
      'gen_ai.usage.cost': costUsd,
    },
  });
  span.end();
  await langfuseSpanProcessor.forceFlush();
  await sdk.shutdown();
  console.log(`✓ Трасу '${spanName}' надіслано в Langfuse!`);
}

main().catch(console.error);