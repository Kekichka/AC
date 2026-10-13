import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chunkDocument, normalize, RULE } from '../src/rag/chunk';
import { fakeEmbedder, ollamaEmbedder } from '../src/rag/embed';
import { saveIndex, sha256, type DocumentRecord, type IndexedChunk, type IndexFile } from '../src/rag/store';

async function main() {
  const corpusDir = 'corpus';
  const outPath = 'data/index.json';

  const files = readdirSync(corpusDir).filter((f) => f.endsWith('.md') || f.endsWith('.txt')).sort();
  console.log(`Знайдено ${files.length} документів у ${corpusDir}/`);

  const documents: DocumentRecord[] = [];
  const allChunksToEmbed: { docId: string; heading: string; start: number; end: number; text: string }[] = [];

  for (const filename of files) {
    const docId = filename.replace(/\.(md|txt)$/, '');
    const path = join(corpusDir, filename);
    const raw = readFileSync(path, 'utf8');
    const norm = normalize(raw);
    const hash = sha256(norm);

    documents.push({ id: docId, path, sha256: hash, lengthChars: norm.length });

    const chunks = chunkDocument(docId, raw, RULE);
    for (const c of chunks) {
      allChunksToEmbed.push({ docId: c.docId, heading: c.heading, start: c.start, end: c.end, text: c.text });
    }
    console.log(`  ${docId}: ${norm.length} симв. → ${chunks.length} фрагм.`);
  }

  // Використовуємо детермінований FNV 768-вимірний ембедер (працює офлайн без зовнішніх залежностей)
  const embedder = fakeEmbedder(768);
  console.log(`\nРозрахунок ембедінгів для ${allChunksToEmbed.length} фрагментів (${embedder.id}, 768 вимірів)...`);

  const texts = allChunksToEmbed.map((c) => c.text);
  const vectors = await embedder.embedDocuments(texts);
const indexedChunks: IndexedChunk[] = allChunksToEmbed.map((c, i) => ({
    id: `${c.docId}#${String(i).padStart(4, '0')}`,
    docId: c.docId,
    heading: c.heading,
    start: c.start,
    end: c.end,
    text: c.text,
    vector: vectors[i] ?? new Array<number>(embedder.dimensions).fill(0),
  }));

  const indexFile: IndexFile = {
    version: 'v1',
    embedder: embedder.id,
    dimensions: embedder.dimensions,
    rule: RULE,
    documents,
    chunks: indexedChunks,
    createdAt: new Date().toISOString(),
  };

  saveIndex(outPath, indexFile);
  console.log(`\nІндекс успішно збережено у ${outPath}!`);
  console.log(`Документів: ${documents.length}`);
  console.log(`Фрагментів: ${indexedChunks.length}`);
}

main().catch(console.error);