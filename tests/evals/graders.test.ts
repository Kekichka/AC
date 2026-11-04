import { describe, expect, it } from 'vitest';
import { acceptanceGreen, touchesOnlyListed, noChanges, testsUntouched, grade, type GraderCtx } from '../../scripts/evals/graders';
import type { Task } from '../../scripts/harness/run-task';

describe('Deterministic Graders (Крок 04)', () => {
  const baseTask: Task = {
    id: 't-test',
    input: 'test',
    acceptance: ['npm run typecheck'],
    budget: { max_turns: 5, max_usd: 0.1, timeout_s: 60 },
    files: ['src/cost.ts'],
    label: { acceptance: true, touches_only_listed: true },
  };

  it('acceptanceGreen повертає true коли всі команди exit 0', () => {
    const ctx: GraderCtx = {
      task: baseTask,
      patch: '',
      output: '',
      acceptance: [{ cmd: 'npm run typecheck', exit: 0 }],
    };
    expect(acceptanceGreen(ctx).pass).toBe(true);
  });

  it('acceptanceGreen повертає false коли хоч одна команда впала', () => {
    const ctx: GraderCtx = {
      task: baseTask,
      patch: '',
      output: '',
      acceptance: [{ cmd: 'npm run typecheck', exit: 1 }],
    };
    expect(acceptanceGreen(ctx).pass).toBe(false);
  });

  it('touchesOnlyListed ловить правки файлів поза переліком files', () => {
    const ctxBad: GraderCtx = {
      task: baseTask,
      patch: '+++ b/src/cost.ts\n+1\n+++ b/package.json\n+2',
      output: '',
      acceptance: [],
    };
    expect(touchesOnlyListed(ctxBad).pass).toBe(false);

    const ctxGood: GraderCtx = {
      task: baseTask,
      patch: '+++ b/src/cost.ts\n+1',
      output: '',
      acceptance: [],
    };
    expect(touchesOnlyListed(ctxGood).pass).toBe(true);
  });

  it('noChanges повертає true тільки якщо diff порожній', () => {
    expect(noChanges({ task: baseTask, patch: '', output: '', acceptance: [] }).pass).toBe(true);
    expect(noChanges({ task: baseTask, patch: '+++ b/file.ts', output: '', acceptance: [] }).pass).toBe(false);
  });

  it('testsUntouched блокує зміни файлів у tests/', () => {
    const ctx: GraderCtx = {
      task: baseTask,
      patch: '+++ b/tests/chunk.test.ts\n-assert\n+true',
      output: '',
      acceptance: [],
    };
    expect(testsUntouched(ctx).pass).toBe(false);
  });

  it('grade застосовує тільки оцінювачі з task.label', () => {
    const ctx: GraderCtx = {
      task: { ...baseTask, label: { no_changes: true } },
      patch: '',
      output: '',
      acceptance: [{ cmd: 'npm run typecheck', exit: 0 }],
    };
    const res = grade(ctx);
    expect(res).toHaveLength(1);
    expect(res[0]?.id).toBe('no_changes');
  });
});