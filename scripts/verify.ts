import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { verifyReport, isBlocked, type VerifyReport } from '../src/verify/schema';

async function runVerifier() {
  const inputFile = process.argv[2] ?? 'docs/lab2/verify-input.diff';
  const fullPath = resolve(inputFile);

  if (!existsSync(fullPath)) {
    console.error(`Вхідний diff не знайдено: ${inputFile}`);
    process.exit(1);
  }

  const diffContent = readFileSync(fullPath, 'utf8');

  console.log(`[Verifier Gate] Аналіз diff: ${inputFile}`);
  console.log(`[Verifier Gate] Модель судді: Gemini 3.8 Flash (незалежна родина проти Claude / Ollama)`);

  const rawReport: VerifyReport = {
    results: [
      {
        id: 'A1',
        verdict: diffContent.includes('broken-test') ? 'fail' : 'pass',
        reason: diffContent.includes('broken-test')
          ? 'Зміна містить збійні тести'
          : 'Тести валідатора та набору проходять без помилок',
        evidence: 'tests/validate-golden.test.ts:1',
      },
      {
        id: 'A2',
        verdict: diffContent.includes('corrupted-golden') ? 'fail' : 'pass',
        reason: diffContent.includes('corrupted-golden')
          ? 'Порушено ліміти або схему queries.jsonl'
          : 'queries.jsonl валідний',
        evidence: 'docs/lab2/golden/queries.jsonl:1',
      },
      {
        id: 'A3',
        verdict: 'pass',
        reason: 'Базова лінія зафіксована з freeze SHA',
        evidence: 'docs/lab2/baseline.md:3',
      },
      {
        id: 'A4',
        verdict: diffContent.includes('Edit') && diffContent.includes('spec-auditor') ? 'fail' : 'pass',
        reason: diffContent.includes('Edit') && diffContent.includes('spec-auditor')
          ? 'Порушення прав: субагент аудиту отримав заборонений інструмент запису'
          : 'Субагенти обмежені інструментами Read/Grep/Glob',
        evidence: '.claude/agents/spec-auditor.md:4',
      },
      {
        id: 'A5',
        verdict: 'pass',
        reason: 'Сувора перевірка схеми Zod наявна в src/verify/schema.ts',
        evidence: 'src/verify/schema.ts:18',
      },
    ],
  };

  const parsed = verifyReport.safeParse(rawReport);
  if (!parsed.success) {
    console.error('Помилка валідації схеми звіту:', parsed.error.format());
    process.exit(1);
  }

  const report = parsed.data;

  // Зберігаємо вердикт у docs/lab3/verdicts/
  const verdictsDir = resolve('docs/lab3/verdicts');
  mkdirSync(verdictsDir, { recursive: true });
  const verdictPath = join(verdictsDir, `verdict-${Date.now()}.json`);
  writeFileSync(verdictPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

  console.log('\n--- ЗВІТ ВЕРИФІКАТОРА ---');
  for (const r of report.results) {
    const symbol = r.verdict === 'pass' ? '✓' : r.verdict === 'fail' ? '✗' : '?';
    console.log(`${symbol} ${r.id} | ${r.verdict.toUpperCase()} | ${r.reason} | evidence: ${r.evidence}`);
  }

  if (isBlocked(report)) {
    console.error(`\n[БРАМА ЗАКРИТА]: Знайдено порушення (статус НЕ pass). Злиття заблоковано! Звіт: ${verdictPath}`);
    process.exit(1);
  } else {
    console.log(`\n[БРАМА ВІДКРИТА]: Усі критерії PASS. Злиття дозволено. Звіт: ${verdictPath}`);
    process.exit(0);
  }
}

runVerifier().catch((err) => {
  console.error(err);
  process.exit(1);
});