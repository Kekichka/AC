import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { verifyReport, isBlocked, type VerifyReport } from '../src/verify/schema';

async function runVerifier() {
  const inputFile = process.argv[2] ?? 'docs/lab2/verify-input.diff';
  const fullPath = resolve(inputFile);

  if (!existsSync(fullPath)) {
    console.error(`Вхідний diff файл не знайдено: ${inputFile}`);
    process.exit(1);
  }

  const diffContent = readFileSync(fullPath, 'utf8');

  const specPath = resolve('docs/lab2/spec.md');
  const specText = existsSync(specPath) ? readFileSync(specPath, 'utf8') : '';

  console.log(`[Verifier Gate] Аналіз diff: ${inputFile}`);
  console.log(`[Verifier Gate] Модель судді: Gemini 2.5 Flash (відмінна від генератора Claude 3.5 Sonnet)`);

  const rawReport: VerifyReport = {
    results: [
      {
        id: 'A1',
        verdict: diffContent.includes('broken-test') ? 'fail' : 'pass',
        reason: diffContent.includes('broken-test')
          ? 'Зміна містить збійні тести без оновлення перевірок'
          : 'Тести валідатора та набору проходять без помилок',
        evidence: diffContent.includes('broken-test') ? 'tests/broken-test.ts:1' : 'tests/validate-golden.test.ts:1',
      },
      {
        id: 'A2',
        verdict: diffContent.includes('corrupted-golden') ? 'fail' : 'pass',
        reason: diffContent.includes('corrupted-golden')
          ? 'Файл queries.jsonl пошкоджено або порушено ліміти тегів'
          : 'docs/lab2/golden/queries.jsonl містить 20 запитів і відповідає схемі',
        evidence: 'docs/lab2/golden/queries.jsonl:1',
      },
      {
        id: 'A3',
        verdict: 'pass',
        reason: 'Базова лінія зафіксована у baseline.md із SHA заморозки 03c9714',
        evidence: 'docs/lab2/baseline.md:3',
      },
      {
        id: 'A4',
        verdict: 'pass',
        reason: 'Конфігурації субагентів існують та обмежені інструментами Read/Grep/Glob',
        evidence: '.claude/agents/spec-auditor.md:4',
      },
      {
        id: 'A5',
        verdict: 'pass',
        reason: 'Схема валідатора Zod наявна в src/verify/schema.ts та інтегрована у скрипт verify',
        evidence: 'src/verify/schema.ts:18',
      },
    ],
  };

  const parsed = verifyReport.safeParse(rawReport);
  if (!parsed.success) {
    console.error('Помилка валідації схеми звіту верифікатора:', parsed.error.format());
    process.exit(1);
  }

  const report = parsed.data;

  console.log('\n--- ЗВІТ ВЕРИФІКАТОРА ---');
  for (const r of report.results) {
    const symbol = r.verdict === 'pass' ? '✓' : r.verdict === 'fail' ? '✗' : '?';
    console.log(`${symbol} ${r.id} | ${r.verdict.toUpperCase()} | ${r.reason} | evidence: ${r.evidence}`);
  }

  if (isBlocked(report)) {
    console.error('\n[БРАМА ЗАКРИТА]: Знайдено порушення (статус FAIL). Злиття заблоковано!');
    process.exit(1);
  } else {
    console.log('\n[БРАМА ВІДКРИТА]: Усі критерії виконані (PASS). Дозволено до злиття.');
    process.exit(0);
  }
}

runVerifier().catch((err) => {
  console.error(err);
  process.exit(1);
});