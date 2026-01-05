# AGENTS.md — Руководство для AI-агентов

## Обзор проекта

**Jira AI Companion** — веб-приложение для работы с Jira, предоставляющее:
- Аналитику Kanban-досок (статусы, throughput, WIP)
- Графики Velocity и Burndown для спринтов
- AI-генерацию отчётов через Groq LLM
- Авторизацию через Supabase

## Технологический стек

| Компонент | Технология |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| External API | Jira REST API v3 |
| LLM | Groq API |
| Architecture | Feature Sliced Design |

## Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API endpoints
│   │   ├── kanban-stats/   # GET — метрики Kanban
│   │   ├── reports/        # GET/POST — отчёты
│   │   ├── sprints/        # GET — данные спринтов
│   │   └── stats/          # GET — общая статистика
│   ├── login/              # Страница авторизации
│   ├── reports/            # Страница отчётов
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Главная (Dashboard)
│
├── features/               # Бизнес-логика
│   ├── auth/               # Хуки авторизации
│   ├── reports/            # Генерация отчётов, типы, UI
│   └── theme/              # Переключение темы
│
├── widgets/                # Крупные UI-блоки
│   ├── dashboard/          # Графики, карточки метрик
│   ├── sidebar/            # Навигационное меню
│   └── app-shell/          # Обёртка приложения
│
├── shared/                 # Переиспользуемый код
│   ├── api/                # API-клиенты
│   │   ├── jira/           # Jira REST client
│   │   ├── supabase/       # Supabase client
│   │   └── llm/            # Groq client
│   ├── ui/                 # UI-компоненты
│   ├── lib/                # Утилиты (cn, форматирование)
│   ├── config/             # Конфигурация, env
│   └── providers/          # React providers
│
└── middleware.ts           # Auth middleware
```

## API Endpoints

| Endpoint | Method | Описание |
|----------|--------|----------|
| `/api/kanban-stats` | GET | Метрики Kanban (статусы, throughput, WIP) |
| `/api/reports` | GET | Список сохранённых отчётов |
| `/api/reports` | POST | Генерация нового AI-отчёта |
| `/api/sprints` | GET | Данные спринтов и velocity |
| `/api/stats` | GET | Общая статистика по проекту |

## Переменные окружения

```bash
# Обязательные
JIRA_HOST              # URL Jira (https://xxx.atlassian.net)
JIRA_EMAIL             # Email для API
JIRA_API_TOKEN         # API токен Jira
JIRA_BOARD_ID          # ID доски

# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# LLM
GROQ_API_KEY
```

## Правила разработки

### Feature Sliced Design
- **Импорты только через публичный API** (`index.ts`)
- Нижние слои не импортируют верхние
- `shared` → `features` → `widgets` → `app`

### TypeScript
- `strict: true` в tsconfig
- Типизировать все props и API-ответы
- Избегать `any`

### Компоненты
- Функциональные компоненты с arrow functions
- Server Components по умолчанию
- `'use client'` только при необходимости

### Стилизация
- Tailwind CSS 4 с CSS переменными
- Утилита `cn()` для объединения классов
- Темизация через `next-themes`

## Частые задачи

### Добавить новый API endpoint
1. Создать `src/app/api/<name>/route.ts`
2. Экспортировать `GET` / `POST` функции
3. Использовать `NextRequest` / `NextResponse`

### Добавить новую фичу
1. Создать папку в `src/features/<name>/`
2. Структура: `model/`, `ui/`, `api/`, `index.ts`
3. Экспортировать публичный API через `index.ts`

### Добавить UI-компонент
1. Создать в `src/shared/ui/<name>/`
2. Экспортировать через `src/shared/ui/index.ts`
