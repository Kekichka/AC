# Пакет доказів: Лабораторна 1

## Зміст пакета
- [Журнал автономності](autonomy-log.md)
- [Протокол тесту 40% AGENTS.md](agents-md-40.md)
- [Впевнені помилки з режиму плану](confident-errors.md)
- [Переносність](portability.md)
- [Спрацювання навички](skill-trigger.md)
- [Ціна контексту та MCP](context-cost.md)
- [Скріншот браузерного тесту](e2e-home.png)
- [Вартість викликів (3 прогони)](cost.md)
- [Порівняння виконавців (comparison)](comparison.md)
- [Рішення про заміну моделі](model-decision.md)
- [Чернетка Вступу курсової](intro-draft.md)
- [Скріншоти трас Langfuse](traces/)

## Гілки та журнали
- Гілка Claude: `lab1/health-claude`
- Гілка Gemini: `lab1/health-gemini`
- Журнали: `.agent-log/transcript-claude.jsonl`, `.agent-log/transcript-gemini.jsonl`, `.agent-log/agent-loop.jsonl`

## CI та Деплой
- **Зелений прогін main**: https://github.com/Kekichka/AC/actions/runs/35986076453
- **Червоний прогін «поганого патча»**: [буде додано після PR від викладача]
- **Задеплоєний ендпоінт**: `https://ac-nine-bice.vercel.app/api/agent`

Команда для виклику:
    curl -s -X POST "https://ac-nine-bice.vercel.app/api/agent" \
      -H "Content-Type: application/json; charset=utf-8" \
      -d '{"prompt":"Котра зараз година?"}'

## Інструменти
- **Claude Code**: версія `2.1.266` (вивід команди `claude --version`)
- **Gemini**: веб-інтерфейс Google AI Studio (через скрипт логування `log:import`)
- **Ollama**: версія `0.33.3` (модель `qwen3:4b`)

## Як запустити у двох інструментах
- **Claude Code**: Запустити `claude` у корені репозиторію. Усі правила підтягнуться автоматично через `CLAUDE.md` -> `@AGENTS.md`. Логи пишуться автоматично через налаштований hook у `.claude/settings.json`.
- **Gemini**: Скопіювати промпт та правила з `AGENTS.md`, додати у веб-інтерфейс AI Studio. Відповідь скопіювати в `transcript.txt` та сконвертувати командою `npm run log:import -- --in transcript.txt --source auto`.
