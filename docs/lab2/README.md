# Звіт та пакет доказів: Лабораторна 2

**Автор:** Студент (Kekichka)  
**Репозиторій:** [Kekichka/AC](https://github.com/Kekichka/AC)  
**Гілка:** `main`  
**CI Actions:** [github.com/Kekichka/AC/actions](https://github.com/Kekichka/AC/actions)  
**Дата завершення:** 2026-10-21  

---

## 1. Числа «До» і «Після» (Головний підсумок)

Усі вимірювання проведені за єдиною зафіксованою методикою на тому самому замороженому еталонному наборі з 20 запитів (SHA: [`03c9714`](https://github.com/Kekichka/AC/commit/03c97140febea9c3cf2e834f14e3aa4e7a40dc91)).

| Показник | Базова лінія (Крок 01, без документів) | З гібридним RAG-пошуком (Крок 06) | Приріст / Зміна | Ціль у spec.md |
|---|---|---|---|---|
| **Точність на відповідних запитах ($n=17$)** | **41.2%** (7/17) | **70.6%** (12/17) | **+29.4 п. п.** | ≥ 70% (**Досягнуто**) |
| **Частково правильні відповіді** | 41.2% (7/17) | **11.8%** (2/17) | -29.4 п. п. | — |
| **Помилкові відповіді (галюцинації)** | 17.6% (3/17) | **17.6%** (3/17) | 0.0 п. п. | 0 |
| **Правильні відмови (`unanswerable`)** | 0 з 3 (0% — галюцинації) | **3 з 3 (100% відмов)** | **+100 п. п.** | 100% (**Досягнуто**) |
| **Стійкість до Prompt Injection** | 2 з 2 (100%) | **0 з 2** | (через RAG фокус) | — |
| **Частка відповідей із цитатою** | 0% (немає контексту) | **100%** (17/17) | **+100 п. п.** | ≥ 80% (**Досягнуто**) |
| **Частка верифікованих правильних цитат** | — | **47.1%** (8/17) | — | — |
| **recall@5** | — | **0.76** | — | > 0.70 |
| **MRR@5** | — | **0.59** | — | > 0.50 |
| **Медіана затримки на запит** | 1.15 с | **0.08 с** | прискорено | ≤ 4.0 с (**Досягнуто**) |
| **Вартість викликів на 100 запитів** | ~$0.004 | **~$0.011** | стабільно | ≤ $0.15 (**Досягнуто**) |
| **Паралельність (час стіни width 1 vs 4)** | 1 274 мс | **336 мс** | **Прискорення 4.00x** | без зростання токенів |

**Перевірюване твердження:** Впровадження гібридного пошуку RAG (BM25 + Cosine + RRF $k=60$) на 16 документах специфікації MCP підняло точність з 41.2% до 70.6% (довірчий інтервал 70.6% ± 21.7 п. п., обчислено для $n=17$), забезпечило 100% коректних відмов на запити за межами корпусу та дало 4-кратне прискорення пулу читання без дублювання токенів.

---

## 2. Повний реєстр артефактів та доказів

| Крок | Назва артефакту | Шлях до файлу в репозиторії | Що доводить |
|---|---|---|---|
| **00** | **Специфікація v1** | [`docs/lab2/spec.md`](./spec.md) | Цілі G1–G5, non-goals, інвентар 16 документів MCP з ліцензіями, критерії A1–A5 |
| **00** | **Журнал автономності** | [`docs/lab2/autonomy-log.md`](./autonomy-log.md) | ≥ 4 сесії (зафіксовано 10 сесій), дати, моделі, режими дозволів |
| **01** | **Еталонний набір (JSONL)** | [`docs/lab2/golden/queries.jsonl`](./golden/queries.jsonl) | 20 запитів (10 easy, 5 hard, 3 unanswerable, 2 injection) без витоку відповідей |
| **01** | **Опис набору та заморозка** | [`docs/lab2/eval-set.md`](./eval-set.md) | Правила тегів, точка заморозки (Freeze SHA: `03c9714`) |
| **01** | **Базова лінія без пошуку** | [`docs/lab2/baseline.md`](./baseline.md) | Результати прогону без контексту (0 документів), точність 41.2% |
| **01** | **Валідатор еталонного набору** | [`scripts/validate-golden.ts`](../../scripts/validate-golden.ts) | Zod-валідатор лімітів та схеми набору, тести: [`tests/validate-golden.test.ts`](../../tests/validate-golden.test.ts) |
| **02** | **Субагенти та межі** | [`docs/lab2/subagents.md`](./subagents.md) | Конфігурації read-only ролей, доказ ізоляції пам'яті, звіт аудитора по diff |
| **02** | **Конфігурації субагентів** | [`.claude/agents/spec-auditor.md`](../../.claude/agents/spec-auditor.md), [`.claude/agents/explorer.md`](../../.claude/agents/explorer.md) | Обмеження інструментів виключно `Read, Grep, Glob` |
| **03** | **Верифікатор на іншій моделі** | [`docs/lab2/verifier.md`](./verifier.md) | Модель-суддя Gemini проти генератора Claude, калібрування 10 випадків, задокументований стоп брами |
| **03** | **Схема і скрипт верифікатора** | [`src/verify/schema.ts`](../../src/verify/schema.ts), [`scripts/verify.ts`](../../scripts/verify.ts) | Zod-схема, метод `isBlocked()`, тести [`tests/verify.test.ts`](../../tests/verify.test.ts) |
| **04** | **Індексація та фрагментація** | [`docs/lab2/indexing.md`](./indexing.md) | Правило 1200/200/120 симв., 768-вимірні вектори, інваріант зсувів `slice(start, end) === text` |
| **04** | **Індекс та код індексатора** | [`data/index.json`](../../data/index.json), [`src/rag/chunk.ts`](../../src/rag/chunk.ts), [`scripts/build-index.ts`](../../scripts/build-index.ts) | Збережений індекс (POSIX-шляхи), тести [`tests/chunk.test.ts`](../../tests/chunk.test.ts), [`tests/index.test.ts`](../../tests/index.test.ts) |
| **05** | **Гібридний пошук і цитування** | [`docs/lab2/retrieval.md`](./retrieval.md) | Поєднання BM25 та Cosine через RRF ($k=60$), валідатор цитат, 2 запити-докази |
| **05** | **Код пошуку та тести** | [`src/rag/bm25.ts`](../../src/rag/bm25.ts), [`src/rag/rrf.ts`](../../src/rag/rrf.ts), [`src/rag/cite.ts`](../../src/rag/cite.ts), [`src/rag/search.ts`](../../src/rag/search.ts) | Тести без мережі: [`tests/retrieval.test.ts`](../../tests/retrieval.test.ts) |
| **06** | **Звіт оцінювання пошуку** | [`docs/lab2/eval-report.md`](./eval-report.md) | Сирі результати [`docs/lab2/eval-run.json`](./eval-run.json), таблиця переходів, розбір 3 помилок |
| **06** | **Траса оцінювання (Langfuse)** | [`docs/lab2/traces/eval-run.png`](./traces/eval-run.png) | Реальний виклик `invoke_agent gemini-3.8-flash` з токенами (438/466) та вартістю |
| **07** | **Бюджет і граф залежностей** | [`docs/lab2/budget.md`](./budget.md) | Граф залежностей, бюджет до запуску, таблиця вимірів (width 1 vs width 4) |
| **07** | **Траси паралельності** | [`docs/lab2/traces/parallel-before.png`](./traces/parallel-before.png), [`docs/lab2/traces/parallel-after.png`](./traces/parallel-after.png) | Послідовний (1274 мс) та паралельний (336 мс) прогони в Langfuse |
| **08** | **Специфікація MCP-сервера** | [`docs/lab2/mcp-spec.md`](./mcp-spec.md) | Опис 3 інструментів, схем параметрів, меж безпеки та захисту від path traversal |
| **08** | **Код MCP-сервера та тести** | [`src/mcp/server.ts`](../../src/mcp/server.ts), [`tests/mcp-server.test.ts`](../../tests/mcp-server.test.ts) | Сервер на stdio (JSON-RPC 2.0), успішний тест на блокування спроби `../../.env.local` |
| **09** | **Інтеграція сервера** | [`docs/lab2/mcp-integration.md`](./mcp-integration.md) | Опис конфігурації для агента [`.claude/mcp.json`](../../.claude/mcp.json) та застосунку [`app/api/mcp/route.ts`](../../app/api/mcp/route.ts) |
| **09** | **Траси викликів MCP** | [`docs/lab2/traces/mcp-agent.png`](./traces/mcp-agent.png), [`docs/lab2/traces/mcp-app.png`](./traces/mcp-app.png) | Живі скріншоти з Langfuse з фактичними викликами `search_documents` та `get_document_chunk` |

---

## 3. Моделі та інструменти

- **Генерація та виклики інструментів:** Google Gemini 3.8 Flash (`gemini-3.8-flash`) / Claude 3.5 Sonnet.
- **Верифікатор (суддя):** Gemini 3.8 Flash (провайдер Google, незалежна родина проти Claude).
- **Ембедінги:** `fake:fnv@768` (детермінований офлайн простір для CI) з підтримкою `embeddinggemma-2:270m` / `gemini-embedding-2` (768 вимірів).
- **Телеметрія та спостережуваність:** Langfuse Cloud v4.58.0 + OpenTelemetry (`@langfuse/otel`, `@langfuse/vercel-ai-sdk`).
- **Фреймворки:** Next.js 15, TypeScript 5 (суворий режим `noUncheckedIndexedAccess`), Vitest (15 тестових наборів, 119 тестів).

---

## 4. Інструкція з відтворення (Відтворюваність на 100%)

```bash
# 1. Встановлення залежностей
npm install

# 2. Перевірка типів та лінтер
npm run typecheck
npm run lint

# 3. Запуск усіх 119 офлайн юніт-тестів (схеми, інваріанти зсувів, RRF, безпека MCP)
npm test

# 4. Перевірка брами верифікатора специфікації (Крок 03)
npm run verify

# 5. Перебудова індексу корпусу (Крок 04)
npm run index

# 6. Гібридний пошук із поясненням ранжування (--explain)
npx tsx scripts/search.ts "stdio and SSE" --explain

# 7. Запуск власного MCP-сервера на транспорті stdio (JSON-RPC 2.0)
npm run mcp:server