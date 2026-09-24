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
| **1** | Claude Code запропонував створити `pages/api/health.ts` | Створено `app/api/health/route.ts` | **Помилка маршрутизації:** Агент впевнено запропонував застарілий Pages Router замість App Router. | [transcript-claude.jsonl#L2](https://github.com/Kekichka/AC/blob/63d686c569c4f2f25f5a5d72d7aa62f0eee7eb06/.agent-log/transcript-claude.jsonl#L2)<br>`ts: 2026-09-09T17:50:44.886Z`<br>`tool: Write` |
| **2** | Gemini запропонував встановити пакет через `npm install cors` | Використано нативний Web API `Response.json()` без додаткових пакетів | **Порушення меж та галюцинація залежностей:** Агент спробував змінити `package.json`, що прямо заборонено в `AGENTS.md`. | [transcript-gemini.jsonl#L2](https://github.com/Kekichka/AC/blob/63d686c569c4f2f25f5a5d72d7aa62f0eee7eb06/.agent-log/transcript-gemini.jsonl#L2)<br>`ts: 2026-09-09T17:50:52.890Z`<br>`tool: Bash` |
| **3** | Gemini запропонував створити файл за шляхом `src/pages/api/health.ts` | Створено `app/api/health/route.ts` | **Помилка структури каталогів:** Агент припустив наявність папки `src/pages/`, проігнорувавши структуру `app/`. | [transcript-gemini.jsonl#L3](https://github.com/Kekichka/AC/blob/63d686c569c4f2f25f5a5d72d7aa62f0eee7eb06/.agent-log/transcript-gemini.jsonl#L3)<br>`ts: 2026-09-09T17:50:52.890Z`<br>`tool: Write` |

---

## 3. Верифікація роботи ендпоінту
- Ендпоінт реалізовано згідно з контрактом: HTTP GET `/api/health` повертає `{ status: "ok", uptime, timestamp }` з кодом 200.
- Покрито автоматичним модульним тестом `tests/health.test.ts` (фреймворк Vitest).
