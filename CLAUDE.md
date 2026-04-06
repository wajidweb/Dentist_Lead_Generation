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

- Primary accent: `#d1ff8f`
- Background (login/404): `#dfefdb`
- Background (dashboard content): `#f7faf5`
- Text: gray-900, gray-500, black
- Cards/Sidebar: white with gray-100 borders

## General

- TypeScript strict mode in both frontend and backend
- All API calls go through `NEXT_PUBLIC_API_URL` env variable
- JWT-based auth — token stored in localStorage, verified server-side via `/api/auth/verify`
- Dashboard pages are protected — redirect to login if no valid token
