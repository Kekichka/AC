# Журнал автономності: Лабораторна 3

## Сесія 01 · 2026-3-11 · Крок 00 (Фабрика задач та харнес)
- Інструмент: VS Code + Git Bash + Assistant
- Шлях агента: Gemini CLI (`gemini-cli`) / Claude Code
- Модель: Gemini 3.8 Flash / Claude 3.5 Sonnet
- Режим дозволів: `dontAsk` з явним переліком інструментів (без обходу дозволів)
- Спосіб ізоляції: `git worktree` (`harness/<id>`)
- Мета: Побудова фабрики задач, створення черги `tasks.jsonl` на 6 задач, розробка виконавця `run-task.ts`, оркестратора черги `run-queue.ts`, написання офлайн-тестів та генерація перших артефактів.
- Що зроблено:
  1. Додано `/runs/` у `.gitignore`.
  2. Складено 6 задач однакової форми з командами acceptance у `docs/lab3/tasks.jsonl`.
  3. Реалізовано `scripts/harness/run-task.ts` та `scripts/harness/run-queue.ts`.
  4. Написано офлайн-тести `tests/harness/run-task.test.ts` (5 тестів зелені).
  5. Згенеровано перші прогони у `docs/lab3/runs/`.
  6. Описано специфікацію фабрики у `docs/lab3/factory.md`.
- Відхилення від плану: Немає.


## Сесія 02 · 2026-3-11 · Крок 01 (Ланцюг детермінованих брам)
- Інструмент: VS Code + Git Bash + GitHub Actions + Assistant
- Модель: Gemini 3.8 Flash / Claude 3.5 Sonnet
- Режим дозволів: `dontAsk` / Step-by-step confirmation
- Мета: Побудова ланцюга детермінованих брам `.github/workflows/gates.yml` (`types` → `lint` → `tests` → `build` → `record`), налаштування збору вердиктів та проведення тесту навмисного падіння.
- Що зроблено:
  1. Реалізовано скрипт `scripts/harness/record-gates.mjs` для оновлення `gate-record.json` та `run.json`.
  2. Створено GitHub Actions workflow `.github/workflows/gates.yml` з явними `timeout-minutes`, `concurrency` та `outputs`.
  3. Описано архітектуру брам у `docs/lab3/gates.md`.
  4. Проведено тест навмисного падіння на гілці `harness/red-2026-10-21`: брама `types` впала, наступні стали `skipped`, а `record` зафіксувала вердикт.
- Відхилення від плану: Немає.

## Сесія 03 · 2026-4-11 · Крок 02 (Верифікатор як остання брама)
- Інструмент: VS Code + Git Bash + Assistant
- Модель виконавця: Gemini 3.8 Flash
- Модель верифікатора: Claude 3.5 Sonnet / Gemini (суддя іншої родини)
- Режим дозволів: `dontAsk` / Step-by-step confirmation
- Мета: Інтеграція верифікатора в кінець детермінованого ланцюга брам CI, реалізація формули каппи Коена `scripts/kappa.ts`, калібрування на 10 випадках та фіксація зупинки.
- Що зроблено:
  1. Оновлено `src/verify/schema.ts`: функція `isBlocked` тепер блокує все, що не `pass` (зокрема `unknown`).
  2. Оновлено тест `tests/verify.test.ts`.
  3. Створено модуль `scripts/kappa.ts` для розрахунку сирої згоди (90.0%) та каппи Коена ($\kappa = 0.773$).
  4. Оновлено `scripts/verify.ts` для збереження звітів у `docs/lab3/verdicts/`.
  5. Додано задачу `verify` у `.github/workflows/gates.yml` (`needs: build`).
  6. Складено звіт `docs/lab3/verifier.md` із рубрикою та калібруванням.
- Відхилення від плану: Немає.

## Сесія 04 · 2026-4-11 · Крок 03 (Автоматичне зупинення: бюджет, таймаут, circuit breaker)
- Інструмент: VS Code + Git Bash + Assistant
- Модель: Gemini 3.8 Flash / Claude 3.5 Sonnet
- Режим дозволів: `dontAsk` / Step-by-step confirmation
- Мета: Реалізація трьох шарів зупинення (бюджет задачі, stopWhen циклу, circuit breaker харнеса з перехопленням 429), тести станів без мережі та фіксація реального зупинення.
- Що зроблено:
  1. Створено `src/harness/stop.ts` з обгорткою `stepLimit(n, taskId)` та журналом `docs/lab3/stop-log.jsonl`.
  2. Реалізовано `src/harness/breaker.ts` (стани closed / open / half-open, збереження в `.harness/breaker.json`, реакція на 429).
  3. Інтегровано перевірку брейкера в чергу `scripts/harness/run-queue.ts`.
  4. Написано тести `tests/harness/breaker.test.ts` (5 тестів Vitest зелені).
  5. Згенеровано доказ зупиненого прогону в `docs/lab3/stop-log.jsonl` та `.harness/breaker.json`.
  6. Складено звіт `docs/lab3/stop.md`.
- Відхилення від плану: Немає.

## Сесія 05 · 2026-11-04 · Крок 04 (Evals у CI та регресійна брама)
- Інструмент: VS Code + Git Bash + Assistant
- Модель: Gemini 3.8 Flash / Claude 3.5 Sonnet
- Режим дозволів: `dontAsk` / Step-by-step confirmation
- Мета: Розширення банку до 20 задач з полями `label`, `source`, `bucket`, `frozen_at`, реалізація детермінованих оцінювачів, раннера $k$-спроб, регресійної брами та фіксація базового рівня.
- Що зроблено:
  1. Розширено `docs/lab3/tasks.jsonl` до 20 задач (12 regression, 4 new, 4 edge).
  2. Створено `docs/lab3/tasks-rejected.jsonl` (2 відкинуті задачі).
  3. Реалізовано чисті оцінювачі `scripts/evals/graders.ts` та тести `tests/evals/graders.test.ts` (6 тестів зелені).
  4. Створено раннер `scripts/evals/run-evals.ts` та регресійну браму `scripts/evals/gate.ts`.
  5. Зафіксовано базовий рівень `docs/lab3/evals-baseline.json` та звіт `docs/lab3/evals.md`.
  6. Додано задачу `evals` у `.github/workflows/gates.yml`.
- Відхилення від плану: Немає.