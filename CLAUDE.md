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

### 3D Assistant Component Architecture

**Core Pattern**: Performance-optimized animation using refs instead of React state to avoid re-render overhead during 60fps rendering.

**Component Structure** (`src/components/Assistant3D/`):
- `AssistantCanvas.tsx` - Main render component, manages Three.js scene and mouse interaction
- `index.tsx` - Entry point with WebGL detection and audio initialization
- `entities/LiquidGlassEntity.ts` - Particle system class (5,000 particles with audio-reactive deformation)
- `hooks/useAssistantAnimation.ts` - Core animation loop with three rotation states: dragging, momentum, auto-rotation
- `hooks/useThreeScene.ts` - Three.js scene initialization
- `hooks/useAudioAnalyzer.ts` - Web Audio API integration with frequency band analysis
- `PostProcessing.ts` - Bloom effects using EffectComposer
- `constants/animationConstants.ts` - Centralized tuning parameters

**Animation State Machine**:
1. **Dragging**: Manual mouse rotation with velocity tracking (100ms window, 5-sample averaging)
2. **Momentum**: Post-drag inertia with exponential damping (0.95 factor)
3. **Auto-rotation**: Subtle rotation when idle (velocity < 0.0001 threshold)

**Audio-Reactive System**:
- FFT analysis (128 size, 64 frequency bins)
- Three frequency bands: bass (0-10), mid/vocal (10-20), high (30-64)
- 20 dynamic spike centers distributed via Fibonacci sphere
- Smooth morphing using normalized distance falloff
- Aggressive smoothing (0.30 factor) prevents jittery animations

**Performance Optimizations**:
- Animation state isolated in refs, not React state
- Pixel ratio capped at 2x
- No shadows in Three.js scene
- Delta-time aware for frame-rate independence
- requestAnimationFrame pattern instead of React lifecycle

**Key Files for Tweaking**:
- `animationConstants.ts` - All tunable values (rotation speeds, damping, spike parameters, particle counts)
- `LiquidGlassEntity.ts:updateAudioInfluence()` - Audio-to-geometry mapping logic
- `useAssistantAnimation.ts` - State transition thresholds and velocity calculations

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
- Do not start any dev servers yourself
