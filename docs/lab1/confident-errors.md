# Доказова частина: Заняття 02

## 1. Аналіз планів та файлів, які збиралися чіпати агенти

- **Claude Code збирався чіпати:**
  - `src/app` (читання)
  - `pages/api/health.ts` (створення)
  - `tests/health.test.ts` (створення)
- **Gemini збирався чіпати:**
  - `package.json` (читання)
  - `package.json` (модифікація через команду `npm install cors`)
  - `src/pages/api/health.ts` (створення)

---

## 2. Таблиця спійманих упевнених помилок (Confident Errors)

| # | Запропоновано (Proposed) | Виконано насправді (Executed) | У чому помилка агента (Wrong / Confident Error) | Точне посилання на рядок журналу |
|---|---|---|---|---|
| **1** | Claude Code запропонував створити `pages/api/health.ts` | Створено `app/api/health/route.ts` | **Помилка маршрутизації:** Агент впевнено запропонував застарілий Pages Router замість App Router, визначеного стеком репозиторію. | `.agent-log/transcript-claude.jsonl: рядок 2` |
| **2** | Gemini запропонував встановити пакет через `npm install cors` | Використано нативний Web API `Response.json()` без додаткових пакетів | **Порушення меж та галюцинація залежностей:** Агент спробував змінити `package.json`, що прямо заборонено в `AGENTS.md`, для функціоналу, який не потребує CORS. | `.agent-log/transcript-gemini.jsonl: рядок 2` |
| **3** | Gemini запропонував створити файл за шляхом `src/pages/api/health.ts` | Створено `app/api/health/route.ts` | **Помилка структури каталогів:** Агент припустив наявність папки `src/pages/`, проігнорувавши структуру кореневої папки `app/`. | `.agent-log/transcript-gemini.jsonl: рядок 3` |

---

## 3. Верифікація роботи ендпоінту
- Ендпоінт реалізовано згідно з контрактом: HTTP GET `/api/health` повертає `{ status: "ok", uptime, timestamp }` з кодом 200.
- Покрито автоматичним модульним тестом `tests/health.test.ts` (фреймворк Vitest).
