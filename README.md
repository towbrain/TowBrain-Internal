# Internal CRM

A lead-management CRM for a 3-person team: shared leads, a drag-and-drop pipeline, notes
and contact history, a full audit trail, and role-based settings. Frontend-only — all
data, auth, and business logic live in Supabase (Postgres + Auth + Realtime + RLS).

**Stack:** React 19 + Vite + TypeScript, Tailwind CSS v4, Radix UI primitives, React
Hook Form + Zod, @dnd-kit, React Router, Supabase JS, Sonner (toasts).

## 1. Install dependencies

```bash
npm install
```

## 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a project (free tier is fine for 3 users).
2. In **Project Settings → API**, copy the **Project URL** and the **anon / publishable key**.
3. Copy `.env.example` to `.env` and fill them in:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

Never put the **service_role / secret** key in `.env` or anything prefixed `VITE_` —
those values ship inside the browser bundle.

## 3. Apply database migrations

Run the SQL files in `supabase/migrations/` **in order**, against your project's SQL
editor (Dashboard → SQL Editor → paste each file, Run) or via the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Order matters — each file depends on the previous one:

1. `0001_schema.sql` — tables, enums, indexes
2. `0002_functions.sql` — privilege-check functions, audit triggers, identity stamping
3. `0003_auth_bootstrap.sql` — auto-creates a `profiles` row for every new auth user
4. `0004_rls.sql` — Row Level Security policies + Realtime publication
5. `0005_seed_stages.sql` — default Kanban stages (New, Contacted, Follow-up, …)

## 4. Create the initial administrator (secure, one-time)

There is no "create the first admin" button anywhere in the app — that would let
any visitor grant themselves admin. Instead, **the first user ever created
automatically becomes the admin** (there's no one yet to approve them), via a
trigger (`handle_new_auth_user` in `0003_auth_bootstrap.sql`). Every user after that
defaults to `member`.

To create that first user:

1. Supabase Dashboard → **Authentication → Users → Add user**.
2. Enter their email and a temporary password (or use "send invite" if you've
   configured an email provider).
3. Sign in to the app with those credentials — this account is now `admin`.
4. From **Settings → My Profile**, use "Reset password" to set a permanent one.

## 5. Create the other two users

Same administrative workflow — the app intentionally has no self-service sign-up
and no "invite" API call from the browser, because that would require shipping the
`service_role` key to the client, which the Supabase service_role key must never be.

1. Supabase Dashboard → **Authentication → Users → Add user**, once per teammate.
2. They sign in; a `profiles` row is created for them automatically as `member`.
3. An existing admin can promote them from **Settings → Team** if needed.

## 6. Configure authentication redirects

In Supabase Dashboard → **Authentication → URL Configuration**, add:

- **Site URL:** your local dev URL (`http://localhost:5173`) while developing, then
  your Netlify URL once deployed.
- **Redirect URLs:** add both `http://localhost:5173/reset-password` and
  `https://<your-site>.netlify.app/reset-password` (the password-reset email links
  land there).

## 7. Run the app locally

```bash
npm run dev
```

Open `http://localhost:5173` and sign in with the admin account from step 4.

## 8. Run tests

```bash
npm run test        # unit + component tests (Vitest + Testing Library)
npm run lint         # oxlint
npx tsc -b           # type-check
npm run build        # production build
```

End-to-end (Playwright) tests run against a **real** Supabase project with a real
test account — there is no mocked backend for them:

```bash
E2E_TEST_EMAIL=you@example.com E2E_TEST_PASSWORD=yourpassword npm run test:e2e
```

They're skipped automatically if those two environment variables aren't set.

## 9. Build for production

```bash
npm run build
```

Output goes to `dist/`.

## 10. Deploy to Netlify

1. Push this repository to GitHub.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
3. Build command: `npm run build`. Publish directory: `dist`. (Already set in
   `netlify.toml`, so Netlify should pick these up automatically.)
4. **Site settings → Environment variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Deploy. `netlify.toml` includes the SPA redirect rule so client-side routes
   (`/leads`, `/pipeline`, etc.) work on direct load and on refresh.
6. Go back to Supabase Auth URL Configuration (step 6) and add the real
   `https://<your-site>.netlify.app` Site URL / redirect URL.
7. Redeploy after any future `git push` to the connected branch — Netlify rebuilds
   automatically; no manual steps needed beyond that.

**Production smoke-test checklist** after deploying:
- [ ] Load the site over HTTPS; sign in works
- [ ] Refreshing `/leads` or `/pipeline` directly (not just in-app nav) doesn't 404
- [ ] Creating a lead, dragging a Kanban card, and adding a note all persist
- [ ] Password reset email links back to the deployed domain, not localhost
- [ ] A second team member, signed in from a different browser, sees changes
      appear without reloading (Realtime)

### Custom domain
Netlify → **Domain management → Add a custom domain**, then update Supabase Auth's
Site URL / redirect URLs to match once it's live.

## Architecture notes

- **No custom backend.** Every mutation goes through the Supabase client straight to
  Postgres; business rules (identity stamping, audit logging, privileged-field
  guards) live in SQL triggers and functions, not in a server you'd have to run.
- **Soft deletes.** `leads.deleted_at` / `deleted_by` — nothing is physically erased
  by the delete button. Restoring is admin-only (enforced in the `stamp_lead` trigger,
  not just in the UI).
- **Audit trail.** `activity_logs` is written exclusively by `SECURITY DEFINER`
  triggers in the same transaction as the business change; ordinary clients have no
  INSERT/UPDATE/DELETE grant on it at all (see `0004_rls.sql`), so it can't be edited
  or forged from the app, by design, not just by convention.
- **Concurrency.** Edits carry the `updated_at` value the editor loaded; an update
  only succeeds if that still matches the current row (`WHERE updated_at = $expected`).
  A stale edit returns a conflict instead of silently overwriting someone else's change
  — see `updateLead` in `src/lib/leadsApi.ts`.
- **Realtime.** Each list-fetching hook (`useLeads`, `useLeadNotes`, `useActivity`, …)
  subscribes to Postgres changes and refetches on any event, rather than trusting the
  realtime payload directly — this stays correct across reconnects and missed events.

## Security notes

- RLS is enabled on every application table; there is no table a signed-in-but-not-a-
  team-member user (or an inactive one) can read or write.
- Privileged checks (`is_admin`, `is_active_member`) are `SECURITY DEFINER` SQL
  functions with a pinned `search_path` and `EXECUTE` granted only to `authenticated`
  — not ad hoc policy subqueries that could recurse against `profiles`' own RLS.
- `created_by`, `last_edited_by`, `deleted_by`, and every `activity_logs.actor_id` are
  stamped server-side from `auth.uid()` in a trigger; the browser's request body is
  never trusted as proof of who made a change.
- A non-admin cannot grant themselves (or anyone) admin, or reactivate/deactivate an
  account — enforced in the `touch_profiles` trigger, independent of the RLS policy.
- The Supabase `service_role` key never appears in this repository, in `.env`, or in
  any `VITE_` variable. Account creation is a Dashboard-only administrative action
  (see steps 4–5) for exactly that reason.

## Known limitations

- Kanban card reordering **within** a column isn't implemented (cards are grouped by
  stage, ordered by creation date) — only moving *between* stages is. Reordering
  within a column was listed as optional in the spec ("if implemented"); add it with
  `@dnd-kit/sortable` if you need it.
- "Default pipeline filters" and "date display" preferences are stored per-account in
  `profiles.preferences` and wired into the Leads/Dashboard pages that read them
  directly; they don't yet retroactively affect every view in the app.
- The Playwright e2e suite needs a real Supabase project and a real test account; it
  cannot run against a mocked backend, by design (see "End-to-end" above).
- Bundle size is ~630KB unminified-equivalent JS (not code-split) — reasonable for an
  internal 3-person tool; split with `React.lazy()` per route if that ever matters.
