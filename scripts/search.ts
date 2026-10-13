import { HybridSearchEngine } from '../src/rag/search';
import { formatCitation } from '../src/rag/cite';

async function main() {
  const query = process.argv[2] ?? 'MCP transports stdio SSE';
  const explain = process.argv.includes('--explain');

  const engine = new HybridSearchEngine();
  const res = await engine.search(query, 5);

  console.log(`\nЗапит: "${query}"`);

  if (res.isRefusal) {
    console.log(`[ВІДМОВА]: ${res.refusalReason}`);
    return;
  }

  if (explain) {
    console.log('\n--- ПОЯСНЕННЯ РАНЖУВАННЯ (--explain) ---');
    console.log('Вектор (Top 3):', res.vectorTop.slice(0, 3).map((v, i) => `${i + 1}. ${v.id} (${v.score.toFixed(4)})`).join(' | '));
    console.log('BM25 (Top 3):  ', res.bm25Top.length > 0 ? res.bm25Top.slice(0, 3).map((b, i) => `${i + 1}. ${b.id} (${b.score.toFixed(2)})`).join(' | ') : 'порожньо: жодного спільного слова');
    console.log('----------------------------------------\n');
  }

  console.log('Топ-5 результатів гібридного пошуку з цитуваннями:');
  res.results.forEach((r, i) => {
    console.log(`${i + 1}. ${formatCitation(r.chunk)} | RRF: ${r.rrfScore.toFixed(5)}`);
    console.log(`   Уривок: "${r.chunk.text.slice(0, 100)}..."\n`);
  });
}

main().catch(console.error);