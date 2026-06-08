# EduMatch

EduMatch — full-stack платформа для поиска тиммейтов и студенческих проектов.

Этот репозиторий содержит результат работ за 1 неделю практики: анализ конкурентов, User Flow, UI/UX спецификацию, стартовый monorepo и проектирование базы данных.

## Стек

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL
- Cache/Sessions: Redis

## Структура

```text
apps/
  frontend/     React-прототип интерфейса EduMatch
  backend/      Express API skeleton
db/
  schema.sql    PostgreSQL схема MVP
docs/
  week-1/       отчет, анализ конкурентов, User Flow
  design/       UI/UX спецификация и wireframes
  database/     ER-диаграмма и описание сущностей
```

## Локальный запуск

```bash
npm install
npm run dev:frontend
npm run dev:backend
```

Frontend будет доступен на `http://localhost:5173`, backend — на `http://localhost:4000`.

## Переменные окружения

Скопируйте `.env.example` в `.env` и заполните значения:

```bash
cp .env.example .env
```

## Документы первой недели

- `docs/week-1/week-1-report.md` — общий отчет за неделю
- `docs/week-1/competitor-analysis.md` — экспресс-анализ конкурентов
- `docs/week-1/user-flow.md` — пользовательские сценарии
- `docs/design/product-design.md` — UI/UX спецификация для Figma
- `docs/design/wireframes.md` — мобильные и desktop wireframes
- `docs/database/er-diagram.md` — ER-диаграмма
- `db/schema.sql` — SQL-схема PostgreSQL
