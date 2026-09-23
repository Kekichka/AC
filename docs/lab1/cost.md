# Вартість викликів — Лабораторна 1

Ollama: 0.33.3 · дата вимірів: 2026-09-23

## 1. Звірка оцінки вхідних токенів (хмарна модель, критерій ≤ 10%)

| прогін | провайдер | модель | вхідні | кешовані | вихідні | оцінка входу до виклику | похибка % | $ фактично | $ за прайсом models.ts | затримка, мс | дата |
|---|---|---|---|---|---|---|---|---|---|---|---|
| gemini-1 | google | gemini-3.8-flash | 15613 | 8978 | 668 | 15613 | 0.0 | 0.000000 | 0.014215 | 4129 | 2026-09-23 |
| gemini-2 | google | gemini-3.8-flash | 15613 | 8978 | 743 | 15613 | 0.0 | 0.000000 | 0.014496 | 5197 | 2026-09-23 |

Команда: npx tsx --env-file=.env.local scripts/measure-cost.ts gemini
Чим оцінено до виклику: Gemini countTokens (REST, generateContentRequest) · факт: usageMetadata.promptTokenCount
Вердикт: похибка 0.0% — у межах 10%.

## 2. Кешування

Префікс: scripts/doctor.ts + scripts/sync-skills.ts + src/models.ts (для Ollama — перші 6000 символів).

| прогін | провайдер | модель | вхідні | кешовані | вихідні | оцінка входу до виклику | похибка % | $ фактично | $ за прайсом models.ts | затримка, мс | дата |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ollama-1 | ollama | qwen3:4b | 1963 | 0 | 64 | — | — | 0.000000 | 0.000000 | 15314 | 2026-09-23 |
| ollama-2 | ollama | qwen3:4b | 1963 | 1962 | 64 | — | — | 0.000000 | 0.000000 | 6494 | 2026-09-23 |

Назва поля кешу: cache_read_input_tokens · сирий usage другого виклику: `{"input_tokens":1,"cache_read_input_tokens":1962,"output_tokens":64}`
Для Ollama: це повторне використання префікса моделі, а не знижка в рахунку. Затримка впала з 15.3 с до 6.5 с (прискорення 2.35x).

## 3. Множник «українська / англійська»

| Провайдер | Модель | Текст (про що, скільки слів) | Токени en | Токени ua | ua / en |
|---|---|---|---|---|---|
| google | gemini-3.8-flash | Правила AGENTS.md (межі проєкту, заборони .env та тести, ~40 слів) | 68 | 113 | 1.66 |
| ollama | qwen3:4b | Правила AGENTS.md (межі проєкту, заборони .env та тести, ~40 слів) | 65 | 187 | 2.88 |

Команда: npx tsx --env-file=.env.local scripts/measure-cost.ts lang docs/lab1/cost.md
Тексти, на яких виміряно множник (скрипт читає саме ці два блоки):

```ua
Цей репозиторій є середовищем для розробки та перевірки агентних систем. Агент кодування повинен суворо дотримуватися меж проєкту: ніколи не читати та не змінювати файли конфігурації оточення, не змінювати залежності в package.json без дозволу користувача та не виходити за межі поставленого завдання. Усі модифікації коду мають обов'язково перевірятися модульними тестами та лінтером перед завершенням роботи.
```

```en
This repository serves as an environment for developing and verifying agentic systems. The coding agent must strictly respect project boundaries: never read or modify environment configuration files, never change dependencies in package.json without explicit user permission, and never exceed the given task scope. All code modifications must be verified using unit tests and linter before declaring completion.
```

## 4. Три прогони (крок 11)
