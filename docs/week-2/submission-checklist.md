# EduMatch — чеклист сдачи за 2 неделю

## 1. Backend на Go

**Статус:** выполнено.

**Папка:** `backend/`

Что подготовлено:

- backend на Go 1.25 + Gin;
- Clean Architecture;
- DI в `cmd/server/main.go`;
- PostgreSQL и Redis интеграция;
- конфигурация окружения, logger и JWT package.

## 2. Авторизация и безопасность

**Статус:** выполнено.

Что подготовлено:

- регистрация пользователей;
- логин по email/password;
- JWT access token на 15 минут;
- refresh token на 7 дней;
- хранение refresh token в PostgreSQL;
- Redis session storage;
- blacklist access token после logout;
- middleware авторизации.

## 3. Пользователи и навыки

**Статус:** выполнено.

Что подготовлено:

- `GET /api/users/me`;
- `PUT /api/users/me`;
- `GET /api/users/:id`;
- `GET /api/users` с фильтрами;
- `PUT /api/users/me/skills`;
- `GET /api/skills`;
- Redis-кэш списка навыков.

## 4. Проекты

**Статус:** выполнено.

Что подготовлено:

- `POST /api/projects`;
- `GET /api/projects`;
- `GET /api/projects/:id`;
- `PUT /api/projects/:id`;
- `DELETE /api/projects/:id`;
- автодобавление owner в `project_members`;
- фильтрация и поиск проектов;
- owner-only доступ на update/delete.

## 5. Инфраструктура и документация

**Статус:** выполнено.

Что подготовлено:

- миграции в `backend/migrations`;
- Swagger в `backend/docs`;
- `Dockerfile`;
- `docker-compose.yml`;
- обновлённый `README.md`;
- health endpoint;
- единый формат success/error ответов.

## 6. Проверка

Выполнены команды:

```bash
cd backend
go mod tidy
go build ./cmd/server
go run github.com/swaggo/swag/cmd/swag@v1.16.6 init -g cmd/server/main.go -o docs
```

Результат: backend собирается без ошибок, Swagger сгенерирован.
