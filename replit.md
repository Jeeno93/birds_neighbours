# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the "Пернатые соседи" (Feathered Neighbors) mobile app — a community app for bird owners in Moscow to find trusted caretakers for their pets while traveling.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo (React Native) with expo-router

## Apps

### Pernatye Sosedi API (Backend для Amvera)
- Path: `artifacts/pernatye-sosedi-api/`
- Package: `pernatye-sosedi-api` (standalone, без `@workspace/*`-связей — деплоится отдельно через npm)
- Стек: Express 4 + pg (raw PostgreSQL) + TypeScript 5.3 (CommonJS)
- Endpoints: `/api/users`, `/api/birds`, `/api/sit-requests`, `/api/reviews`, `/health`
- Авторизация: заголовок `x-user-id` + middleware `requireAuth`
- Деплой: Amvera (`amvera.yml`), БД — PostgreSQL CNPG на Amvera
- Корневой скрипт: `pnpm run api` (= `pnpm --filter pernatye-sosedi-api run dev`)
- Подробности: `artifacts/pernatye-sosedi-api/DOCUMENTATION_API.md`

### Пернатые соседи (Mobile App)
- Path: `artifacts/pernatye-sosedi/`
- Package: `@workspace/pernatye-sosedi`
- Framework: Expo + React Native
- Storage: AsyncStorage (local, no backend)
- Maps: react-native-maps@1.18.0 (Expo Go compatible)

#### Key screens:
- **Onboarding** (6 steps): Welcome → Auth → Add Bird → Care Card → Profile → Map
- **Map tab**: Interactive map of bird owners in Moscow (native only, fallback for web)
- **Birds tab**: Manage your birds with care cards
- **Feed tab**: Articles and guides about bird care
- **Profile tab**: Your profile, help status, sit requests

#### Key features:
- Bird species selection (parrot corella, budgie, kakariki, canary, pigeon, other)
- Care cards with feeding, schedule, diseases, medications, catch notes, vet notes
- 6 mock neighbor profiles with ratings and Telegram links
- Sit requests (date range, district, bird selection)
- Rating system with review tags
- Help status (ready / sometimes / not now)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
