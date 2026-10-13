/**
 * МЕТРИКИ ПОШУКУ (крок 06).
 * Визначення: Manning, Raghavan, Schütze, «Introduction to Information Retrieval», 2008;
 * MRR — TREC-8 QA Track (Voorhees, NIST, 2000).
 */

export interface Hit {
  readonly docId: string;
  readonly chunkId: string;
}

export type Verdict = 'correct' | 'partial' | 'wrong' | 'refused';

export function docsAtK(hits: readonly Hit[], k: number): string[] {
  const out: string[] = [];
  for (const hit of hits.slice(0, k)) {
    if (!out.includes(hit.docId)) out.push(hit.docId);
  }
  return out;
}

export function recallAtK(hits: readonly Hit[], mustCite: readonly string[], k: number): number {
  if (mustCite.length === 0) {
    throw new RangeError('recall@k не визначено для запиту з порожнім must_cite');
  }
  const found = docsAtK(hits, k).filter((id) => mustCite.includes(id)).length;
  return found / mustCite.length;
}

export function reciprocalRank(hits: readonly Hit[], mustCite: readonly string[], k: number): number {
  if (mustCite.length === 0) {
    throw new RangeError('MRR не визначено для запиту з порожнім must_cite');
  }
  const i = hits.slice(0, k).findIndex((hit) => mustCite.includes(hit.docId));
  return i === -1 ? 0 : 1 / (i + 1);
}

export function mean(values: readonly number[]): number {
  if (values.length === 0) {
    throw new RangeError('середнє порожнього переліку не визначено');
  }
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function proportionCI95(successes: number, n: number): { p: number; halfWidth: number; lo: number; hi: number } {
  if (!Number.isInteger(n) || n <= 0) throw new RangeError('n має бути цілим числом, більшим за нуль');
  if (!Number.isInteger(successes) || successes < 0 || successes > n) {
    throw new RangeError('successes має бути цілим від 0 до n');
  }
  const p = successes / n;
  const halfWidth = 1.96 * Math.sqrt((p * (1 - p)) / n);
  return { p, halfWidth, lo: Math.max(0, p - halfWidth), hi: Math.min(1, p + halfWidth) };
}

export function transitions(
  before: Readonly<Record<string, Verdict>>,
  after: Readonly<Record<string, Verdict>>,
): { from: Verdict; to: Verdict; ids: string[] }[] {
  const buckets = new Map<string, { from: Verdict; to: Verdict; ids: string[] }>();
  for (const id of Object.keys(before)) {
    const to = after[id];
    const from = before[id];
    if (from === undefined || to === undefined) continue;
    const key = `${from}→${to}`;
    const bucket = buckets.get(key) ?? { from, to, ids: [] };
    bucket.ids.push(id);
    buckets.set(key, bucket);
  }
  return [...buckets.values()].sort((a, b) => b.ids.length - a.ids.length);
}