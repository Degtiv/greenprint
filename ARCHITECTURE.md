# Правила внесения вклада в проект

## Архитектура

### Структура веток
- `master` - стабильная версия, только релизные теги
- `develop` - основная ветка разработки
- `feature/*` - новые функции (от develop)
- `hotfix/*` - срочные исправления (от main)

### Коммиты
Используем [Conventional Commits](https://www.conventionalcommits.org/ru/v1.0.0/):

| Тип | Описание | Пример |
|-----|----------|--------|
| `feat` | Новая функция | `feat: add data export to CSV` |
| `fix` | Исправление бага | `fix: chart not updating on data change` |
| `docs` | Документация | `docs: update installation guide` |
| `style` | Форматирование | `style: format code with prettier` |
| `refactor` | Рефакторинг | `refactor: optimize chart rendering` |
| `test` | Тесты | `test: add unit tests for chart component` |
| `chore` | Обслуживание | `chore: update dependencies` |

## Процесс разработки

1. **Создайте ветку** от `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name