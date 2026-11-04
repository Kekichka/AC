// Черга фабрики: одна задача або всі. Готує git worktree й прибирає після себе.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { geminiRunner, runTask, type Task } from './run-task';
import { CircuitBreaker } from '../../src/harness/breaker';

const file = process.argv[2] ?? 'docs/lab3/tasks.jsonl';
const onlyId = process.argv.includes('--id') ? process.argv[process.argv.indexOf('--id') + 1] : null;

const tasks: Task[] = readFileSync(file, 'utf8')
  .replace(/^\uFEFF/, '')
  .split(/\r?\n/)
  .filter((l) => l.trim() !== '')
  .map((l) => JSON.parse(l) as Task)
  .filter((t) => onlyId === null || t.id === onlyId);

if (tasks.length === 0) throw new Error(`У ${file} немає задач${onlyId ? ` з id ${onlyId}` : ''}`);

const git = (args: string[], cwd = '.') => execFileSync('git', args, { cwd, encoding: 'utf8' });
const breaker = new CircuitBreaker();

for (const task of tasks) {
  // Шар 3: Перевірка Circuit Breaker
  const check = breaker.mayRun();
  if (!check.allow) {
    console.warn(`\n[Circuit Breaker OPEN]: Прогін зупинено для задачі ${task.id}: ${check.why}`);
    break;
  }

  if (check.probe) {
    console.log(`\n[Circuit Breaker HALF-OPEN]: Запуск пробної задачі ${task.id}...`);
  }

  const branch = `harness/${task.id}`;
  const tree = join('..', 'harness-runs', task.id);

  console.log(`\n▶ Створення git worktree для ${task.id} (${tree})...`);
  git(['worktree', 'add', '-b', branch, tree, 'main']);

  try {
    const rec = runTask(task, {
      runner: geminiRunner,
      agentPath: 'gemini-cli',
      worktree: tree,
      outDir: 'runs',
    });

    const isSuccess = rec.exit_status === 'ok' && rec.acceptance_passed;
    breaker.record(isSuccess, rec.exit_status === 'agent_failed' ? 'Task acceptance failed' : null);

    const keep = join('docs', 'lab3', 'runs', `${task.id}-${new Date(rec.started_at).getTime()}`);
    mkdirSync(keep, { recursive: true });
    cpSync(rec.artifact_dir, keep, { recursive: true });

    console.log(`${task.id}: ${rec.exit_status}, acceptance ${rec.acceptance_passed ? 'pass' : 'fail'} → ${keep}`);
  } catch (err: any) {
    const is429 = String(err?.message).includes('429');
    breaker.record(false, is429 ? 'HTTP 429 Quota Exceeded' : 'Execution crash');
    throw err;
  } finally {
    git(['worktree', 'remove', tree, '--force']);
  }
}