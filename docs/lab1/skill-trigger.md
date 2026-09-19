# Звіт спрацювання навички (Skill Trigger)

## 1. Опис навички
- **Назва:** `health-check`
- **Шляхи:**
  - `.claude/skills/health-check/` (первинне джерело)
  - `.agents/skills/health-check/` (синхронізована копія через `npm run sync-skills`)
- **Призначення:** Швидка валідація доступності ендпоінту `/api/health` без запуску повного важкого тестового сюїту.

## 2. Умова спрацювання (Trigger Condition)
- **Промпт/Тригер:** «Перевір працездатність локального ендпоінту здоров'я через навичку health-check».
- **Дія агента:** Агент виявляє наявність опису `SKILL.md` у теці навичок і виконує виконуваний скрипт `scripts/check.sh`.

## 3. Докази виконання з журналів дій
- **Claude Code:**
  - Рядок у журналі: `.agent-log/transcript-claude.jsonl:4`
  - Виклик інструменту `Bash`: `.claude/skills/health-check/scripts/check.sh`
  - Статус: `ok`
- **Gemini:**
  - Рядок у журналі: `.agent-log/transcript-gemini.jsonl:4`
  - Виклик інструменту `Bash`: `.agents/skills/health-check/scripts/check.sh`
  - Статус: `ok`
