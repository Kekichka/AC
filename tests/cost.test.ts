import { describe, it, expect } from 'vitest';
import {
  addUsage,
  fromMessagesUsage,
  fromChatUsage,
  fromGeminiUsage,
  errorPct,
  withinTolerance,
  languageMultiplier,
  priceUsd,
  costTableRow,
  COST_TABLE_HEADER,
  ZERO_USAGE,
  type CostRow,
} from '../src/cost';
import { specFor, estimateCost } from '../src/models';

describe('src/cost.ts', () => {
  it('коректно додає usage об’єкти', () => {
    const a = { inputTokens: 100, cachedTokens: 40, outputTokens: 20 };
    const b = { inputTokens: 50, cachedTokens: 10, outputTokens: 30 };
    expect(addUsage(a, b)).toEqual({
      inputTokens: 150,
      cachedTokens: 50,
      outputTokens: 50,
    });
    expect(addUsage(ZERO_USAGE, a)).toEqual(a);
  });

  describe('нормалізація різних форм API', () => {
    it('fromMessagesUsage: рахує повний вхід як input_tokens + cached + creation', () => {
      const u = fromMessagesUsage({
        input_tokens: 100,
        output_tokens: 50,
        cache_read_input_tokens: 40,
        cache_creation_input_tokens: 10,
      });
      expect(u.inputTokens).toBe(150);
      expect(u.cachedTokens).toBe(40);
      expect(u.outputTokens).toBe(50);
    });

    it('fromChatUsage: prompt_tokens уже містить кешовані токени', () => {
      const u = fromChatUsage({
        prompt_tokens: 200,
        completion_tokens: 45,
        prompt_tokens_details: { cached_tokens: 80 },
      });
      expect(u.inputTokens).toBe(200);
      expect(u.cachedTokens).toBe(80);
      expect(u.outputTokens).toBe(45);
    });

    it('fromGeminiUsage: promptTokenCount уже містить кешовані, а думки тарифікуються як вихід', () => {
      const u = fromGeminiUsage({
        promptTokenCount: 300,
        candidatesTokenCount: 60,
        cachedContentTokenCount: 120,
        thoughtsTokenCount: 15,
      });
      expect(u.inputTokens).toBe(300);
      expect(u.cachedTokens).toBe(120);
      expect(u.outputTokens).toBe(75);
    });
  });

  describe('похибка та толерантність', () => {
    it('рахує відносну похибку у відсотках', () => {
      expect(errorPct(105, 100)).toBeCloseTo(5.0);
      expect(errorPct(95, 100)).toBeCloseTo(5.0);
      expect(errorPct(100, 100)).toBe(0);
      expect(() => errorPct(10, 0)).toThrow(RangeError);
    });

    it('withinTolerance перевіряє входження в ліміт 10%', () => {
      expect(withinTolerance(108, 100, 10)).toBe(true);
      expect(withinTolerance(112, 100, 10)).toBe(false);
    });

    it('languageMultiplier розраховує співвідношення токенів', () => {
      expect(languageMultiplier(150, 100)).toBe(1.5);
      expect(() => languageMultiplier(150, 0)).toThrow(RangeError);
    });
  });

  describe('розрахунок вартості за прайсом models.ts', () => {
    it('priceUsd збігається з estimateCost для cheap ролі', () => {
      const spec = specFor('cheap');
      const usage = { inputTokens: 1_000_000, cachedTokens: 0, outputTokens: 500_000 };
      const calculated = priceUsd(spec, usage);
      const estimated = estimateCost('cheap', 1_000_000, 500_000);
      expect(calculated).toBeCloseTo(estimated, 6);
    });

    it('генерує валідний рядок таблиці costTableRow', () => {
      const row: CostRow = {
        run: 'тест-1',
        provider: 'Google',
        model: 'gemini-3.8-flash',
        usage: { inputTokens: 1000, cachedTokens: 0, outputTokens: 200 },
        estimatedInput: 1020,
        actualUsd: 0,
        listUsd: 0.0002,
        latencyMs: 345,
        date: '2026-09-23',
      };
      const formatted = costTableRow(row);
      expect(formatted).toContain('| тест-1 | Google | gemini-3.8-flash |');
      expect(COST_TABLE_HEADER).toContain('| прогін | провайдер |');
    });
  });
});
