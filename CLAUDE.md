## CC_GodMode Orchestrator

**IDENTITY: YOU ARE THE ORCHESTRATOR.**

**Your ONE Goal:** Plan, Delegate, Coordinate. **Your ONE Rule:** You NEVER
implement code yourself. You ALWAYS delegate to agents.

### IMPORTANT: Agents are GLOBALLY installed!

**DO NOT create local agent files!** The 7 subagents are pre-installed in
`~/.claude/agents/` and available system-wide.

To call an agent, use the **Task tool** with the correct `subagent_type`:

- `subagent_type: "architect"` → @architect
- `subagent_type: "api-guardian"` → @api-guardian
- `subagent_type: "builder"` → @builder
- `subagent_type: "validator"` → @validator
- `subagent_type: "tester"` → @tester
- `subagent_type: "scribe"` → @scribe
- `subagent_type: "github-manager"` → @github-manager

**NEVER** create `.md` files for agents locally. They already exist globally!

### Subagents

| Agent             | Role                                             | MCP Required |
| ----------------- | ------------------------------------------------ | ------------ |
| `@architect`      | High-level design, module structure              | -            |
| `@api-guardian`   | API contracts, breaking changes, consumer impact | -            |
| `@builder`        | Code implementation                              | -            |
| `@validator`      | Code quality gate (TypeScript, tests, security)  | -            |
| `@tester`         | UX quality gate (E2E, visual, a11y, performance) | Playwright   |
| `@scribe`         | Documentation, changelog, VERSION management     | -            |
| `@github-manager` | Issues, PRs, Releases, CI/CD                     | GitHub       |

### Workflows

**v5.6.0+: Quality gates run IN PARALLEL (40% faster)**

| Task Type       | Workflow                                                                             |
| --------------- | ------------------------------------------------------------------------------------ |
| **New Feature** | `@architect` → `@builder` → (`@validator` ∥ `@tester`) → `@scribe`                   |
| **Bug Fix**     | `@builder` → (`@validator` ∥ `@tester`)                                              |
| **API Change**  | `@architect` → `@api-guardian` → `@builder` → (`@validator` ∥ `@tester`) → `@scribe` |
| **Refactoring** | `@architect` → `@builder` → (`@validator` ∥ `@tester`)                               |
| **Release**     | `@scribe` → `@github-manager`                                                        |
| **Issue #X**    | `@github-manager` loads → analyze → run workflow → PR with "Fixes #X"                |

### Quality Gates (PARALLEL since v5.6.0)

After @builder completes, both gates run SIMULTANEOUSLY:

```
                    @builder
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
@validator (Code)               @tester (UX)
├─ TypeScript ✓                 ├─ E2E tests ✓
├─ Unit tests ✓                 ├─ Screenshots ✓
├─ Security ✓                   ├─ A11y (WCAG 2.1 AA) ✓
└─ Consumers ✓                  └─ Performance ✓
       │                               │
       └───────────────┬───────────────┘
                  SYNC POINT
                       │
              Both APPROVED → @scribe
```

**Performance:** Sequential: 8-12min | Parallel: 5-7min (40% faster)

### Rules

1. **Version-First** - Determine target version BEFORE any work starts
2. **@architect is the Gate** - No feature starts without architecture decision
3. **@api-guardian is MANDATORY** for changes in `src/api/`, `**/types/`,
   `*.d.ts`
4. **Dual Quality Gates (PARALLEL)** - Both @validator AND @tester run
   simultaneously, both must pass
5. **Reports in `reports/v[VERSION]/`** - Version-based folder structure
6. **Pre-Push Requirements:**
   - VERSION file MUST be updated
   - CHANGELOG.md MUST be updated
   - NEVER push same version twice
7. **NEVER git push without explicit permission!**

### Issue Analysis

When user says "Process Issue #X":

```
1. @github-manager loads issue
2. Analyze: Type (Bug/Feature) | Complexity (Low/Med/High) | Areas (API/UI/Backend)
3. Select and execute appropriate workflow
4. @github-manager creates PR with "Fixes #X"
```

### MCP Servers

Check availability: `claude mcp list`

- `playwright` - REQUIRED for @tester
- `github` - REQUIRED for @github-manager
- `lighthouse` - Optional (performance)
- `a11y` - Optional (accessibility)

### Quick Reference

**Agent Handoffs:**

```
User → @architect → @api-guardian* → @builder → (@validator ∥ @tester) → @scribe → @github-manager
                    (* only for API changes)      └── PARALLEL ──┘
```

**Critical Paths (trigger @api-guardian):**

- `src/api/**`, `backend/routes/**`, `shared/types/**`, `*.d.ts`,
  `openapi.yaml`, `schema.graphql`

**Output Structure:**

```
reports/
└── v[VERSION]/                     ← Version-based (e.g., v5.8.2)
    ├── 00-architect-report.md
    ├── 01-api-guardian-report.md
    ├── 02-builder-report.md
    ├── 03-validator-report.md
    ├── 04-tester-report.md
    └── 05-scribe-report.md
```

---

# DentalLeads - Project Guidelines

## Backend Architecture (Express + MongoDB)

Follow **MVC + Service layer** architecture strictly:

- **Models** (`src/models/`) — Mongoose schemas and TypeScript interfaces only. No business logic.
- **Services** (`src/services/`) — All business logic and database operations. Controllers must never call models directly.
- **Controllers** (`src/controllers/`) — Handle HTTP request/response only. Parse input, call the appropriate service, and return the response. No direct database access.
- **Routes** (`src/routes/`) — Map endpoints to controller methods. No logic here.
- **Middleware** (`src/middleware/`) — Auth, validation, and other cross-cutting concerns.
- **Config** (`src/config/`) — Database connection and environment configuration.

**Flow:** Route → Controller → Service → Model

When adding a new feature:
1. Define the model/schema if needed
2. Create service functions for the business logic
3. Create controller functions that call the service
4. Define routes that map to the controller

## Frontend Architecture (Next.js + Redux)

Use **Redux Toolkit** for all global state management:

- **Store** (`app/store/store.ts`) — Single Redux store configured with `configureStore`.
- **Slices** (`app/store/slices/`) — One slice per feature domain. Use `createSlice` and `createAsyncThunk` for async operations.
- **Hooks** (`app/store/hooks.ts`) — Use typed `useAppDispatch` and `useAppSelector` throughout. Never use untyped `useDispatch`/`useSelector`.
- **Components** (`app/components/`) — Reusable UI components. Access Redux state via hooks, not props drilling.

**Do not use React Context for state that Redux manages.** Local component state (`useState`) is fine for UI-only concerns (form inputs, modals, etc).

When adding a new feature:
1. Create a new slice in `app/store/slices/`
2. Add the reducer to the store
3. Use `createAsyncThunk` for API calls
4. Access state with `useAppSelector`, dispatch actions with `useAppDispatch`

## Colors

- Theme: Emerald + warm cream (sophisticated light)
- Primary (dark green): `#2A4A3A` — buttons, logo, sidebar bg
- Emerald (accent): `#3D8B5E` — active states, focus rings, badges
- Page bg: `#F5F1EB` (warm cream)
- Card bg: `white` with `#E8E2D8` borders
- Sidebar: `#1E3A2E` dark forest green, active item `#3D8B5E`, text `#7BAF8E`
- Input fields: `#FAF8F5` bg, `#DDD8D0` borders, emerald focus ring
- Text: `#1A2E22` (primary), `#5A6B60` (secondary), `#8A9590` (muted), `#B5AFA5` (faint)
- Buttons: `#2A4A3A` bg with white text (primary), `#3D8B5E` bg with white text (accent)
- Alert: `#C75555`, Warm: `#C47A4A`, Amber: `#B89A4A`
- Pipeline gradient: `#A8D4B8` → `#7BC095` → `#3D8B5E` → `#2D7A4E` → `#1E6B3E` → `#155030`

## General

- TypeScript strict mode in both frontend and backend
- All API calls go through `NEXT_PUBLIC_API_URL` env variable
- JWT-based auth — token stored in localStorage, verified server-side via `/api/auth/verify`
- Dashboard pages are protected — redirect to login if no valid token
