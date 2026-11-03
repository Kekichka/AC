import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runTask, type AgentRunner, type Task } from '../../scripts/harness/run-task';

const task: Task = {
  id: 't-01',
  input: 'перевірка виконання',
  acceptance: ['npm run typecheck'],
  budget: { max_turns: 2, max_usd: 0.01, timeout_s: 30 },
};

const fake = (exitCode: number, stdout = '', stderr = '', timedOut = false): AgentRunner => () => ({
  exitCode,
  stdout,
  stderr,
  timedOut,
});
const tmp = () => mkdtempSync(join(tmpdir(), 'harness-'));

describe('runTask (Крок 00)', () => {
  it('пише журнал і артефакт на успішному прогоні', () => {
    const out = tmp();
    const worktree = tmp();
    const rec = runTask(task, {
      runner: fake(
        0,
        JSON.stringify({ session_id: 'abc-session', total_cost_usd: 0.004, usage: { input_tokens: 10, output_tokens: 5 } }),
      ),
      agentPath: 'fake',
      worktree,
      outDir: out,
      check: () => [{ cmd: 'npm run typecheck', exit: 0 }],
    });

    expect(rec.exit_status).toBe('ok');
    expect(rec.session_id).toBe('abc-session');
    expect(rec.cost_usd_estimate).toBe(0.004);
    expect(rec.input_tokens).toBe(10);
    expect(rec.output_tokens).toBe(5);
    expect(rec.acceptance_passed).toBe(true);

    const saved = JSON.parse(readFileSync(join(rec.artifact_dir, 'run.json'), 'utf8'));
    expect(saved.task_id).toBe('t-01');
    expect(saved.artifact_dir).toBe(rec.artifact_dir);
  });

  it('пише журнал навіть коли агент упав', () => {
    const out = tmp();
    const rec = runTask(task, {
      runner: fake(1, '', 'agent execution error'),
      agentPath: 'fake',
      worktree: tmp(),
      outDir: out,
      check: () => [{ cmd: 'npm run typecheck', exit: 1 }],
    });

    expect(rec.exit_status).toBe('agent_failed');
    expect(readFileSync(join(rec.artifact_dir, 'agent.log'), 'utf8')).toContain('agent execution error');
  });

  it('відрізняє вичерпаний бюджет від падіння', () => {
    const out = tmp();
    const rec = runTask(task, {
      runner: fake(1, '', 'Budget limit reached'),
      agentPath: 'fake',
      worktree: tmp(),
      outDir: out,
      check: () => [{ cmd: 'npm run typecheck', exit: 1 }],
    });

    expect(rec.exit_status).toBe('budget_or_turns');
  });

  it('фіксує таймаут процесу', () => {
    const out = tmp();
    const rec = runTask(task, {
      runner: fake(1, '', '', true),
      agentPath: 'fake',
      worktree: tmp(),
      outDir: out,
      check: () => [{ cmd: 'npm run typecheck', exit: 1 }],
    });

    expect(rec.exit_status).toBe('timeout');
  });

  it('не падає на непарсибельному виводі', () => {
    const out = tmp();
    const rec = runTask(task, {
      runner: fake(0, 'plain text output'),
      agentPath: 'fake',
      worktree: tmp(),
      outDir: out,
      check: () => [{ cmd: 'npm run typecheck', exit: 0 }],
    });

    expect(rec.cost_usd_estimate).toBeNull();
    expect(rec.session_id).toBeNull();
  });
});