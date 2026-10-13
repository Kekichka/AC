import { describe, expect, it } from 'vitest';
import { docsAtK, recallAtK, reciprocalRank, mean, proportionCI95, transitions, type Hit } from '../src/metrics';

describe('metrics', () => {
  const hits: Hit[] = [
    { docId: 'doc-01', chunkId: 'doc-01#0000' },
    { docId: 'doc-02', chunkId: 'doc-02#0001' },
    { docId: 'doc-01', chunkId: 'doc-01#0002' },
    { docId: 'doc-03', chunkId: 'doc-03#0003' },
  ];

  it('docsAtK видаляє повтори у топ-k', () => {
    expect(docsAtK(hits, 3)).toEqual(['doc-01', 'doc-02']);
    expect(docsAtK(hits, 4)).toEqual(['doc-01', 'doc-02', 'doc-03']);
  });

  it('recallAtK рахує частку знайдених must_cite', () => {
    expect(recallAtK(hits, ['doc-01'], 2)).toBe(1);
    expect(recallAtK(hits, ['doc-01', 'doc-03'], 2)).toBe(0.5);
    expect(recallAtK(hits, ['doc-01', 'doc-03'], 4)).toBe(1);
  });

  it('reciprocalRank рахує 1 / ранг першого влучання', () => {
    expect(reciprocalRank(hits, ['doc-01'], 4)).toBe(1); // ранг 1
    expect(reciprocalRank(hits, ['doc-02'], 4)).toBe(0.5); // ранг 2
    expect(reciprocalRank(hits, ['doc-03'], 4)).toBe(0.25); // ранг 4
    expect(reciprocalRank(hits, ['doc-99'], 4)).toBe(0); // не знайдено
  });

  it('mean рахує середнє', () => {
    expect(mean([1, 0.5, 0.25])).toBeCloseTo(0.5833, 3);
  });

  it('proportionCI95 рахує довірчий інтервал 95%', () => {
    const ci = proportionCI95(14, 17);
    expect(ci.p).toBeCloseTo(14 / 17, 3);
    expect(ci.halfWidth).toBeGreaterThan(0);
    expect(ci.lo).toBeLessThan(ci.p);
    expect(ci.hi).toBeGreaterThan(ci.p);
  });

  it('transitions групує зміни вердиктів', () => {
    const before = { 'q-01': 'wrong' as const, 'q-02': 'partial' as const };
    const after = { 'q-01': 'correct' as const, 'q-02': 'correct' as const };
    const res = transitions(before, after);
    expect(res).toHaveLength(2);
  });
});