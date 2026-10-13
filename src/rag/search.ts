import { loadIndex, type IndexFile, type IndexedChunk } from './store';
import { buildBm25, searchBm25, type Bm25Index } from './bm25';
import { rrf } from './rrf';
import { fakeEmbedder } from './embed';

export interface SearchResult {
  readonly chunk: IndexedChunk;
  readonly rrfScore: number;
  readonly vectorRank: number | null;
  readonly bm25Rank: number | null;
}

export interface HybridSearchResult {
  readonly isRefusal: boolean;
  readonly refusalReason?: string;
  readonly results: SearchResult[];
  readonly vectorTop: { id: string; score: number }[];
  readonly bm25Top: { id: string; score: number }[];
}

export function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

export class HybridSearchEngine {
  private index: IndexFile;
  private bm25: Bm25Index;
  private chunkMap: Map<string, IndexedChunk>;
  private embedder = fakeEmbedder(768);

  constructor(indexPath = 'data/index.json') {
    this.index = loadIndex(indexPath);
    this.chunkMap = new Map(this.index.chunks.map((c) => [c.id, c]));
    this.bm25 = buildBm25(this.index.chunks.map((c) => ({ id: c.id, text: c.text })));
  }

  async search(query: string, topK = 5): Promise<HybridSearchResult> {
    const queryVector = await this.embedder.embedQuery(query);

    // 1. Векторна гілка (топ-20)
    const vectorScores = this.index.chunks
      .map((c) => ({ id: c.id, score: cosineSimilarity(queryVector, c.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    // 2. Гілка BM25 (топ-20)
    const bm25Scores = searchBm25(this.bm25, query, 20);

    // Відмова для unanswerable
    const topVectorScore = vectorScores[0]?.score ?? 0;
    const isRefusal = bm25Scores.length === 0 && topVectorScore < 0.15;

    if (isRefusal) {
      return {
        isRefusal: true,
        refusalReason: 'Запит відхилено: інформація відсутня в колекції документів (0 слів у BM25)',
        results: [],
        vectorTop: vectorScores,
        bm25Top: bm25Scores,
      };
    }

    // 3. Злиття RRF
    const vectorIds = vectorScores.map((v) => v.id);
    const bm25Ids = bm25Scores.map((b) => b.id);
    const fused = rrf([vectorIds, bm25Ids]).slice(0, topK);

    const results: SearchResult[] = fused.map((f) => {
      const vRank = vectorIds.indexOf(f.id);
      const bRank = bm25Ids.indexOf(f.id);
      return {
        chunk: this.chunkMap.get(f.id)!,
        rrfScore: f.score,
        vectorRank: vRank >= 0 ? vRank + 1 : null,
        bm25Rank: bRank >= 0 ? bRank + 1 : null,
      };
    });

    return {
      isRefusal: false,
      results,
      vectorTop: vectorScores,
      bm25Top: bm25Scores,
    };
  }
}