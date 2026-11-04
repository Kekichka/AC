import { describe, expect, it } from 'vitest';
import { criterionVerdict, verifyReport, isBlocked } from '../src/verify/schema';

describe('Verifier Schema & Gate (Крок 02)', () => {
  it('валідує коректний вердикт критерію', () => {
    const valid = {
      id: 'A1',
      verdict: 'pass',
      reason: 'All tests pass successfully',
      evidence: 'tests/validate-golden.test.ts:10',
    };
    expect(criterionVerdict.safeParse(valid).success).toBe(true);
  });

  it('відхиляє невалідний тип вердикту', () => {
    const invalid = {
      id: 'A1',
      verdict: 'maybe',
      reason: 'Not sure',
      evidence: '',
    };
    expect(criterionVerdict.safeParse(invalid).success).toBe(false);
  });

  it('isBlocked повертає true, якщо є хоч один fail', () => {
    const report = {
      results: [
        { id: 'A1', verdict: 'pass' as const, reason: 'ok', evidence: 'f1:1' },
        { id: 'A2', verdict: 'fail' as const, reason: 'threshold breached', evidence: 'f2:2' },
      ],
    };
    expect(isBlocked(report)).toBe(true);
  });

  it('isBlocked повертає true, якщо є статус unknown (сувора брама харнеса)', () => {
    const report = {
      results: [
        { id: 'A1', verdict: 'pass' as const, reason: 'ok', evidence: 'f1:1' },
        { id: 'A2', verdict: 'unknown' as const, reason: 'no diff available', evidence: '' },
      ],
    };
    // У харнесі unknown теж блокує злиття!
    expect(isBlocked(report)).toBe(true);
  });

  it('isBlocked повертає false тільки коли ВСІ вердикти pass', () => {
    const report = {
      results: [
        { id: 'A1', verdict: 'pass' as const, reason: 'ok', evidence: 'f1:1' },
        { id: 'A2', verdict: 'pass' as const, reason: 'tests green', evidence: 'f2:2' },
      ],
    };
    expect(isBlocked(report)).toBe(false);
  });
});