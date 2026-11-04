import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CircuitBreaker } from '../../src/harness/breaker';
import { stepLimit } from '../../src/harness/stop';

describe('Circuit Breaker (Крок 03)', () => {
  const getTmpBreaker = () => {
    const dir = mkdtempSync(join(tmpdir(), 'breaker-test-'));
    const file = join(dir, 'breaker.json');
    return { cb: new CircuitBreaker(file, 3, 10), dir };
  };

  it('початковий стан closed дозволяє запуск', () => {
    const { cb, dir } = getTmpBreaker();
    expect(cb.mayRun().allow).toBe(true);
    expect(cb.mayRun().why).toBe('closed');
    rmSync(dir, { recursive: true });
  });

  it('відкривається при 3 помилках підряд', () => {
    const { cb, dir } = getTmpBreaker();
    cb.record(false, 'fail 1');
    expect(cb.load().state).toBe('closed');
    cb.record(false, 'fail 2');
    expect(cb.load().state).toBe('closed');
    cb.record(false, 'fail 3');

    const state = cb.load();
    expect(state.state).toBe('open');
    expect(state.trip).toBe('fail 3');
    expect(cb.mayRun().allow).toBe(false);
    rmSync(dir, { recursive: true });
  });

  it('негайно відкривається при помилці 429 Quota Exceeded', () => {
    const { cb, dir } = getTmpBreaker();
    cb.record(false, 'HTTP 429 Quota Exceeded');
    expect(cb.load().state).toBe('open');
    expect(cb.load().trip).toContain('429');
    expect(cb.mayRun().allow).toBe(false);
    rmSync(dir, { recursive: true });
  });

  it('переходить у half-open після завершення cooldown', () => {
    const { cb, dir } = getTmpBreaker();
    // Викликаємо 3 помилки, щоб перевести брейкер у стан open
    cb.record(false, 'fail 1');
    cb.record(false, 'fail 2');
    cb.record(false, 'fail 3');
    expect(cb.load().state).toBe('open');

    // Емулюємо проходження 15 хвилин (cooldown = 10 хв)
    const futureMs = Date.now() + 15 * 60 * 1000;
    const check = cb.mayRun(futureMs);
    expect(check.allow).toBe(true);
    expect(check.probe).toBe(true);
    expect(cb.load().state).toBe('half-open');

    // Успіх пробної задачі повертає в closed
    cb.record(true);
    expect(cb.load().state).toBe('closed');
    rmSync(dir, { recursive: true });
  });
});

describe('stepLimit (Крок 03)', () => {
  it('зупиняє цикл на N кроках і повертає true', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'steplimit-test-'));
    const logFile = join(dir, 'stop-log.jsonl');

    const limitFn = stepLimit(3, 'task-test-limit', logFile);
    // AI SDK передає масив steps: StepResult[]
    expect(await limitFn({ steps: new Array(1) } as any)).toBe(false);
    expect(await limitFn({ steps: new Array(2) } as any)).toBe(false);
    expect(await limitFn({ steps: new Array(3) } as any)).toBe(true);

    rmSync(dir, { recursive: true });
  });
});