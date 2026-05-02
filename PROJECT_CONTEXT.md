# Project context — ticketing frontend (ABSAI)

**Read this file first** when working in this repository. It summarizes the app architecture, conventions, and how to use the local skill libraries under `.cursor/skills/`.

---

## 1. What this repo is

- **Single Vite + React SPA** at the repo root (`npm run dev` → **http://localhost:3000**).
- **Marketing / Tik landing:** `src/landing/` — shown at **`/`** when the user is **not** logged in. Logged-in users see the usual home inside `Layout`. Plans load from `GET /subscriptions/plans` (see `src/landing/lib/plans.ts`). Signup posts through the same origin to **`/register-company`**.
- **Product UI:** `src/components/` (MUI app shell, tickets, chat, etc.).
- **Default API:** `https://ticketing-backend-general.vercel.app/api` unless overridden by **`VITE_API_BASE_URL`** (see `.env.example`).

---

## 2. Bundled skills (use these deliberately)

### 2.1 UI/UX Pro Max — `.cursor/skills/ui-ux-pro-max/`

- **Purpose:** Design systems, accessibility, typography/color, UX checklists, stack-specific hints.
- **Entry:** `SKILL.md` (priority order: a11y → touch → performance → layout → typography → animation).
- **This project’s UI stack:** **React 19 + MUI v7** (primary), **Tailwind 3** (utilities in places), **Lucide** icons, **emoji-picker-react** for chat. Not shadcn-first; for `--stack` searches prefer **`react`**; use **`html-tailwind`** only where Tailwind-only patterns apply.
- **Design-system CLI (from repo root):**

  ```bash
  python .cursor/skills/ui-ux-pro-max/scripts/search.py "<product + keywords>" --design-system -p "Ticket ABSAI"
  ```

  Optional: `--domain ux`, `--stack react`, `-f markdown`. Persist with `--persist` per `SKILL.md`.

- **Pre-delivery:** No emoji-as-icons for chrome (SVG/Lucide), contrast, focus rings, `prefers-reduced-motion`, touch targets, consistent hover/cursor — see `SKILL.md` checklist.

### 2.2 TRAE-Skills — `.cursor/skills/TRAE-Skills/`

- **Purpose:** Large reference library (architecture, frontend, backend, security, testing, DevOps). Not app-specific code.
- **Entry:** `README.md` — full skill index with paths (e.g. `frontend/API_Data_Fetching_TanStack.md`, `architecture/Frontend_Backend_Communication_Patterns.md`, `security/JWT_Authentication.md`).
- **How to use:** When a task touches auth, API design, RBAC, i18n, testing, etc., open the **closest matching markdown** under the relevant folder rather than guessing patterns.

---

## 3. Tech stack & tooling

| Area | Choice |
|------|--------|
| Build | Vite 7, `@vitejs/plugin-react` |
| UI | MUI (`@mui/material`, emotion), MUI X Date Pickers, MUI Lab |
| Routing | `react-router-dom` v7 (`BrowserRouter`, `Routes`, `Route`) |
| HTTP | `axios` (shared instance + `loginApi` for login without 401 redirect loop) |
| Realtime | `socket.io-client` (`src/services/socketService.js`) |
| i18n | `src/i18n.js` — dictionaries + `getStoredLanguage`; `lang` / `language` in `localStorage` |
| Tests | Vitest, Testing Library (`npm test`) |
| Lint | ESLint 9 (`npm run lint`) |
| PWA | Service worker registration in `src/index.js`, `public/` |

**Note:** Most source is `.js` / `.jsx`; a small upload surface uses `.ts` / `.tsx` (`FileUploader`, `useBunnyUpload`, `types/upload.ts`).

---

## 4. Application structure

### 4.1 Bootstrap

- **`index.html`** → **`src/index.js`** → **`App.js`**
- **`App.js`:** `ThemeProvider` + `CssBaseline` → `AuthProvider` → `NotificationProvider` → `ChatProvider` → `Router` → routes.
- **Language / direction:** `App` syncs `document.documentElement` `lang` and `dir` (`ar` → RTL) from stored language and listens for `language-changed` + `storage`.

### 4.2 Routing (all authenticated app routes use `Layout` except public auth)

| Path | Screen |
|------|--------|
| `/login`, `/register-company`, `/forgot-password` | Auth (redirect if already logged in) |
| `/accept-invite` | Invite acceptance (not wrapped in `ProtectedRoute` in `App.js`) |
| `/` | `Home` |
| `/project/:projectId` | `ProjectDetails` |
| `/project/:projectId/new-ticket` | `NewTicket` |
| `/ticket/:ticketId/edit` | `EditTicket` |
| `/settings` | `Settings` |
| `/chat` | `Chat` |
| `/attendance` | `AttendancePage` |
| `/subscription` | `SubscriptionPage` |
| `*` | Redirect to `/` |

**Important:** `Routes` is keyed by `user.activeCompanyId` so the tree remounts when the active company switches.

### 4.3 Contexts

- **`AuthContext`:** `user`, `token` in `localStorage`; JWT payload used for `activeCompanyId`; `switchActiveCompany` refreshes token via API.
- **`NotificationContext`:** App notifications (see `components/notifications/`).
- **`ChatContext`:** Chat state (see `components/chat/`).

### 4.4 Layout & chrome

- **`Layout.js`:** Shell around pages.
- **`AppBar.js` / `AppDrawer.js`:** Navigation, company switch, links to Home, Chat, Attendance, Subscription, Settings.

### 4.5 Feature folders (`src/components/`)

| Folder | Role |
|--------|------|
| `auth/` | Login, register company, forgot password, accept invite, `ProtectedRoute` |
| `home/` | Dashboard / home |
| `project/` | Project details |
| `ticket/` | New/edit ticket, comments, reply |
| `admin/` | Assign users, add project dialogs |
| `chat/` | List, window, thread, message input, voice, new conversation |
| `attendance/` | Page + widget |
| `subscription/` | Plans / Paymob flow |
| `settings/` | User/settings UI |
| `notifications/` | `NotificationBell` etc. |
| `upload/` | Bunny Stream/Storage upload (`FileUploader.tsx`, `useBunnyUpload.ts`) |
| `ui/` | Shared primitives: `Button`, `Input`, `Card`, `Modal`, `Alert`, `Badge`, `Spinner` |

### 4.6 API layer (`src/services/api.js`)

- **Base URL:** `VITE_API_BASE_URL` or default Vercel backend (see §1).
- **Request:** Sends `Authorization: Bearer <token>` and **`x-lang`** from `localStorage` (`ar` default).
- **401/403:** Clears session and redirects to `/login` except: on login page, login POST, or blob/report downloads (caller handles errors).
- **Exported groups:** `authAPI`, `userAPI`, `projectAPI`, `ticketAPI`, `uploadAPI`, `chatAPI`, `attendanceAPI`, `subscriptionAPI` (+ `loginApi` for login).

### 4.7 Theming (`src/theme.js`)

- MUI `createTheme`: primary `#0e1121`, secondary `#fe5008`, Roboto-first typography, softened buttons/cards.

### 4.8 Styling

- **`src/index.css`:** Global styles; **Tailwind** (`tailwind.config.js`).
- **`src/App.css`:** App-level CSS.

---

## 5. Environment & scripts

- **Env:** Use `VITE_API_BASE_URL` for local or alternate backends (never commit secrets).
- **`npm run dev` / `start`:** Vite dev server (**3000**).
- **`npm run build`:** Output → **`build/`**.
- **`npm run preview`:** Preview production build.

---

## 6. Conventions for agents

1. **Match existing patterns:** Prefer MUI + existing `components/ui` over new dependency stacks unless the user asks otherwise.
2. **Auth:** Use `useAuth()`; API calls go through `api` from `services/api.js` so interceptors apply.
3. **i18n:** Add strings to `src/i18n.js` dictionaries (`en` / `ar`) and respect RTL layout when adding layouts.
4. **Company scope:** Many operations depend on `activeCompanyId`; switching company remounts routes.
5. **Uploads:** Video vs other files may hit Bunny Stream vs Storage — follow `FileUploader` / `useBunnyUpload` behavior.
6. **UI polish:** Cross-check changes with **ui-ux-pro-max** checklist (a11y, contrast, motion, icons).

---

## 7. Maintenance

- When major features, routes, or API surface areas change, **update this file** in the same PR so it stays the single overview.
- TRAE-Skills and ui-ux-pro-max are **reference libraries**; the **source of truth for behavior** remains this repo’s code and the live backend contract.

---

*Generated for agent/human orientation. Last reviewed against codebase layout: 2026-05-02.*
