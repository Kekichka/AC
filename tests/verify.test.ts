import { describe, expect, it } from 'vitest';
import { criterionVerdict, verifyReport, isBlocked } from '../src/verify/schema';

describe('Verifier Schema & Gate', () => {
  it('validates a correct criterion verdict', () => {
    const valid = {
      id: 'A1',
      verdict: 'pass',
      reason: 'All tests pass successfully',
      evidence: 'tests/validate-golden.test.ts:10',
    };
    expect(criterionVerdict.safeParse(valid).success).toBe(true);
  });

  it('rejects an invalid verdict type', () => {
    const invalid = {
      id: 'A1',
      verdict: 'maybe',
      reason: 'Not sure',
      evidence: '',
    };
    expect(criterionVerdict.safeParse(invalid).success).toBe(false);
  });

  it('isBlocked returns true when at least one fail exists', () => {
    const report = {
      results: [
        { id: 'A1', verdict: 'pass' as const, reason: 'ok', evidence: 'f1:1' },
        { id: 'A2', verdict: 'fail' as const, reason: 'threshold breached', evidence: 'f2:2' },
      ],
    };
    expect(isBlocked(report)).toBe(true);
  });

  it('isBlocked returns false when only pass and unknown exist', () => {
    const report = {
      results: [
        { id: 'A1', verdict: 'pass' as const, reason: 'ok', evidence: 'f1:1' },
        { id: 'A2', verdict: 'unknown' as const, reason: 'no diff available', evidence: '' },
      ],
    };
    expect(isBlocked(report)).toBe(false);
  });
});