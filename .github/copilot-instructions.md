# Instructions for GitHub Copilot

## Project Context

This is **Jira AI Companion** — a Next.js 16 app for Jira analytics with AI-powered reports.

**Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase, Jira API, Groq LLM

## Architecture: Feature Sliced Design

```
src/
├── app/        # Routes, API endpoints
├── widgets/    # Large UI blocks (Dashboard, Sidebar)
├── features/   # Business logic (auth, reports, theme)
└── shared/     # Reusable code (ui, lib, api, config)
```

## Coding Preferences

- **TypeScript strict mode**, no `any`
- **Server Components** by default, `'use client'` only when needed
- **Tailwind CSS 4** with CSS variables
- Use `cn()` utility for conditional classes
- Comments in Russian, code in English

## Imports

```typescript
// Use public API via index.ts
import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib'
```

## API Routes

- Path: `src/app/api/<endpoint>/route.ts`
- Use `NextRequest` / `NextResponse`
- Handle errors with try-catch

## Commit Format

`<type>(<scope>): <description>`

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`
