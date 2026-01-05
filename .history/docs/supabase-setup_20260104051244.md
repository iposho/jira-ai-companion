# Supabase Setup Guide

Инструкция по настройке Supabase для Jira AI Companion.

## 1. Создание проекта

1. Перейдите на [supabase.com](https://supabase.com) и создайте новый проект
2. Выберите регион (рекомендуется `eu-central-1` для минимальной задержки)
3. Сохраните пароль базы данных

## 2. Получение ключей

После создания проекта перейдите в **Project Settings → API**:

| Ключ | Переменная окружения |
|------|---------------------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role | `SUPABASE_SERVICE_ROLE_KEY` |

## 3. Переменные окружения

Добавьте в `.env`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUz...

# Groq (для LLM)
GROQ_API_KEY=gsk_...
```

## 4. Применение миграции

1. Откройте **SQL Editor** в Supabase Dashboard
2. Скопируйте содержимое `supabase/migrations/init.sql`
3. Выполните SQL

Или через CLI:
```bash
npx supabase db push
```

## 5. Настройка Storage

Bucket `reports` создается автоматически миграцией. Убедитесь, что он существует в **Storage** разделе.

## 6. Настройка Auth

1. Перейдите в **Authentication → Providers**
2. Убедитесь, что **Email** провайдер включен
3. Отключите **Confirm email** если не нужна верификация

## 7. Создание пользователя

1. **Authentication → Users → Add User**
2. Введите email и пароль
3. Или зарегистрируйтесь через форму входа в приложении

---

## Troubleshooting

### RLS блокирует запросы
Проверьте, что пользователь аутентифицирован и RLS политики применены корректно.

### Storage upload fails
Убедитесь, что bucket `reports` существует и политики позволяют запись.
