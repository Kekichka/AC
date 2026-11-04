import { readFileSync, writeFileSync } from 'node:fs';

type Line = { task_id: string; bucket: string; frozen_at: string; pass: boolean };
type Baseline = Record<string, { pow_k: number; k: number; frozen_at: string }>;

const K = Number(process.env.EVAL_K ?? 3);
const LOG_FILE = 'docs/lab3/evals.jsonl';
const BASELINE_FILE = 'docs/lab3/evals-baseline.json';

const lines: Line[] = readFileSync(LOG_FILE, 'utf8')
  .split(/\r?\n/)
  .filter((l) => l.trim() !== '')
  .map((l) => JSON.parse(l) as Line);

const now = new Map<string, { bucket: string; frozen_at: string; ok: number; n: number }>();
for (const l of lines) {
  const c = now.get(l.task_id) ?? { bucket: l.bucket, frozen_at: l.frozen_at, ok: 0, n: 0 };
  now.set(l.task_id, { ...c, ok: c.ok + (l.pass ? 1 : 0), n: c.n + 1 });
}

if (process.argv.includes('--write-baseline')) {
  const out: Baseline = {};
  for (const [id, c] of now) {
    out[id] = { pow_k: c.ok === c.n ? 1 : Number((c.ok / c.n).toFixed(2)), k: K, frozen_at: c.frozen_at };
  }
  writeFileSync(BASELINE_FILE, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`✓ Базовий рівень успішно записано у ${BASELINE_FILE} на ${now.size} задач!`);
  process.exit(0);
}

const base = JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) as Baseline;

const frozen = new Set([...now.values()].map((c) => c.frozen_at));
if (frozen.size !== 1) {
  console.error(`x Помилка: банк не заморожений: frozen_at = ${[...frozen].join(', ')}`);
  process.exit(1);
}

const broke: string[] = [];
for (const [id, c] of now) {
  if (c.bucket !== 'regression') continue; // edge та new не валять регресійну браму
  const was = base[id]?.pow_k ?? 0;
  const is = c.ok === c.n ? 1 : c.ok / c.n;
  if (was === 1 && is < 1) {
    broke.push(`${id}: було pass^${K}=1, стало ${c.ok}/${c.n}`);
  }
}

if (broke.length > 0) {
  console.error(`\n[РЕГРЕСІЯ]: Виявлено погіршення на ${broke.length} задачах:\n${broke.join('\n')}`);
  process.exit(1);
}

console.log(`\n[РЕГРЕСІЙНА БРАМА ЗЕЛЕНА]: Регресії відсутні. Перевірено ${now.size} задач (k=${K}).`);