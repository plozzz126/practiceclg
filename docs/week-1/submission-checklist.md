# EduMatch — чеклист сдачи за 1 неделю

## 1. Анализ и исследование конкурентов

**Статус:** выполнено.

**Файл:** `docs/week-1/competitor-analysis.md`

Что подготовлено:

- анализ Trello, Discord, GitHub, LinkedIn, HeadHunter, Behance/Dribbble, Kaggle;
- выделены сильные и слабые стороны конкурентов;
- сформулировано позиционирование EduMatch;
- описаны уникальные преимущества MVP.

## 2. User Flow

**Статус:** выполнено.

**Файл:** `docs/week-1/user-flow.md`

Что подготовлено:

- сценарий регистрации и заполнения профиля;
- сценарий поиска проекта и подачи заявки;
- сценарий создания проекта;
- сценарий поиска тиммейта;
- сценарий чата внутри проекта;
- приоритеты MVP.

## 3. UI/UX дизайн приложения

**Статус:** подготовлено для переноса в Figma.

**Файлы:**

- `docs/design/product-design.md`
- `docs/design/wireframes.md`
- `docs/design/figma-import/edumatch-figma-board.svg`
- `docs/design/figma-import/figma-transfer-guide.md`
- `apps/frontend/src/App.tsx`
- `apps/frontend/src/styles.css`

Что подготовлено:

- дизайн-направление EduMatch;
- цветовая система;
- типографика;
- список экранов desktop;
- список экранов mobile;
- состояния UI-компонентов;
- wireframes для desktop и mobile;
- готовый SVG-board для быстрого импорта в Figma;
- интерактивный React-прототип рабочего интерфейса.

Важно: настоящий `.fig` файл нельзя создать локально без доступа к аккаунту Figma. Поэтому подготовлены Figma-ready материалы: структура страниц, дизайн-система, wireframes и рабочий frontend-прототип, который можно перенести в Figma.

## 4. Начальная инициализация проекта

**Статус:** выполнено.

**Файлы и папки:**

- `package.json`
- `package-lock.json`
- `apps/frontend`
- `apps/backend`
- `.env.example`
- `docker-compose.yml`
- `README.md`

Что подготовлено:

- monorepo на npm workspaces;
- frontend на React + TypeScript + Vite;
- backend на Node.js + Express + TypeScript;
- базовый API skeleton;
- health endpoint;
- конфигурация окружения;
- Docker Compose для PostgreSQL и Redis.

## 5. Проектирование схемы базы данных

**Статус:** выполнено.

**Файлы:**

- `docs/database/er-diagram.md`
- `db/schema.sql`

Что подготовлено:

- ER-диаграмма в Mermaid;
- PostgreSQL схема MVP;
- таблицы пользователей, навыков, проектов, заявок, участников, сообщений и refresh tokens;
- индексы для поиска и фильтрации;
- справочник базовых навыков.

## Проверка

Выполнены команды:

```bash
npm install
npm run typecheck
npm run build
```

Результат: проект собирается без ошибок.

Локальные адреса:

- Frontend: `http://127.0.0.1:5173`
- Backend health: `http://127.0.0.1:4000/health`
