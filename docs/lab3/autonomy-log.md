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
