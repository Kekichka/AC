import { isStepCount } from 'ai';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Обгортка робить те саме, що isStepCount(n), але лишає рядок у журналі.
 * Тип беремо з самого помічника (typeof inner) — власного підпису не вигадуємо.
 */
export function stepLimit(n: number, taskId: string, logFile = 'docs/lab3/stop-log.jsonl') {
  const inner = isStepCount(n);
  const wrapped: typeof inner = (...args: Parameters<typeof inner>) => {
    const r = inner(...args);
    Promise.resolve(r).then((hit) => {
      if (!hit) return;
      try {
        mkdirSync(dirname(logFile), { recursive: true });
        appendFileSync(
          logFile,
          JSON.stringify({ at: new Date().toISOString(), taskId, limit: 'isStepCount', n }) + '\n',
          'utf8'
        );
      } catch {
        // Ігноруємо помилки доступу до файлової системи в тестах
      }
    });
    return r;
  };
  return wrapped;
}