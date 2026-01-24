# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

Monorepo with two main workspaces:
- `frontend/` - React app with TanStack Router, Query, and Tailwind
- `backend/` - Python app (minimal setup currently)

## Frontend (React + TanStack)

### Commands

```bash
# Development
cd frontend
pnpm install
pnpm dev          # Start dev server on port 3000

# Production
pnpm build        # Build and type check

# Quality
pnpm test         # Run Vitest tests
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm check        # Format and fix
```

### Architecture

**TanStack Router** - File-based routing in `src/routes/`:
- Routes auto-generate from files
- Layout in `__root.tsx` wraps all routes with `<Outlet />`
- Router context includes QueryClient for data fetching integration

**TanStack Query** - Data fetching setup:
- Provider configured in `src/integrations/tanstack-query/root-provider.tsx`
- QueryClient passed to router context in `main.tsx`
- Use loaders in routes or `useQuery` in components

**Path Alias**: `@/` maps to `src/`

**Devtools**: Unified TanStack devtools panel includes Router and Query panels

### Key Patterns

- Router context typed with `MyRouterContext` interface
- Routes use `createRootRouteWithContext` for type safety
- Demo files (prefixed with `demo`) can be deleted

## Backend (Python)

### Commands

```bash
cd backend
uv run main.py    # Run basic app
```

### Setup

- Requires Python >=3.13
- Uses uv as the package manager
- Minimal setup - no framework yet

## Development Notes

- Frontend uses pnpm for package management
- Git repo initialized, no main branch configured yet
