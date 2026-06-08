# UI/UX спецификация EduMatch

## Дизайн-направление

EduMatch должен ощущаться как рабочий студенческий инструмент: спокойный, понятный, быстрый для повторного использования. Интерфейс не должен быть похож на маркетинговый лендинг; первый экран после входа — дашборд с проектами, заявками и рекомендациями.

## Принципы интерфейса

- Плотная, но не перегруженная информационная структура.
- Ясные статусы заявок: `pending`, `accepted`, `rejected`.
- Навыки отображаются короткими chips.
- Основные действия доступны через кнопки с иконками.
- Карточки используются только для повторяемых сущностей: проекты, заявки, профили.
- Радиус карточек и контролов: 8px.

## Цветовая система

| Назначение | Цвет |
| --- | --- |
| Background | `#f7f4ef` |
| Surface | `#ffffff` |
| Text primary | `#1f2933` |
| Text secondary | `#65707a` |
| Border | `#ded8ce` |
| Primary action | `#0f766e` |
| Secondary accent | `#7c3aed` |
| Warning accent | `#c2410c` |
| Success | `#15803d` |

## Типографика

- Основной шрифт: Inter, system-ui, sans-serif.
- Заголовки экранов: 28-32px desktop, 22-24px mobile.
- Карточки и панели: 14-16px.
- Letter spacing: 0.

## Экраны desktop

| Экран | Назначение | Основные блоки |
| --- | --- | --- |
| Dashboard | Главная рабочая область студента | Мои проекты, заявки, рекомендации, быстрые действия |
| Projects | Поиск проектов | Поиск, фильтры, список карточек, сортировка |
| Project Details | Детальная страница проекта | Описание, стек, участники, заявка, чат |
| Teammates | Поиск студентов | Фильтры по навыкам, карточки профилей, рейтинг |
| Profile | Личный профиль | Фото, описание, навыки, курс, университет |
| Auth | Вход и регистрация | Форма, валидация, переключение Sign In / Sign Up |

## Экраны mobile

| Экран | Изменение относительно desktop |
| --- | --- |
| Dashboard | Sidebar превращается в нижнюю навигацию, карточки идут в одну колонку |
| Projects | Фильтры раскрываются отдельной панелью |
| Project Details | Чат размещается после описания проекта |
| Teammates | Карточки профилей в одну колонку, chips переносятся строками |
| Profile | Фото и основная информация сверху, навыки ниже |

## Компоненты

| Компонент | Состояния |
| --- | --- |
| Button | default, hover, active, disabled, loading |
| Input | empty, filled, focused, error |
| SkillChip | selected, unselected |
| ProjectCard | default, recommended, deadline soon |
| RequestBadge | pending, accepted, rejected |
| UserCard | default, invited |
| ChatMessage | own, teammate |

## Интерактивный прототип

В `apps/frontend` создан React-прототип рабочего экрана: дашборд, поиск проектов, тиммейты и чат-превью. Его можно использовать как основу для переноса в Figma или дальнейшей frontend-разработки.

## Figma структура

Рекомендуемые страницы Figma:

1. `00 Cover`
2. `01 Design System`
3. `02 Wireframes Desktop`
4. `03 Wireframes Mobile`
5. `04 High Fidelity Desktop`
6. `05 High Fidelity Mobile`
7. `06 Prototype Flow`

## Prototype links

Кликабельные переходы в Figma:

- Auth -> Profile setup -> Dashboard.
- Dashboard -> Project details.
- Projects search -> Project details -> Apply.
- Dashboard -> My requests.
- Project details -> Project chat.
