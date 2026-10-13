import type { IndexedChunk } from './store';

export function formatCitation(chunk: IndexedChunk): string {
  return `[${chunk.id}] ${chunk.docId} › ${chunk.heading || 'Main'} · chars ${chunk.start}–${chunk.end}`;
}

export function validateAnswer(answer: string, servedChunks: readonly { id: string }[]): string[] {
  const problems: string[] = [];
  const servedIds = new Set(servedChunks.map((c) => c.id));

  const matches = [...answer.matchAll(/\[([a-zA-Z0-9_-]+#[0-9]+)\]/g)];
  if (matches.length === 0) {
    problems.push('Відповідь не містить жодної цитати [docId#0000]');
    return problems;
  }

  for (const m of matches) {
    const citedId = m[1];
    if (citedId && !servedIds.has(citedId)) {
      problems.push(`Цитата на фрагмент [${citedId}], який не давали моделі в контексті`);
    }
  }

  return problems;
}