# ReThread — Clothing Donation Platform

A full-stack clothing donation platform: donors register, submit clothing
donations with photos, and track status; admins review and manage every
record. Built with React + TypeScript (Vite) on the frontend and Supabase
(Postgres + Auth + Storage) on the backend.

> **Honesty note on testing.** This project was written and reviewed
> carefully, and run through a TypeScript structural check (see
> `TESTING.md`), but it has **not** been executed end-to-end against a
> live Supabase project or a real browser, because the environment it was
> built in has no internet access. Treat Stage 1 below — "run it and look
> at it" — as the first real test, not a formality. `TESTING.md` has a
> step-by-step checklist for everything else (auth, database read/write,
> permissions, error handling). Please run it and tell me what breaks —
> I'll fix it.

---

## 1. Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript, Vite |
| Routing | React Router v6 |
| Forms & validation | react-hook-form + Zod |
| Styling | Tailwind CSS |
| Backend | Supabase (Postgres, Auth, Storage) |
| Security | Postgres Row Level Security (RLS) |
| Tests | Vitest + React Testing Library |

## 2. Project structure

```
clothing-donation-platform/
├─ supabase/
│  └─ schema.sql              # tables, RLS policies, triggers, storage bucket
├─ src/
│  ├─ lib/
│  │  ├─ supabaseClient.ts    # Supabase client (reads env vars)
│  │  ├─ types.ts             # DB row types
│  │  ├─ validation.ts        # Zod schemas (register, login, donation)
│  │  └─ validation.test.ts
│  ├─ context/
│  │  └─ AuthContext.tsx      # auth state, sign up / in / out
│  ├─ components/
│  │  ├─ Navbar.tsx, Footer.tsx
│  │  ├─ ProtectedRoute.tsx   # requires login
│  │  ├─ AdminRoute.tsx       # requires login + role=admin
│  │  ├─ DonationCard.tsx, StatusBadge.tsx, PhotoUploader.tsx
│  │  ├─ Alert.tsx, LoadingSpinner.tsx
│  ├─ pages/
│  │  ├─ Home.tsx
│  │  ├─ Register.tsx, Login.tsx
│  │  ├─ DonorDashboard.tsx
│  │  ├─ SubmitDonation.tsx
│  │  ├─ BrowseDonations.tsx
│  │  ├─ AdminDashboard.tsx
│  │  └─ NotFound.tsx
│  └─ test/                   # component tests
├─ .env.example
└─ package.json
```

## 3. One important design decision

The brief's "Browse Donation Requests" page is implemented as a browsable
list of **approved donations** (items that passed admin review and are
ready to be collected) — not a separate "requests from organizations"
feature, since the brief didn't define a separate requester/organization
role. If you actually want organizations to *post requests* that donors
fulfill (a two-sided marketplace), that's a bigger schema change — say so
and I'll build it as a Stage 2 addition.

---

## 4. Stage 1 — Run it and look at it (design only, no backend needed)

You can preview every page's layout and responsiveness before setting up
Supabase at all.

```bash
cd clothing-donation-platform
npm install
cp .env.example .env
npm run dev
```

The app needs *some* value in `.env` to boot (even a fake one — the
Supabase client doesn't validate the URL/key until it actually makes a
request), so `.env.example`'s placeholder values are fine for this stage.

Open the printed `http://localhost:5173` URL and check:

- Home, Register, and Login pages render and look right.
- Resize the window (or open dev tools' device toolbar) to confirm the
  layout adapts at mobile (~375px), tablet (~768px), and desktop (~1280px)
  widths — the nav collapses to a hamburger menu below `md` (768px).
- Register/Login forms show validation errors for empty/invalid input.
- Dashboard, Browse, and Admin pages will show a loading spinner and then
  an error message ("Could not load…") — that's expected, since there's
  no real Supabase project yet. That gets fixed in Stage 2.

**What I verified:** I ran a structural TypeScript check across all 29
source files (details in `TESTING.md`) and found no syntax errors. I have
**not** run `npm run dev` myself — I have no network access in my
environment to install the dependencies. Please run the steps above and
tell me about anything that looks wrong.

---

## 5. Stage 2 — Create your Supabase project

1. Go to [supabase.com](https://supabase.com), sign in, and click **New
   project**. Pick a name, a database password (save it somewhere), and a
   region close to you.
2. Once it's provisioned, open **SQL Editor** → **New query**, paste in
   the entire contents of [`supabase/schema.sql`](supabase/schema.sql),
   and click **Run**. This creates:
   - `profiles` and `donations` tables
   - a trigger that auto-creates a `profiles` row (role `donor`) whenever
     someone signs up
   - Row Level Security policies on both tables
   - the `donation-photos` storage bucket and its access policies
3. Go to **Settings → API**. Copy the **Project URL** and the
   **`anon` `public`** key.
4. In the project folder, copy `.env.example` to `.env` and fill in those
   two values:

   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

5. Restart `npm run dev` (Vite only reads `.env` on startup).

### Environment variables — what's safe and what isn't

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are meant to be public.
  The `anon` key only grants whatever Row Level Security allows — that's
  the whole point of RLS, and it's why `schema.sql` is as important as the
  frontend code.
- **Never** put the **`service_role`** key in this project, in `.env`, in
  any `VITE_`-prefixed variable, or anywhere in `src/`. Any `VITE_*`
  variable gets bundled into the JavaScript that ships to the browser —
  anyone can read it in dev tools. The `service_role` key bypasses RLS
  entirely, so if it ever ends up in frontend code, anyone can read or
  write every row in your database. There is no legitimate reason for
  this app's frontend to use it. (If you ever add server-side code — an
  Edge Function, a backend API — that's the only place `service_role`
  belongs, and even then it should come from that server's own secret
  storage, never a `VITE_` variable.)
- `.env` is in `.gitignore` — don't remove that line, and don't commit a
  filled-in `.env`.

### Promoting your first admin

There's no sign-up checkbox or API call that grants the `admin` role —
that's intentional (see **Security**, below). After you've registered a
normal account through the app:

1. Supabase dashboard → **SQL Editor** → new query:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
2. Log out and back in (or just refresh) so the app picks up the new
   role. You should now see an **Admin** link in the nav and be able to
   open `/admin`.

---

## 6. Stage 3 — Verify the core features for real

With Stage 2 done, walk through this once yourself before trusting it:

1. **Register** a donor account → you should land on `/dashboard` (or see
   a "check your email" message if your Supabase project has email
   confirmation turned on — Authentication → Providers → Email in the
   Supabase dashboard controls that).
2. **Submit a donation** at `/donate`, with and without a photo.
3. Check your **Dashboard** — the new donation should appear with status
   "Awaiting review".
4. **Promote yourself to admin** (above), open `/admin`, and **approve**
   the donation.
5. Go to **Browse** (`/browse`) — the approved donation should now be
   visible.
6. Back on the donor **Dashboard**, the status should now read "Approved".
7. In `/admin`, mark it **Picked up** — confirm it moves to the
   "Fulfilled" tab and the donor's dashboard reflects it.
8. **Log out**, confirm you're redirected and the nav shows Log in/Sign up
   again, and that `/dashboard`, `/donate`, `/browse`, `/admin` all
   redirect you to `/login` when signed out.

`TESTING.md` has a longer checklist, including the permission/security
tests (two accounts, trying to read/edit someone else's data, trying to
self-approve, trying to reach `/admin` as a donor).

---

## 7. Stage 4 — Automated tests

```bash
npm test
```

This runs:
- `src/lib/validation.test.ts` — pure tests of the Zod schemas (no
  network, no mocking: valid/invalid email, password length, mismatched
  passwords, quantity bounds, clothing type enum).
- `src/test/Login.test.tsx` — renders the real Login page with a mocked
  Supabase client; checks validation errors, that `signInWithPassword` is
  called with the right arguments, and that a failed login shows a
  readable error.
- `src/test/RouteGuards.test.tsx` — checks `AdminRoute` lets an admin
  through, redirects a donor to `/dashboard`, and redirects a signed-out
  visitor to `/login`; checks `ProtectedRoute` redirects signed-out
  visitors.

**Important limitation:** these mock the Supabase client, so they test
frontend logic only. They **cannot** verify Row Level Security — RLS is
enforced by Postgres itself, so the only real test of "can user B read
user A's data" is hitting the actual database with two real accounts,
which is what the Stage 3 / `TESTING.md` manual steps do. I have not run
`npm test` myself (same no-network constraint as above) — please run it
and send me the output if anything fails.

---

## 8. Security summary

- **Row Level Security is on for every table.** Policies are defined in
  `schema.sql`, not just assumed in the frontend — even a user who opens
  dev tools and calls the Supabase client directly is still bound by
  them.
- **Users can only read/write their own donations**, plus read donations
  that are already `approved`/`fulfilled` (the public browse list).
  Admins can read/write everything, via a `is_admin()` policy check.
- **Donors can't self-approve.** Their update policy requires the row to
  stay `status = 'pending'` after their edit.
- **Donors can't grant themselves admin**, or edit `admin_notes` on their
  own donations — both are enforced by database triggers
  (`trg_prevent_role_escalation`, `trg_protect_admin_only_fields`), not
  just hidden in the UI.
- **No privileged key ever reaches the browser** — only the public `anon`
  key, which is designed to be exposed and is restricted by RLS. See the
  environment-variable section above.
- **Admin status is never self-service** — it's granted by running SQL
  directly, by someone with access to the Supabase project.

---

## 9. Stage 5 — Deployment

Any static host that supports environment variables and a Vite build
works (Vercel, Netlify, Cloudflare Pages). Vercel steps:

1. Push this project to a GitHub repo.
2. [vercel.com](https://vercel.com) → **New Project** → import the repo.
   Vercel auto-detects Vite; leave build command as `npm run build` and
   output directory as `dist`.
3. Under **Environment Variables**, add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` with your real Supabase values (same ones
   from your local `.env` — again, the `anon` key is fine here).
4. Deploy. On the production URL, repeat the Stage 3 checklist —
   register, submit, approve, browse, log out — since a production build
   and a dev server can behave slightly differently.
5. In Supabase → **Authentication → URL Configuration**, add your
   production URL to **Site URL** / **Redirect URLs**, or email
   confirmation links will point back to `localhost`.

I have not deployed this myself (no network access here) — once it's
live, let me know the URL and anything that didn't work and I'll fix it.

---

## 10. What's genuinely done vs. what needs your verification

| Area | Status |
|---|---|
| All 6 pages, routing, responsive layout | Written, structurally checked, **not visually verified in a browser** |
| Register / log in / log out | Written against Supabase Auth's documented API, **not run against a live project** |
| Submit donation (incl. photo upload) | Written, **not run against a live project** |
| View own submissions + status | Written, **not run against a live project** |
| Admin review/approve/reject/fulfill | Written, **not run against a live project** |
| Form validation, loading states, success/error messages | Written and covered by automated tests, **tests not executed** |
| RLS policies (ownership, admin-only ops) | Written to spec and reasoned through carefully, **this is the one area that genuinely requires your live testing — RLS bugs don't show up any other way** |
| Deployment | Instructions written, **not deployed or tested by me** |

See `TESTING.md` for the full checklist to work through each of these.
