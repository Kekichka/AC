# Ланцюг детермінованих брам (Крок 01)

- **Workflow:** `.github/workflows/gates.yml`
- **Порядок ланцюга:** `types` → `lint` → `tests` → `build` → `record`
- **Чому саме такий порядок:** 
  Перевірки впорядковано за ціною та детермінізмом: найдешевша і найсуворіша перевірка типів (`types`, ~10 с) стоїть першою, щоб помилка у TypeScript не спалювала хвилини раннера на `build`. Якщо типи червоні, подальші задачі не запускаються (`skipped`).
- **Concurrency:** `group: ${{ github.workflow }}-${{ github.ref }}`, `cancel-in-progress: true` (новий пуш миттєво скасовує застарілий прогін).
- **Артефакти:** `actions/upload-artifact@v7` та `actions/download-artifact@v8`.

## 1. Таблиця брам

| Брама | Що доводить | Чого коштує (таймаут) | Що пише |
|---|---|---|---|
| `types` | Код узгоджений із власною типізацією TypeScript (`tsc --noEmit`), відсутні неіснуючі властивості | ~10–15 с (`timeout-minutes: 5`) | `verdict=pass` у `$GITHUB_OUTPUT`, компілятор у лог |
| `lint` | Дотримано кодстайлу ESLint: відсутні невикористані змінні, заборонені імпорти | ~5–10 с (`timeout-minutes: 5`) | `verdict=pass` у `$GITHUB_OUTPUT`, звіти лінтера |
| `tests` | Усі 124 юніт-тести зелені, інваріанти RAG і межі MCP не порушено | ~40–60 с (`timeout-minutes: 10`) | `verdict=pass` + артефакт `gate-tests` |
| `build` | Next.js застосунок збирається без помилок імпортів або відсутніх модулів | ~60–90 с (`timeout-minutes: 15`) | `verdict=pass` + артефакт `gate-build` |
| `record` | Свідок: збирає вердикти брам за будь-якого стану (`if: ${{ !cancelled() }}`) | ~5 с (`timeout-minutes: 5`) | `gate-record.json` та поле `gates` у `run.json` |

## 2. Обовʼязкові перевірки (Branch Protection Rules)
- **Набір правил на `main`:** «Require status checks to pass before merging» увімкнено.
- **Перелічені обов'язкові перевірки:** `types`, `lint`, `tests`, `build`.
- **Require branches to be up to date before merging:** Увімкнено (гарантує, що PR зливається лише на базі свіжого `main`).

## 3. Навмисне падіння (Доказ працездатності брами)
- **Гілка:** `harness/red-2026-10-21`
- **Що саме зламано:** Додано навмисну помилку звернення до неіснуючого поля в `src/metrics.ts` (`const _err: number = "bad-type"`).
- **Прогін в Actions:** [Посилання на червоний прогін на GitHub Actions](https://github.com/Kekichka/AC/actions)
- **Очікувано червона брама:** `types` (помилка TS2322)
- **Що показали наступні брами:** `lint`, `tests`, `build` отримали статус **skipped** (ланцюг зупинився, дорогі кроки не виконувалися).
- **Чи виконалася задача `record`:** **ТАК**, виконана завдяки `if: ${{ !cancelled() }}`.
- **Витяг із `gate-record.json` червоного прогону:**
```json
{
  "gates": {
    "types": "fail",
    "lint": "skipped",
    "tests": "skipped",
    "build": "skipped"
  }
}

## 4. Звʼязок із фабрикою задач
Task ID: t-01
Artifact dir: docs/lab3/runs/t-01-.../
Успішні прогони харнеса отримують підтверджені статуси pass по кожній із чотирьох детермінованих брам у власному run.json.