export interface Embedder {
  readonly id: string;
  readonly dimensions: number;
  embedDocuments(texts: readonly string[]): Promise<number[][]>;
  embedQuery(text: string): Promise<number[]>;
}

/** Детермінований ембедер на FNV-1a хідшах для тестів і відтворюваності в CI */
export function fakeEmbedder(dimensions = 768): Embedder {
  const vector = (text: string): number[] => {
    const v = new Array<number>(dimensions).fill(0);
    const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
    for (const word of words) {
      let h = 2166136261;
      for (let i = 0; i < word.length; i += 1) {
        h ^= word.charCodeAt(i);
        h = Math.imul(h, 16777619);
      }
      v[Math.abs(h) % dimensions] += 1;
    }
    const norm = Math.hypot(...v) || 1;
    return v.map((x) => x / norm);
  };

  return {
    id: `fake:fnv@${dimensions}`,
    dimensions,
    embedDocuments: async (texts) => texts.map(vector),
    embedQuery: async (text) => vector(text),
  };
}

/** Локальна Ollama (якщо встановлена локально) */
export function ollamaEmbedder(model = 'embeddinggemma-2:270m', dimensions = 768): Embedder {
  const base = process.env.OLLAMA_URL ?? 'http://localhost:11434';
  const call = async (input: readonly string[]): Promise<number[][]> => {
    const res = await fetch(`${base}/api/embed`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, input, dimensions, truncate: false }),
    });
    if (!res.ok) throw new Error(`/api/embed ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { embeddings: number[][] };
    return data.embeddings;
  };

  return {
    id: `ollama:${model}`,
    dimensions,
    embedDocuments: call,
    embedQuery: async (text) => (await call([text]))[0],
  };
}