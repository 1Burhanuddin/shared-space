# shared-space — Roadmap

A shared collaborative workspace: sticky notes, todos, reminders, real-time sync,
and AI-powered expense tracking. Built with Next.js 15, Supabase, Shadcn/UI, and OpenAI.

## Architecture (frozen v1)

**Frontend:** Next.js 15 · TypeScript · TailwindCSS · Shadcn/UI
(base: next-shadcn-admin-dashboard) · next-pwa for installable mobile experience.

**Backend:** Supabase — Auth · PostgreSQL · Realtime · Storage · Row Level Security.

**AI:** OpenAI API — used only when needed (low-confidence expense parsing,
budget analysis, spending insights). Deterministic parsing handled by a lightweight
regex parser first to keep costs low.

**Deployment:** Vercel (frontend) · Supabase (backend).

## Cross-cutting standards

- UUID primary keys everywhere (`gen_random_uuid()`).
- Generated Supabase TypeScript types in `src/types/database.ts`.
- Soft delete (`deleted_at`) on notes and expenses, filtered out by default.
- Row Level Security on every table; membership checks via the
  `is_workspace_member(uuid)` SECURITY DEFINER helper to avoid policy recursion.
- Centralized `logActivity()` helper — no manual activity inserts scattered around.
- Centralized AI service layer under `src/lib/ai/`.
- Named color enums (not hex) mapped in the frontend (`NOTE_COLORS`).

## Versioned milestones

### v0.1 — Collaborative core
- Auth (email/password + Google)
- Workspace create / join (invites)
- Sticky notes (CRUD, colors, search)
- Todos
- Realtime sync
- Activity feed

### v0.2 — Money
- Expenses (CRUD)
- Categories
- Monthly reports & charts (Recharts)

### v0.3 — Intelligence
- AI expense parsing (regex first, OpenAI fallback)
- Budget assistant / spending analysis

### v0.4 — Engagement
- Reminders
- Notifications center (in-app, badge counts)

### v0.5 — Polish & extras
- Attachments
- Rich text (Tiptap)
- Themes / customization

## Definition of Done for v0.1

A release is complete only when:

1. A user can create a workspace.
2. Another user can join through an invite.
3. Both can create / edit notes.
4. Changes appear instantly (realtime).
5. Both can create / complete todos.
6. The activity feed updates automatically.
7. The app works on desktop and mobile browsers.
8. The app can be installed as a PWA.

## Non-goals for MVP

Voice notes · native mobile app · push notifications · file attachments ·
custom themes · rich text editor · recurring reminders.

Ship the collaborative workspace first; layer the rest on once it's used daily.

## Build order

Auth → Workspace create/join → Dashboard → Notes CRUD → Realtime → Todos → Expenses.
Do not touch AI until notes and expenses work reliably.
