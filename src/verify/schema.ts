import { z } from 'zod';

export const criterionVerdict = z
  .object({
    id: z.string().min(1),
    verdict: z.enum(['pass', 'fail', 'unknown']),
    reason: z.string().min(1),
    evidence: z.string(),
  })
  .strict();

export type CriterionVerdict = z.infer<typeof criterionVerdict>;

export const verifyReport = z
  .object({
    results: z.array(criterionVerdict).min(1),
  })
  .strict();

export type VerifyReport = z.infer<typeof verifyReport>;

export function isBlocked(report: VerifyReport): boolean {
  return report.results.some((r) => r.verdict === 'fail');
}