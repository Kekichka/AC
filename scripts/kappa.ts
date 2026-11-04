export type Label = 'pass' | 'fail' | 'unknown';
export const LABELS: Label[] = ['pass', 'fail', 'unknown'];

export interface AgreementResult {
  readonly n: number;
  readonly raw: number;
  readonly expected: number;
  readonly kappa: number;
}

/** mine[i] — мій ручний вердикт, judge[i] — вердикт верифікатора. */
export function agreement(mine: readonly Label[], judge: readonly Label[]): AgreementResult {
  const n = mine.length;
  if (n === 0 || n !== judge.length) throw new Error('різна довжина розмітки або порожній набір');

  // сира згода: частка точних збігів
  const po = mine.filter((m, i) => m === judge[i]).length / n;

  // очікувана випадкова згода: сума добутків маргінальних часток
  const pe = LABELS.reduce((acc, l) => {
    const pm = mine.filter((x) => x === l).length / n;
    const pj = judge.filter((x) => x === l).length / n;
    return acc + pm * pj;
  }, 0);

  // каппа Коена (Cohen's Kappa)
  const kappa = pe === 1 ? 1 : (po - pe) / (1 - pe);
  return { n, raw: po, expected: pe, kappa };
}

if (process.argv[1]?.endsWith('kappa.ts')) {
  // Демонстрація розрахунку для 10 випадків калібрування
  const humanLabels: Label[] = ['pass', 'pass', 'pass', 'pass', 'fail', 'fail', 'fail', 'unknown', 'pass', 'pass'];
  const judgeLabels: Label[] = ['pass', 'pass', 'pass', 'pass', 'fail', 'fail', 'unknown', 'unknown', 'pass', 'pass'];

  const res = agreement(humanLabels, judgeLabels);
  console.log('--- Калібрування судді (Каппа Коена) ---');
  console.log(`Випадків (N):            ${res.n}`);
  console.log(`Сира згода (Po):         ${(res.raw * 100).toFixed(1)}%`);
  console.log(`Випадкова згода (Pe):    ${(res.expected * 100).toFixed(1)}%`);
  console.log(`Каппа Коена (Kappa):     ${res.kappa.toFixed(3)}`);
}