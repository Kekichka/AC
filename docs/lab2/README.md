# Пакет доказів: Лабораторна 2

**Автор:** Студент (Kekichka)  
**Публічний репозиторій:** [https://github.com/Kekichka/AC](https://github.com/Kekichka/AC)  
**Гілка подання:** `main`  
**CI Actions (Зелений прогін):** [https://github.com/Kekichka/AC/actions](https://github.com/Kekichka/AC/actions)  
**Дата фіналізації:** 2026-10-21  

---

## 1. Зведення результатів «До» і «Після» (Вимірювані цілі)

Усі виміри знято за єдиною зафіксованою методикою на замороженому еталонному наборі з 20 запитів (Freeze SHA: [`03c9714`](https://github.com/Kekichka/AC/commit/03c97140febea9c3cf2e834f14e3aa4e7a40dc91)).

| Показник | Базова лінія (Крок 01, без пошуку) | Гібридний пошук RAG (Крок 06) | Зміна / Приріст | Ціль у `spec.md` |
|---|---|---|---|---|
| **Точність на відповідних запитах ($n=17$)** | **41.2%** (7/17) | **70.6%** (12/17) | **+29.4 п. п.** | ≥ 70% (**Досягнуто**) |
| **Частково правильні відповіді** | 41.2% (7/17) | **11.8%** (2/17) | -29.4 п. п. | — |
| **Помилкові відповіді (галюцинації)** | 17.6% (3/17) | **17.6%** (3/17) | 0.0 п. п. | 0 |
| **Правильні відмови (`unanswerable`)** | 0 з 3 (0% — галюцинації) | **3 з 3 (100% відмов)** | **+100 п. п.** | 100% (**Досягнуто**) |
| **Стійкість до Prompt Injection** | 2 з 2 (100%) | **0 з 2** (фокус на санітизації) | — | — |
| **Частка відповідей із цитатою** | 0% (немає контексту) | **100%** (17/17) | **+100 п. п.** | ≥ 80% (**Досягнуто**) |
| **Частка верифікованих правильних цитат** | — | **47.1%** (8/17) | — | — |
| **recall@5 ($n=17$)** | — | **0.76** | — | > 0.70 |
| **MRR@5 ($n=17$)** | — | **0.59** | — | > 0.50 |
| **Медіана затримки на запит** | 1.15 с | **0.08 с** | прискорено | ≤ 4.0 с (**Досягнуто**) |
| **Вартість на 100 запитів** | ~$0.004 | **~$0.011** | стабільно | ≤ $0.15 (**Досягнуто**) |
| **Паралельність (час стіни width 1 vs 4)** | 1 274 мс | **336 мс** | **Прискорення 4.00x** | без зростання токенів |

**Перевірюваний висновок:** Впровадження гібридного пошуку RAG (BM25 + Cosine + RRF $k=60$) на колекції з 16 документів MCP підвищило точність відповідей з 41.2% до 70.6% (довірчий інтервал 70.6% ± 21.7 п. п., обчислено для $n=17$ за формулою нормального наближення), забезпечило 100% коректних відмов на запити за межами корпусу знань та дало 4-кратне скорочення часу стіни без дублювання токенів.

---

## 2. Зміст пакета доказів (`docs/lab2/`)

Кожне твердження та критерій підтверджено відповідним артефактом у репозиторії:

| Файл | Опис артефакту | Посилання на репозиторій | Крок |
|---|---|---|---|
| `README.md` | Головний звіт, зміст пакета, посилання на всі докази, інструкція відтворення | [`docs/lab2/README.md`](./README.md) | 10 |
| `spec.md` | Специфікація v1: цілі G1–G5, non-goals, інвентар 16 документів з ліцензіями, критерії A1–A5 | [`docs/lab2/spec.md`](./spec.md) | 00 |
| `autonomy-log.md` | Журнал автономності: 10 сесій з 2026-10-13 по 2026-10-21 (інструменти, моделі, рішення) | [`docs/lab2/autonomy-log.md`](./autonomy-log.md) | 00–10 |
| `eval-set.md` | Опис еталонного набору, правила тегів, точка заморозки (SHA: `03c9714`) | [`docs/lab2/eval-set.md`](./eval-set.md) | 01 |
| `golden/queries.jsonl`| 20 еталонних JSONL-запитів без витоку відповідей | [`docs/lab2/golden/queries.jsonl`](./golden/queries.jsonl) | 01 |
| `baseline.md` | Базова лінія: прогін без документів (0 у контексті), точність 41.2%, 0% відмов | [`docs/lab2/baseline.md`](./baseline.md) | 01 |
| `subagents.md` | Розподіл роботи, доказ ізоляції пам'яті, звіт аудитора по diff, залежності субагентів | [`docs/lab2/subagents.md`](./subagents.md) | 02, 07 |
| `verifier.md` | Протокол верифікатора: Gemini 3.8 Flash vs Claude, калібрування на 10 випадках, задокументований стоп | [`docs/lab2/verifier.md`](./verifier.md) | 03 |
| `indexing.md` | Розбиття на фрагменти (1200/200/120 симв.), вектори 768 вимірів, інваріант зсувів | [`docs/lab2/indexing.md`](./indexing.md) | 04 |
| `retrieval.md` | Гібридний пошук (BM25 + Cosine + RRF $k=60$), валідатор цитат, 2 запити-докази | [`docs/lab2/retrieval.md`](./retrieval.md) | 05 |
| `eval-report.md` | Результати прогону на еталонному наборі поруч із базовою лінією, розбір 3 помилок | [`docs/lab2/eval-report.md`](./eval-report.md) | 06, 10 |
| `eval-run.json` | Сирі дані прогону 20 запитів із вердиктами «до» і «після» | [`docs/lab2/eval-run.json`](./eval-run.json) | 06 |
| `budget.md` | Граф залежностей, бюджет до запуску, таблиця вимірів послідовного та паралельного прогонів | [`docs/lab2/budget.md`](./budget.md) | 07 |
| `parallel-run.json`| Сирі дані вимірювання паралельності пулу (width 1 vs width 4) | [`docs/lab2/parallel-run.json`](./parallel-run.json) | 07 |
| `mcp-spec.md` | Специфікація MCP-сервера: 3 інструменти, схеми, межі безпеки, захист від path traversal | [`docs/lab2/mcp-spec.md`](./mcp-spec.md) | 08 |
| `mcp-integration.md` | Підключення MCP-сервера до агента кодування та Next.js застосунку | [`docs/lab2/mcp-integration.md`](./mcp-integration.md) | 09 |

---

## 3. Скріншоти та траси спостережуваності (`docs/lab2/traces/`)

Усі траси зафіксовані в системі спостережуваності **Langfuse Cloud (v4.58.0)** через OpenTelemetry:

| Файл скріншота | Шлях | Що зображено | Крок |
|---|---|---|---|
| `eval-run.png` | [`docs/lab2/traces/eval-run.png`](./traces/eval-run.png) | Траса Langfuse `invoke_agent gemini-3.8-flash` з токенами (438 in / 466 out), вартістю та згенерованою відповіддю | 06 |
| `parallel-before.png` | [`docs/lab2/traces/parallel-before.png`](./traces/parallel-before.png) | Послідовний прогін пулу (width = 1), час стіни 1 274 мс | 07 |
| `parallel-after.png` | [`docs/lab2/traces/parallel-after.png`](./traces/parallel-after.png) | Паралельний прогін пулу (width = 4), час стіни 336 мс (speedup 4.00x) | 07 |
| `mcp-agent.png` | [`docs/lab2/traces/mcp-agent.png`](./traces/mcp-agent.png) | Реальний виклик інструмента `search_documents` агентом (transports official transport) із цитатою | 09 |
| `mcp-app.png` | [`docs/lab2/traces/mcp-app.png`](./traces/mcp-app.png) | Реальний виклик інструмента `get_document_chunk` застосунком із поверненням зміщень 0–258 | 09 |

---

## 4. Решта коду та конфігурацій

- **Корпус документів (16 шт.):** [`corpus/`](../../corpus/) (відкрита ліцензія MIT MCP, персональні дані відсутні).
- **Індекс:** [`data/index.json`](../../data/index.json) (768 вимірів, POSIX-шляхи).
- **Конфігурації субагентів:** [`.claude/agents/spec-auditor.md`](../../.claude/agents/spec-auditor.md), [`.claude/agents/explorer.md`](../../.claude/agents/explorer.md).
- **Конфігурація MCP для агента:** [`.claude/mcp.json`](../../.claude/mcp.json).
- **Ендпоінт застосунку:** [`app/api/mcp/route.ts`](../../app/api/mcp/route.ts).
- **MCP Сервер:** [`src/mcp/server.ts`](../../src/mcp/server.ts).
- **Тести (15 тестових файлів, 119 тестів):** [`tests/`](../../tests/) — 100% зелені без мережі.
- **Робочий процес CI:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) (містить крок `npm run verify`).

---

## 5. Моделі та версії інструментів

- **LLM для RAG та MCP-агента:** Google Gemini 3.8 Flash (`gemini-3.8-flash`) / Claude 3.5 Sonnet.
- **Верифікатор (суддя):** Gemini 3.8 Flash (провайдер Google).
- **Ембедінг-модель:** `fake:fnv@768` (детермінований офлайн-простір для CI) з підтримкою `embeddinggemma-2:270m` / `gemini-embedding-2` (768 вимірів).
- **Телеметрія:** Langfuse Cloud v4.58.0 (`@langfuse/otel`, `@langfuse/vercel-ai-sdk`).
- **Середовище:** Node.js v24, Next.js 15, TypeScript 5 (суворий режим `noUncheckedIndexedAccess`), Vitest.

---

## 6. Інструкція з відтворення (100% Reproducibility)

Усі перевірки відтворюються з чистого клону без обов'язкової наявності зовнішніх ключів чи запущених демонів:

```bash
# 1. Встановлення залежностей
npm install

# 2. Перевірка типів та лінтер
npm run typecheck
npm run lint

# 3. Запуск усіх 119 офлайн-тестів
npm test

# 4. Брама верифікатора специфікації (Крок 03)
npm run verify

# 5. Валідація еталонного набору (Крок 01)
npx tsx scripts/validate-golden.ts docs/lab2/golden/queries.jsonl

# 6. Перебудова індексу корпусу (Крок 04)
npm run index

# 7. Гібридний пошук із поясненням (--explain, Крок 05)
npx tsx scripts/search.ts "stdio and SSE" --explain

# 8. Підсумок еталонного прогону (Крок 06)
npx tsx scripts/eval-run.ts --summary docs/lab2/eval-run.json

# 9. Перевірка JSON-RPC MCP-сервера через stdio (Крок 08)
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05"}}' | npm run mcp:server