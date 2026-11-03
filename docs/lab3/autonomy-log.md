# Журнал автономності: Лабораторна 3

## Сесія 01 · 2026-10-21 · Крок 00 (Фабрика задач та харнес)
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


## Сесія 02 · 2026-10-21 · Крок 01 (Ланцюг детермінованих брам)
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