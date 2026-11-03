import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { geminiRunner, runTask, type Task } from './run-task';

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

for (const task of tasks) {
  const branch = `harness/${task.id}`;
  const tree = join('..', 'harness-runs', task.id);

  // Створюємо ізольоване дерево
  console.log(`\n▶ Створення git worktree для ${task.id} (${tree})...`);
  git(['worktree', 'add', '-b', branch, tree, 'main']);

  try {
    const rec = runTask(task, {
      runner: geminiRunner,
      agentPath: 'gemini-cli',
      worktree: tree,
      outDir: 'runs',
    });

    const keep = join('docs', 'lab3', 'runs', `${task.id}-${new Date(rec.started_at).getTime()}`);
    mkdirSync(keep, { recursive: true });
    cpSync(rec.artifact_dir, keep, { recursive: true });

    console.log(`${task.id}: ${rec.exit_status}, acceptance ${rec.acceptance_passed ? 'pass' : 'fail'} → ${keep}`);
  } finally {
    git(['worktree', 'remove', tree, '--force']);
  }
}