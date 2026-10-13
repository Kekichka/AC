import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalize } from '../src/rag/chunk';
import type { IndexFile } from '../src/rag/store';
import { sha256 } from '../src/rag/store';

describe('data/index.json', () => {
  it('перевіряє наявність зібраного індексу та його структуру', () => {
    expect(existsSync('data/index.json')).toBe(true);
    const index = JSON.parse(readFileSync('data/index.json', 'utf8')) as IndexFile;

    expect(index.documents.length).toBeGreaterThanOrEqual(10);
    expect(index.documents.length).toBeLessThanOrEqual(40);
    expect(index.dimensions).toBe(768);

    for (const c of index.chunks) {
      expect(c.vector.length).toBe(index.dimensions);
    }

    const texts = new Map(index.documents.map((d) => [d.id, normalize(readFileSync(d.path, 'utf8'))]));
    for (const c of index.chunks) {
      const text = texts.get(c.docId);
      expect(text, `немає документа ${c.docId}`).toBeDefined();
      expect(text!.slice(c.start, c.end)).toBe(c.text);
    }

    for (const d of index.documents) {
      expect(sha256(normalize(readFileSync(d.path, 'utf8'))), `${d.id} змінився — npm run index`).toBe(d.sha256);
    }
  });
});
