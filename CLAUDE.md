# Todoist Clone

Building a clone of [Todoist](https://www.todoist.com/). Goal: an **exact** UI clone (pixel-faithful, not "inspired by") backed by a real collaborative backend.

---

## Tech Stack (LOCKED)

### Frontend
- **React + JavaScript** (not TypeScript — chosen for lower learning load; may migrate later, TS adoption is incremental)
- **Vite** (build tool / dev server, runs on `localhost:5173`)
- **Tailwind CSS** — total visual control, required for an exact pixel clone (a pre-styled library like MUI would fight us, so MUI is out)
- **shadcn/ui** — component *behaviors* (dropdowns, dialogs, date pickers, drag handles) as code we own and restyle freely
- **dnd-kit** (`@dnd-kit/core` + `/sortable` + `/utilities`) — drag-and-drop engine for task reorder/nesting (sortable-tree pattern; chosen over @hello-pangea/dnd for arbitrary nesting + custom drop indicator). Added 2026-06-18.
- **TanStack Query** — server-state: caching, refetch, optimistic updates (instant task check-off feel; refetch-on-focus is our cheap stand-in for real-time pre-WebSocket)
- **React Router** — routing

### Backend
- **Spring Boot**, **Maven**, **Java 17** (LTS; installed in env. Originally planned 21 but 17 is fully capable for our needs — we don't use virtual threads. Switchable later.)
- **JPA / Hibernate** for data access (user has experience here). jOOQ considered and rejected.
- Runs on `localhost:8080`

### Database
- **PostgreSQL** (relational integrity for project members + task hierarchies; recursive queries for sub-tasks)

### Auth (LOCKED)
- **JWT** (Spring Security). Two ways in: **Google OAuth2** AND **email/password**.
- **REVISED 2026-06-17:** Google is the only *OAuth provider* (Facebook/Apple buttons OMITTED), but **email/password is also a real, working method** (matches Todoist's actual login/signup forms). The earlier "Google-only, no email/password" lock is superseded.
- Email/password: BCrypt-hashed `password_hash` on `users`; `google_id` is nullable (email/password users have none). Endpoints: `/api/auth/register`, `/api/auth/login`.
- Flow (Google): sign in with Google → server finds/creates user → server issues **our own JWT**. Flow (email/pwd): register/login → verify → same JWT cookie.
- **Token storage: httpOnly cookie** with `SameSite=Lax` and `Secure`.
  - Rationale: JS cannot read an httpOnly cookie, so an XSS bug can't steal the token (the localStorage weakness). Browser attaches it automatically → simpler React code. `SameSite=Lax` neutralizes CSRF in one line. This is the security best-practice that serious production apps use.
  - **Later upgrade (not day one):** short-lived access token in memory + long-lived refresh token in httpOnly cookie. Design auth cleanly now so this upgrade is painless.

### Real-time
- **Polling first** (TanStack Query refetch-on-focus). Add **SSE or WebSocket/STOMP** when collaboration features turn on. Don't build real-time before there are two users.

---

## Scope & Phasing

### Build order (LOCKED — focused MVP)
Build these sidebar features first, **in this order**, and get them working properly before touching the rest:
1. **Add task** (global add button → adds to the CURRENTLY-OPEN project/view; Inbox only when you're in Inbox / no project context)
2. **Search**
3. **Inbox**
4. **Projects** (create projects, add/list/complete tasks within them)

**Deferred until the above work:** Today · Upcoming · Filters & Labels (view) · Reporting.

**Labels: IN SCOPE** (decided 2026-06-17). Per-user tags written with `@`, span all projects, added to a task via the composer "⋯" menu → Labels. Schema: `Label` (per-user) + `TaskLabel` join. UI references incoming. (Exact build position relative to the 4 MVP features TBD — likely after Projects.)

### Inbox behavior (confirmed)
- Inbox IS a real Project under the hood (`isInbox=true`) so all task code works on it with zero special-casing.
- It has the name "Inbox", but the user **cannot rename, delete, OR share it** (no Share / add-members — Inbox is personal, always exactly one member = the owner; regular projects can have many members). Hide the Share button for Inbox.
- Shown at the TOP of the sidebar (near Search), NOT in the "My Projects" list.
- One Inbox auto-created per user on signup.
- The global "Add task" button is CONTEXT-AWARE: it adds to whatever project/view you're currently in (adds to Inbox only when you're viewing Inbox, or as fallback when there's no project context).

### Sub-tasks (confirmed)
- A sub-task is a normal Task with `parentTaskId` pointing to its parent (self-reference). Top-level tasks have `parentTaskId = null`. Allows nesting.

---

Target: **MVP + signature features**, with a **collaboration-ready schema from day one** (collaboration is a property of the schema, not a bolt-on feature). Key principle: tasks belong to a `project`, projects have *members* with roles — so "solo use" is just "a project with one member," and collaboration is already wired in.

1. **Foundation** — Auth (Google + JWT cookie), collaboration-ready schema, projects/inbox, tasks (due date, priority, description)
2. **Feels like Todoist** — Today/Upcoming/Filter views, sub-tasks, sections, labels, natural-language date parsing
3. **Collaboration ON** — invites, project members + roles, task assignees, comments, real-time (SSE/WebSocket)
4. **Advanced** — recurring tasks, reminders, karma/gamification

Platform: **Web only** (responsive).

---

## Signature features to remember
- Natural-language date parsing ("submit report tomorrow at 5pm every week") — trickiest feature, decide client- vs server-side later
- Priorities P1–P4
- Views: Today, Upcoming, Inbox
- Labels + Filters (e.g. "p1 & overdue & @home")
- Projects with sections, nested sub-tasks

---

## UI Reference (build to match exactly)

Goal is a pixel-faithful clone. Notes below are from real app screenshots. **Text can't capture exact hex/spacing — ALWAYS open the actual image files in `docs/ui-reference/` before building a screen** and match them directly. For any screen not yet captured, ask the user for a fresh screenshot.

**Reference image files (open these while designing):**
- `docs/ui-reference/project-view.png` — project view: sidebar + task list + top bar
- `docs/ui-reference/add-task-popup.png` — global Add-task modal popup (over Inbox page)
- `docs/ui-reference/add-task-popup-closeup.png` — close-up of the popup card
- `docs/ui-reference/date-picker.png` — date picker (Type-a-date, quick options, calendar, Time/Repeat)
- `docs/ui-reference/priority-dropdown.png` — priority dropdown (P1 red / P2 orange / P3 blue / P4 gray)
- `docs/ui-reference/composer-more-menu.png` — composer ⋯ menu (Labels @, Location, Deadline…)
- `docs/ui-reference/task-detail-view.png` — task detail modal (props panel: Project/Date/Priority/Labels…)
- `docs/ui-reference/task-detail-edit.png` — task detail modal, title/description edit state
- _(MISSING: `add-task-composer.png` — inline composer expansion; was deleted. Re-shoot if wanted; low priority, internals same as add-task-popup.png)_
- `docs/ui-reference/task-context-menu.png` — task "⋯" menu (date row, priority flags…)
- `docs/ui-reference/project-context-menu.png` — project "⋯" context menu (favorites/archive/delete…)
- `docs/ui-reference/login.png` — "Welcome back!" login page (two-column)
- `docs/ui-reference/sign-up.png` — "Sign up" page (two-column)

### Brand / colors
- Brand red ~`#dc4c3e` (Add task, selected project text, overdue/Today counts, primary buttons)
- Sidebar background: very light gray; main content: white
- Selected project row: light **peach/pink** background + red text
- Muted gray for secondary text, counts, date chips, "+ Add task"

### Sidebar (~250px)
- Top: green circle avatar "R" + workspace name + ▾, then bell (notifications) + panel-toggle icon
- **+ Add task** (red icon + red text), red audio/waveform icon far right of that row
- Nav items (outline icon + label + right-aligned count): **Search** · **Inbox** `3` (gray count) · **Today** `6` (**red** count) · **Upcoming** · **Filters & Labels** · **Reporting**
  - Today's calendar icon shows the current day number (e.g. "17")
  - Only Today's count is colored (red); others gray
  - **Hover state:** hovered nav row gets a **light gray rounded highlight background**, and a **dark tooltip appears to its right** (e.g. "Go…" — navigation/keyboard-shortcut hint). Selected row uses the peach/red treatment (distinct from the gray hover).
  - Top bell icon shows an **orange dot** when there are unread notifications.
- **"My Projects"** section header, projects below with `#` icon + label + count (e.g. "Getting Started 👋 14")
  - **Hover state:** default shows just the "My Projects" label; on hover, a **`+`** (add new project) and a **`˅` chevron** (collapse/expand the projects list) appear on the right of the header. (Same reveal-on-hover pattern likely applies to individual rows → the project "⋯" menu.)
- Selected project = peach background, red text
- Bottom: **? Help & resources**

### Top bar (main area)
- Left: breadcrumb e.g. "My Projects /"
- Right: **Share** · **Display** · comment icon · **⋯**

### Content / task list
- Big bold view/project title
- Task row: circular **checkbox** (thin border, color = priority), task name; below it a small muted **date chip** (calendar icon + "1 Jul")
- **"+ Add task"** below the list (muted gray text, red `+`)
- **Task row hover state:** a **drag handle (⠿)** appears on the FAR LEFT (reorder), and on the RIGHT a row of action icons: **✏️ Edit · 🗓️ Schedule(date) · 💬 Comment · ⋯ More**. Each is a shortcut:
  - ✏️ Edit → expands the task **inline into the composer** (same fields) with a red **Save** button (instead of "Add task"). Editing happens in place.
  - 🗓️ Schedule → opens the reusable **date picker** (see date-picker.png).
  - 💬 Comment → opens the **task detail modal** with cursor focused in the Comment box.
  - ⋯ More → the task context menu (see task-context-menu.png).

### Sections (within a project / Inbox)
- A project or Inbox can contain **Sections** — named headings that group tasks (e.g. "IMP").
- Section header: **collapse chevron (˅)** on left + name + **⋯ menu** on right (hover); each section has its **own "+ Add task"**.
- Confirms the `Section` entity in the domain model (project → sections → tasks).

### Comment composer (in task detail)
- Comment input with toolbar: **📎 attach · 🎤 voice · 😀 emoji · 🧩 extension**, plus **Cancel / Comment** (red) buttons.

### Add-task composer — TWO presentations, same internals
1. **Inline** ("+ Add task" inside a list) — expands in place within the task list. See `add-task-composer.png`.
2. **Modal popup** (global "Add task" in sidebar) — centered card floating over whatever page you're on; works from any view. See `add-task-popup.png` / `add-task-popup-closeup.png`.

Shared internals (both):
- Task-name input (top), **Description** field below
- When empty, the input shows a **rotating gray placeholder example** task string (e.g. "Submit essay on AI by Thursday p1", "Go to the market Saturday morning") — these are SUGGESTIONS, not typed text. Do NOT assume these demonstrate live NLP highlighting; that wasn't verified from screenshots.
- Action buttons row: **Date · Priority · Attachment · Reminders · ⋯** (order varies slightly)
- Bottom-left: project selector (`# <project>` ▾) — **defaults to the currently-open project/view** (Inbox only when you're in Inbox or there's no project context); bottom-right: **Cancel** · **Add task** (Add task button is light/disabled pink until input is valid)

#### Date picker (click **Date**) — see date-picker.png (not yet saved)
- Top: **"Type a date"** text field — natural-language input happens HERE (confirmed). (Title-field auto-parse NOT verified — don't assume.)
- Quick options: **Today** (shows weekday) · **Tomorrow** · **This weekend** (Sat) · **Next week** (e.g. Mon 22 Jun)
- Calendar grid (today highlighted red), scrollable by month
- Bottom buttons: **Time** (add specific time) · **Repeat** (recurring rules)

#### Priority dropdown (click **Priority**) — see priority-dropdown.png (not yet saved)
- **Priority 1** red flag · **Priority 2** orange · **Priority 3** blue · **Priority 4** gray/plain flag
- **P4 is the default** (lower number = higher urgency)

#### "⋯" more menu in composer — see composer-more-menu.png (not yet saved)
- **Labels** (`@` syntax — tag a task; this is where Labels are added) · **Location** · **Deadline** · **Add extension…** · **Edit task actions**

### Task detail modal (click a task to open) — see task-detail-view.png / task-detail-edit.png
- **Header:** breadcrumb (project name + icon) · up/down arrows (prev/next task) · ⋯ menu · ✕ close
- **Left main column:** circle checkbox + bold task **title** → **Description** (≡ icon) → **+ Add sub-task** → divider → **Comment** box (user avatar + input + 📎 paperclip attach)
- **Right sidebar panel (task properties):** **Project** · **Date** (+) · **Deadline** ⊛ 🔒 · **Priority** (P4) · **Labels** (+) · **Reminders** (+) · **Location** ⊛ 🔒
- **Edit state:** clicking the title/description swaps the top into an editable bordered box (title + description) with **Cancel / Save** (red) buttons. Editing is inline within the detail modal.
- **Premium (🔒) features:** Deadline and Location are paid in real Todoist, and Deadline ≠ Date (separate field). DECISION: defer both — Location entirely, Deadline post-MVP. Core task properties for us: Date, Priority, Labels.
- Confirms schema: task **Comments** and **sub-tasks** are real, both already in domain model.
- **Component REUSE (important):** the Date and Priority controls in this detail panel open the SAME pickers as the add-task composer (`date-picker.png`, `priority-dropdown.png`). Build DatePicker, PriorityDropdown (and likely LabelPicker) as **reusable components once**, used by both the composer AND the task-detail panel. Don't duplicate.

### Attachments & Reminders (composer features)
- **Attachment** = attach files/images to a task → implies a future `Attachment` entity (DEFERRED, post-MVP).
- **Reminders** = notification/alert on a task; user unsure of exact behavior (maybe calendar-linked) → PARKED, discuss later. DEFERRED.

### Task "⋯" context menu
Opened via the hover row's **⋯ button** (tooltip on hover: "More actions").
Add task above / Add task below / Edit (`Ctrl E`) / **Date** quick-row (today `17`, tomorrow ☀️, weekend 🛋️, next week →, no-date ⃠, more ⋯) [shortcut `T`] / **Priority** flag row (red P1, orange P2, blue P3, plain P4) [shortcut `Y`] / Deadline (`D`) / Reminders / Move to (`V`) / Duplicate / Copy link to task (`⇧Ctrl C`) / Add extension / Delete (`⇧Delete`)

### Project "⋯" context menu (sidebar project row)
Add project above / below · Edit · **Add to favorites** · Move · Duplicate · Share · Copy link to project · View activity · Save as template · Browse templates · Add extension · Import from CSV · Export to CSV · Email tasks to this project · Project calendar feed · **Archive** · Delete
- Schema-relevant: favorites → `Project.isFavorite`; archive → `Project.isArchived`; add-above/below + move → `Project.position` + `Project.parentProjectId` (nesting). Rest are Phase 4+ features, no core-schema impact.

### Auth pages — Login & Sign up (two-column)
Both pages share ONE layout; build as a single component with props for heading/button/links/art.
- **Left column (white):** todoist logo (red stacked-bars icon + "todoist" wordmark) → big heading → social buttons → divider → Email field → Password field (with eye/show toggle) → full-width **red** primary button → Terms of Service / Privacy Policy fine print → divider → cross-link to the other page.
- **Right column:** rounded **cream/peach** panel (~60% width) with marketing artwork.

| | Sign up | Login |
|---|---|---|
| Heading | "Sign up" | "Welcome back!" |
| Hint | — | "You used Google last time." |
| Primary button | "Sign up with Email" | "Log in" |
| Extra link | — | "Forgot your password?" (red) |
| Cross-link | "Already signed up? Go to login" | "Don't have an account? Sign up" |
| Right art | phone mockup + "Ramble" voice promo | calendar/phone/flower illustration + QR code |

**SCOPE DECISION (REVISED 2026-06-17):** auth pages render **Continue with Google + email/password form** (both working). **Facebook & Apple buttons are OMITTED.** "Forgot your password?" link shown on login but reset flow is deferred (non-functional placeholder for now). See Auth section above.

### Screenshots still needed (capture just-in-time, per view)
Today view · Upcoming (calendar-style) · Filters & Labels · Inbox · a task with real NLP input typed (to verify parsing UI)

---

## Domain Model (FINALIZED — collaboration-ready)

Core principle: **tasks never belong to a user directly — they belong to a Project, and Projects have members.** So "solo use" = a project with one member; sharing is already wired in. Inbox = a Project with `isInbox=true` (personal, never shared).

### Entities
- **User** — `id`, `email`, `name`, `avatarUrl`, `googleId`, `createdAt`
  - No password (Google-only auth). `googleId` links the Google identity.
- **Project** — `id`, `name`, `color`, `ownerId→User`, `parentProjectId→Project` (nullable, nesting), `position`, `isInbox`, `isFavorite`, `isArchived`, `createdAt`
  - One Inbox auto-created per user on signup. Inbox: can't rename/delete/share.
- **ProjectMember** — `id`, `projectId→Project`, `userId→User`, `role` (OWNER | MEMBER)
  - The join table that enables collaboration / authorization ("can this user see this project?"). Inbox never gets extra members.
- **Section** — `id`, `projectId→Project`, `name`, `position`
  - Named groupings of tasks within a project/Inbox (e.g. "IMP").
- **Task** — `id`, `projectId→Project`, `sectionId→Section` (nullable), `parentTaskId→Task` (nullable, sub-tasks), `content`, `description`, `priority` (1–4, default 4), `dueDate` (nullable), `dueTime` (nullable), `isCompleted`, `completedAt` (nullable), `position`, `assigneeId→User` (nullable), `createdById→User`, `createdAt`
  - `parentTaskId` self-reference = sub-tasks (nestable). `assigneeId` = collaboration. `position` = manual ordering.
- **Label** — `id`, `userId→User`, `name`, `color`
  - Per-user, span all projects, written with `@`.
- **TaskLabel** — `taskId→Task`, `labelId→Label` (join; a task has many labels)
- **Comment** — `id`, `taskId→Task`, `userId→User`, `content`, `createdAt`

### Relationships
- User ──owns──< Project ──has──< Task
- Project >──members──< User (via ProjectMember, with role)
- Project ──has──< Section ──groups──< Task
- Task ──self──< Task (sub-tasks via parentTaskId)
- Task >──labels──< Label (via TaskLabel)
- Task ──has──< Comment

### Deliberately deferred (schema won't fight us when added)
Recurring rules (Repeat), Reminders, Deadline (≠ Date, premium), Location (premium), Attachments, Karma/activity log. Add fields/tables in later phases.

---

## Implementation Plan (LOCKED — build thin VERTICAL slices, DB→API→UI)

**Phase 0 — Scaffolding & plumbing. ✅ DONE.** Spring Boot (Maven, Java 17: Web, Data JPA, Security, Postgres driver, Flyway, Lombok, validation; package-by-feature). Postgres via Docker Compose. Vite + React/JS + Tailwind + shadcn/ui + TanStack Query + React Router + axios. CORS + cookie config (:5173 ↔ :8080). Smoke test: `/api/health` fetched & rendered.

### Repo layout & how to run (as built in Phase 0)
```
todoist/
  backend/            Spring Boot 4.1.0, Java 17, Maven (com.todoist)
  frontend/           Vite 8 + React (JS), Tailwind v4, TanStack Query, axios
  docker-compose.yml  PostgreSQL 16 (db/user/pass = todoist)
  docs/ui-reference/  screenshots
```
- **Postgres** runs on host port **5433** (→ container 5432) to avoid clashing with an existing local Postgres on 5432. DB url: `jdbc:postgresql://localhost:5433/todoist`.
- **Run:** `docker compose up -d` · backend `cd backend && ./mvnw spring-boot:run` (:8080) · frontend `cd frontend && npm run dev` (:5173).
- **Backend config:** `application.yml` — Flyway owns schema (`ddl-auto: validate`), `open-in-view: false`, CORS origins in `app.cors.allowed-origins`.
- **Key files:** `config/SecurityConfig.java` (Phase-0 permit-all + CORS w/ credentials — will lock down in Phase 2), `health/HealthController.java` (`/api/health`). FE: `src/lib/api.js` (axios, `withCredentials: true`), `main.jsx` (QueryClientProvider), `src/App.jsx` (health smoke test).
- **Boot 4 note:** starters renamed (`spring-boot-starter-webmvc`, split `-test` starters). No `tailwind.config.js` — Tailwind v4 uses `@import "tailwindcss"` in `index.css` + `@tailwindcss/vite` plugin.
- **shadcn/ui NOT yet initialized** (deferred to when first real component is needed).

**Phase 1 — Domain model & migrations. ✅ DONE.** JPA entities + Flyway scripts for the finalized model above. Spring Data repositories.
- **PKs are UUID** (opaque/non-enumerable, fits sharing; via `gen_random_uuid()` + `@GeneratedValue(strategy=UUID)`). Switching ID type later avoided by deciding now.
- Migration: `db/migration/V1__initial_schema.sql` (8 tables + FKs + indexes; `ON DELETE CASCADE` for project→children, parent_task→subtasks, task→comments/labels; `SET NULL` for section/assignee). `priority` CHECK 1–4.
- Entities (package-by-feature): `user.User`, `project.{Project,ProjectMember,Section,ProjectRole}`, `task.{Task,Comment}`, `label.Label`. `@ManyToOne(LAZY)` associations; Task↔Label is `@ManyToMany` via `task_labels`. Timestamps = `OffsetDateTime` (↔ timestamptz), strings = `varchar`. Hibernate `validate` passes against the Flyway schema.
- Repos: Spring Data `JpaRepository<Entity, UUID>` per entity (e.g. `findByOwnerIdAndInboxTrue`, `findByProjectIdAndParentTaskIsNullOrderByPosition`).

**Phase 2 — Auth (first vertical slice). ✅ BUILT (email/pwd verified; Google pending creds).** Google OAuth2 AND email/password → issue JWT → httpOnly `SameSite=Lax` cookie; `JwtCookieAuthFilter` validates. `/api/me`, `/api/auth/{register,login,logout}`. Auto-create Inbox on first signup. FE: two-column Login/Sign-up (Google + email/password form, FB/Apple omitted), router, `RequireAuth` guard, `useMe`. 
- Email/password flow fully verified via curl. **Google flow blocked on a live OAuth client** (env `GOOGLE_CLIENT_ID` pointed at a deleted client → `deleted_client`; user to recreate in Google Console, redirect URI `http://localhost:8080/login/oauth2/code/google`).
- Login page styling is first-pass; pixel-tune against `login.png`/`sign-up.png` in Phase 3. Temporary `HomePage` placeholder until the real shell.

**Phase 3 — App shell.** Sidebar (header, Add task, Search, nav items, My Projects) with hover states/tooltips; non-MVP items render inert. Top bar, content region, routing skeleton. ✅ Pixel-tune vs `project-view.png`.

**Phase 4 — Tasks in a list (core engine) = Inbox.** Task CRUD (scoped to project/members). FE: task list, task row (checkbox, priority color, date chip, hover actions), optimistic complete via TanStack Query. **Reusable components: `DatePicker`, `PriorityDropdown`, `TaskComposer`.** Add task (inline + global modal, context-aware default project). Inline edit (✏️→Save). Task ⋯ menu. Point Inbox route here. ✅ Inbox fully works.

**Phase 5 — Projects. ✅ + extended.** Project CRUD (create/rename/archive/favorite/delete), project ⋯ menu, sidebar list. Sections. Sub-tasks (`parentTaskId`). Task detail modal (props panel, comments, sub-tasks, inline edit).
- **Added 2026-06-18:** "My Projects" landing page (`/projects` — search filter, archived-only toggle, Add). Full project ⋯ context menu matching `project-context-menu-full.png` (add above/below w/ `position` insert, Copy link, Archive wired; templates/CSV/calendar-feed/Move/Duplicate rendered inert = Phase 8). Sidebar "My Projects" header is now a link (hover + collapse chevron).
- **Drag-and-drop task nesting (dnd-kit). ✅ drag/drop + drop-indicator confirmed working (2026-06-18):** flat task list now includes sub-tasks (+ per-task `subtaskDone/Total` for the `0/N` indicator); `PATCH /api/tasks/{id}/move` (parent/section/position, cycle-guarded, sibling reindex). FE tree in `tasks/TaskTree.jsx` + `tasks/treeUtils.js`: indent, collapse, DragOverlay, optimistic `useMoveTask`. Works in Inbox + projects (shared `TaskListView`/`SectionBlock`). Cross-section drag deferred. **Orange drop-indicator (locked):** at the projected nesting depth it OVERLAYS the row's gray divider on the same Y — short gray segment, then the orange circle, then the orange line to the row end (Todoist-style); rendered at the top of the drop gap (`pb-7`, `top:-1px`), `base = depth*INDENT + GUTTER`. **Nesting cap (locked):** `MAX_DEPTH = 4` (0-indexed → 5 levels; set 3 for a 4-level limit). The drag projection clamps to the cap AND subtracts the dragged task's own sub-tree height, so a dragged branch can't push its children past the limit. Drag-side only — backend `move` + detail-modal "Add sub-task" are not yet guarded.
  - _Still tuning (NOT yet locked): row indentation amounts, the `-ml-6` handle hover-zone, sidebar collapse — leave these out of "done" until confirmed._

**Phase 6 — Search & Labels.** Search (tasks/projects). Labels (`Label`/`TaskLabel`, `@` picker in composer + detail panel) — after Labels-picker UI is captured.

**Phase 7 — Collaboration. 🚧 STARTED 2026-06-18.** Project sharing/invites, `ProjectMember` roles, assignees, member-visible comments. Real-time via SSE/WebSocket (replaces refetch-on-focus).
- **Done:** functional **Share by email** — `GET/POST /api/projects/{id}/members`, `DELETE …/members/{userId}` (`MemberDto`/`AddMemberRequest`). Add = member-only, looks up invitee via email (404 unknown / 409 dup / 400 Inbox); remove = owner-only, can't remove OWNER. Invitee sees the project automatically (list is membership-based). FE: `projects/ShareDialog.jsx` + `api/members.js`, opened from the project ⋯ menu and the top-bar Share button (hidden on Inbox).
- **Still pending:** assignees, member-visible comment surfacing, real-time (SSE/WebSocket).

**Phase 8 — Deferred.** Today, Upcoming, Filters, Recurring, Reminders, Deadline/Location, Reporting/Karma, attachments.

**Throughout:** after each screen, a pixel-tuning pass against saved screenshots. Getting real hex colors + font name from DevTools would cut tuning iterations.

---

## Open / TBD
- Maven project structure details (settle in Phase 0)
- Natural-language date parsing approach (client vs server) — Phase 4/6
- Labels-picker UI screenshot still needed before building Labels (Phase 6)
- Exact hex colors + font family (capture from Firefox DevTools for pixel-exact)
- Reminders behavior (parked — discuss before Phase 8)

---

## User context
- Has experience: JPA/Hibernate, Maven, Java/Spring backend
- Less familiar with: modern React ecosystem (TanStack Query, shadcn/ui were new) — explain frontend concepts more, assume backend knowledge
- Wants explanations to go slow on unfamiliar concepts; prefers understanding over speed
