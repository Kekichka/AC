import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    types: 'skipped',
    lint: 'skipped',
    tests: 'skipped',
    build: 'skipped',
    runUrl: '',
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--types') result.types = args[++i];
    if (args[i] === '--lint') result.lint = args[++i];
    if (args[i] === '--tests') result.tests = args[++i];
    if (args[i] === '--build') result.build = args[++i];
    if (args[i] === '--run-url') result.runUrl = args[++i];
  }
  return result;
}

const mapStatus = (s) => {
  if (s === 'success') return 'pass';
  if (s === 'failure') return 'fail';
  return s || 'skipped';
};

const args = parseArgs();

const gatesRecord = {
  recorded_at: new Date().toISOString(),
  run_url: args.runUrl || null,
  gates: {
    types: mapStatus(args.types),
    lint: mapStatus(args.lint),
    tests: mapStatus(args.tests),
    build: mapStatus(args.build),
  },
};

// Записуємо корінцевий файл для upload-artifact
writeFileSync('gate-record.json', JSON.stringify(gatesRecord, null, 2) + '\n', 'utf8');
console.log('✓ Збережено gate-record.json:', JSON.stringify(gatesRecord.gates));

// Оновлюємо поле gates у найсвіжішому run.json у docs/lab3/runs/, якщо тека існує
const runsBase = 'docs/lab3/runs';
if (existsSync(runsBase)) {
  const dirs = readdirSync(runsBase, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .reverse();

  if (dirs.length > 0) {
    const latestRunFile = join(runsBase, dirs[0], 'run.json');
    if (existsSync(latestRunFile)) {
      try {
        const runData = JSON.parse(readFileSync(latestRunFile, 'utf8'));
        runData.gates = gatesRecord.gates;
        writeFileSync(latestRunFile, JSON.stringify(runData, null, 2) + '\n', 'utf8');
        console.log(`✓ Оновлено поле gates у ${latestRunFile}`);
      } catch (err) {
        console.warn('Не вдалося оновити run.json:', err.message);
      }
    }
  }
}