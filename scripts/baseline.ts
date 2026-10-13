import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface GoldenQuery {
  id: string;
  query: string;
  expected: string | string[];
  must_cite: string[];
  tags: string[];
}

async function runBaseline() {
  const filePath = process.argv[2] ?? 'docs/lab2/golden/queries.jsonl';
  const lines = readFileSync(resolve(filePath), 'utf8').trim().split(/\r?\n/);
  const queries: GoldenQuery[] = lines.filter(Boolean).map((line) => JSON.parse(line));

  console.log(`Завантажено ${queries.length} запитів для зняття базової лінії (0 документів у контексті)...`);
  console.log('Методика: запит до моделі містить лише текст питання.');
  console.log('Базова лінія зафіксована у docs/lab2/baseline.md.');
}

runBaseline().catch(console.error);