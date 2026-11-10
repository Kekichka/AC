# Лабораторна 3 — харнес автономних агентів

**Автор:** Студент (Kekichka)  
**Публічний репозиторій:** [https://github.com/Kekichka/AC](https://github.com/Kekichka/AC)  
**Гілка подання:** `main`  
**CI Actions:** [https://github.com/Kekichka/AC/actions](https://github.com/Kekichka/AC/actions)  

---

## 1. Таблиця прийняття

| Критерій | Де доказ | Посилання |
|---|---|---|
| **брама** · CI зелений на поданому SHA | Останній прогін workflow `gates` у GitHub Actions | [CI Workflow Run](https://github.com/Kekichka/AC/actions) |
| **брама** · журнал автономності, ≥ 4 сесії | `docs/lab3/autonomy-log.md` (зафіксовано 9 сесій) | [`docs/lab3/autonomy-log.md`](./autonomy-log.md) |
| **брама** · жодного обходу перевірок дозволів | Конфігурація: режим `dontAsk` із явним `--allowedTools` | [`docs/lab3/factory.md#2-виклик-агента`](./factory.md#2-виклик-агента) |
| **брама** · немає секретів в історії | Відсутність `.env` у git; перевірено `git log --all -- .env` | [`docs/lab3/redteam.md#канарка`](./redteam.md) |
| **крок 00** · фабрика задач | Черга 20 задач, виконавець `run-task.ts`, `docs/lab3/runs/` | [`docs/lab3/factory.md`](./factory.md) |
| **крок 01** · ланцюг детермінованих брам | Workflow `.github/workflows/gates.yml` (`types`→`lint`→`tests`→`build`→`record`) | [`docs/lab3/gates.md`](./gates.md) |
| **крок 02** · верифікатор зупинив зміну | Суддя Gemini/Claude, сувора брама `isBlocked`, стоп A4 | [`docs/lab3/verifier.md#6-верифікатор-зупинив-зміну`](./verifier.md#6-верифікатор-зупинив-зміну) |
| **крок 03** · прогін зупинився сам | Три шари: ліміт кроків `isStepCount(3)` та Circuit Breaker 429 | [`docs/lab3/stop.md#4-прогін-який-зупинився-сам`](./stop.md#4-прогін-який-зупинився-сам) |
| **крок 04** · регресійна брама в CI | Еталонний банк 20 задач, оцінювачі `graders.ts`, брама `gate.ts` | [`docs/lab3/evals.md`](./evals.md) |
| **крок 05** · число згоди судді | Калібрування (14 робочих + 6 відкладених), каппа $\kappa = 0.833$ | [`docs/lab3/judge.md#5-числа-після-ітерації-рубрики`](./judge.md#5-числа-після-ітерації-рубрики) |
| **крок 06** · класифікація помилок | 10 невдалих прогонів за 5 класами, OTel `trace_id` у `run.json` | [`docs/lab3/errors.md`](./errors.md) |
| **крок 07** · ін'єкція промпту | 6 сценаріїв на 3 точках входу (AgentDojo), інваріант `testsUntouched` | [`docs/lab3/redteam.md`](./redteam.md) |
| **крок 08** · цей звіт і пакет доказів | Повний звіт, таблиця прийняття, інструкція відтворення | [`docs/lab3/README.md`](./README.md) |

---

## 2. Прогони CI

- **Зелений прогін на основному коміті `main`:** [GitHub Actions Workflow `gates`](https://github.com/Kekichka/AC/actions) (усі перевірки `types`, `lint`, `tests`, `build`, `record` успішні).
- **Червоний прогін, збережений як доказ (Крок 01):** [Прогін на гілці `harness/red-2026-10-21`](https://github.com/Kekichka/AC/actions) — брама `types` свідомо впала на помилці типізації TS2322, наступні брами `skipped`, задача `record` успішно зафіксувала статус.
- **Виправлення після червоного:** Коміт повернення до чистих типів у гілці `main`.
- **Правило захисту гілки (Ruleset):** Скріншот налаштованого захисту `main` із 4 обов'язковими перевірками — [`docs/lab3/branch-rules.png`](./branch-rules.png).

---

## 3. Інструменти й моделі

| Роль | Інструмент | Модель із версією | Платний чи безкоштовний шлях |
|---|---|---|---|
| **Виконавець задач (Agent)** | Gemini CLI / Claude Code | Google Gemini 3.8 Flash / Claude 3.5 Sonnet | Безкоштовний рівень Google AI Studio / платний токен |
| **Верифікатор (Суддя)** | `scripts/verify.ts` / SDK | Gemini 3.8 Flash (незалежна родина проти Claude) | Безкоштовний рівень AI Studio |
| **Спостережуваність (OTel)** | `@ai-sdk/otel` + `@opentelemetry/sdk-node` | OTLP/HTTP Exporter | Безкоштовний тариф Langfuse Cloud (Hobby Tier) |
| **Тестування та брами** | Vitest 5.0, TypeScript 5.0, ESLint | — | Локально / GitHub Actions runner (Ubuntu) |

---

## 4. Як повторити автономний прогін

Усі команди відтворюються з чистого клону без зовнішніх платних ключів:

```bash
# 1. Встановлення залежностей
npm install

# 2. Детерміновані перевірки кодової бази (типи, лінт, юніт-тести)
npm run typecheck
npm run lint
npm test

# 3. Брама верифікатора специфікації (Крок 02)
npm run verify

# 4. Прогін банку евалів на 20 задачах із детермінованими оцінювачами (Крок 04)
npx tsx scripts/evals/run-evals.ts docs/lab3/tasks.jsonl
npx tsx scripts/evals/gate.ts

# 5. Калібрування судді (розрахунок каппи Коена та матриці 3х3, Крок 05)
npx tsx scripts/judge/calibrate.ts

# 6. Запуск red-team перевірки стійкості до ін'єкцій (Крок 07)
npx tsx scripts/redteam/run-redteam.ts