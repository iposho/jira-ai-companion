# API Reference

## Endpoints

### GET /api/stats
Общая статистика по проекту.

**Response:**
```json
{
  "activeCount": 42,
  "activeUrl": "https://jira.company.com/issues/?jql=...",
  "unassignedCount": 5,
  "unassignedUrl": "https://...",
  "reviewCount": 8,
  "reviewUrl": "https://..."
}
```

---

### GET /api/kanban-stats
Метрики Kanban-доски.

**Response:**
```json
{
  "statusDistribution": [
    { "status": "In Progress", "count": 15, "color": "#3B82F6" },
    { "status": "Done", "count": 40, "color": "#10B981" }
  ],
  "weeklyThroughput": [
    { "week": "23.12", "completed": 5, "created": 8 }
  ],
  "avgLeadTime": 7,
  "wipCount": 12,
  "totalIssues": 85,
  "projectKey": "DEV"
}
```

---

### GET /api/sprints
Данные спринтов с velocity.

**Response:**
```json
{
  "sprints": [
    {
      "id": 123,
      "name": "Sprint 45",
      "state": "closed",
      "velocity": 21,
      "issueCount": 15,
      "completedCount": 12
    }
  ],
  "boardId": 392,
  "projectKey": "DEV"
}
```

---

### GET /api/sprints/[id]/burndown
Burndown chart для спринта.

**Response:**
```json
{
  "sprint": { "id": 123, "name": "Sprint 45" },
  "burndown": [
    { "date": "2026-01-01", "remaining": 21, "ideal": 21 },
    { "date": "2026-01-02", "remaining": 18, "ideal": 18 }
  ]
}
```

---

### POST /api/reports/[type]
Генерация AI-отчёта. Возвращает SSE stream с прогрессом.

**Params:**
- `type`: `planning` | `daily` | `weekly` | `time`

**Body (optional):**
```json
{
  "projectKey": "DEV",
  "dateFrom": "2026-01-01",
  "dateTo": "2026-01-07"
}
```

**SSE Response:**
```
data: {"progress": 30, "message": "Загрузка задач..."}
data: {"progress": 100, "message": "Готово", "storagePath": "user/.../report.md"}
```

---

## Аутентификация

Все endpoint'ы (кроме `/api/stats`, `/api/kanban-stats`) требуют авторизации через Supabase Auth cookies.

## Ошибки

```json
{
  "error": "Error message",
  "details": "Additional info"
}
```

Коды:
- `400` — неверные параметры
- `401` — не авторизован
- `500` — ошибка сервера
