import { describe, expect, it } from 'vitest';
import { rrf } from '../src/rag/rrf';
import { buildBm25, searchBm25, tokenize } from '../src/rag/bm25';
import { validateAnswer } from '../src/rag/cite';
import type { IndexedChunk } from '../src/rag/store';

describe('rrf', () => {
  it('відтворює приклад із методички', () => {
    const fused = rrf([['A', 'B', 'C'], ['C', 'A', 'D']]);
    expect(fused.map((r) => r.id)).toEqual(['A', 'C', 'B', 'D']);
    expect(fused[0]!.score).toBeCloseTo(1 / 61 + 1 / 62, 10);
    expect(fused[0]!.score).toBeGreaterThan(fused[1]!.score);
  });

  it('ранги рахуються з одиниці', () => {
    expect(rrf([['A']])[0]!.score).toBeCloseTo(1 / 61, 10);
  });

  it('відсутній у списку документ не додає нічого', () => {
    expect(rrf([['A', 'B'], ['A']]).find((r) => r.id === 'B')!.score).toBeCloseTo(1 / 62, 10);
  });
});

describe('bm25', () => {
  const docs = [
    { id: 'c-1', text: 'Помилка E-418 означає, що формат заявки не підтримується.' },
    { id: 'c-2', text: 'Відмова у реєстрації оскаржується протягом тридцяти днів.' },
    { id: 'c-3', text: 'Заявка подається через особистий кабінет.' },
  ];
  const index = buildBm25(docs);

  it('бачить кирилицю', () => {
    expect(tokenize('Помилка E-418')).toEqual(['помилка', '418']);
  });

  it('знаходить рідкісний точний рядок', () => {
    expect(searchBm25(index, 'E-418')[0]!.id).toBe('c-1');
  });

  it('нічого не повертає, коли спільних слів немає', () => {
    expect(searchBm25(index, 'куди звертатися після відхилення')).toEqual([]);
  });
});

describe('validateAnswer', () => {
  const served = [{ id: 'mcp-arch-01#0000' }] as unknown as IndexedChunk[];

  it('ловить відповідь без цитати', () => {
    expect(validateAnswer('Тридцять днів.', served).join(' ')).toContain('не містить жодної цитати');
  });

  it('ловить цитату на невидане', () => {
    expect(validateAnswer('Тридцять днів [mcp-other#0001].', served).join(' ')).toContain('не давали');
  });

  it('приймає цитату на видане', () => {
    expect(validateAnswer('Відповідь з цитатою [mcp-arch-01#0000].', served)).toEqual([]);
  });
});