export interface ChunkRule {
  readonly maxChars: number;
  readonly minChars: number;
  readonly overlapChars: number;
}

export const RULE: ChunkRule = { maxChars: 1200, minChars: 200, overlapChars: 120 };

export interface Chunk {
  readonly id: string;
  readonly docId: string;
  readonly heading: string;
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

export function normalize(raw: string): string {
  return raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '');
}

interface Span {
  start: number;
  end: number;
}

function sections(text: string): { heading: string; span: Span }[] {
  const out: { heading: string; span: Span }[] = [];
  const path: string[] = [];
  let current = { heading: '', start: 0 };
  let offset = 0;
  for (const line of text.split('\n')) {
    const m = /^(#{1,6})\s+(.+)$/.exec(line);
    if (m) {
      if (offset > current.start) out.push({ heading: current.heading, span: { start: current.start, end: offset } });
      const level = m[1].length;
      path.length = level - 1;
      path[level - 1] = m[2].trim();
      current = { heading: path.filter(Boolean).join(' › '), start: offset };
    }
    offset += line.length + 1; // +1 — це '\n'
  }
  out.push({ heading: current.heading, span: { start: current.start, end: text.length } });
  return out.filter((s) => text.slice(s.span.start, s.span.end).trim() !== '');
}

function lastBoundary(window: string, re: RegExp): number | null {
  let found: number | null = null;
  for (const m of window.matchAll(re)) found = (m.index ?? 0) + m[0].length;
  return found !== null && found > window.length / 2 ? found : null;
}

function split(text: string, span: Span, rule: ChunkRule): Span[] {
  const pieces: Span[] = [];
  let start = span.start;
  while (span.end - start > rule.maxChars) {
    const window = text.slice(start, start + rule.maxChars);
    const cut =
      lastBoundary(window, /\n{2,}/g) ??        // 1. порожній рядок
      lastBoundary(window, /[.!?…»]\s/g) ??     // 2. кінець речення
      lastBoundary(window, /\s/g) ??            // 3. хоч пробіл
      rule.maxChars;                            // 4. різати всередині слова
    const end = start + cut;
    pieces.push({ start, end });
    const back = Math.max(end - rule.overlapChars, start + 1);
    const ws = text.slice(back, end).search(/\s/);
    start = ws > 0 ? back + ws + 1 : back;
  }
  pieces.push({ start, end: span.end });
  return pieces;
}

export function chunkDocument(docId: string, raw: string, rule: ChunkRule = RULE): Chunk[] {
  const text = normalize(raw);
  const parts: { heading: string; span: Span }[] = [];
  for (const section of sections(text)) {
    for (const span of split(text, section.span, rule)) parts.push({ heading: section.heading, span });
  }

  const merged: { heading: string; span: Span }[] = [];
  for (const part of parts) {
    const prev = merged[merged.length - 1];
    const short = part.span.end - part.span.start < rule.minChars;
    const fits = prev !== undefined && part.span.end - prev.span.start <= rule.maxChars + rule.overlapChars;
    if (prev !== undefined && short && fits && prev.heading === part.heading) {
      merged[merged.length - 1] = { heading: prev.heading, span: { start: prev.span.start, end: part.span.end } };
    } else {
      merged.push(part);
    }
  }

  return merged.map((part, i) => ({
    id: `${docId}#${String(i).padStart(4, '0')}`,
    docId,
    heading: part.heading,
    start: part.span.start,
    end: part.span.end,
    text: text.slice(part.span.start, part.span.end),
  }));
}