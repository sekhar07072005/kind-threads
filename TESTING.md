# Testing checklist

This is the detailed version of README.md's Stage 3/4. Work through it
after Stage 2 (real Supabase project + schema applied). Check items off
as you go, and send me anything that fails along with the exact error
message — I'll fix it.

## 0. What I already checked, and how

I don't have internet access in the environment this was built in, so I
could not run `npm install`, start a dev server, or hit a real Supabase
project. What I *could* and did do: run the real TypeScript compiler
(`tsc`) over all 29 source files with the third-party packages stubbed
out (since I can't install them), to catch structural problems —
unbalanced braces, malformed JSX, references to undefined local
variables, that kind of thing. It found none. It cannot catch logic bugs,
typos in Supabase column/table names, or anything that only shows up at
runtime — that's what the rest of this document is for.

## 1. Registration

- [ ] Go to `/register`. Submit the empty form → should show "Enter your
      full name…", "Enter a valid email address.", and a password-length
      error, without hitting the network.
- [ ] Enter a valid name/email, but mismatched passwords → should show
      "Passwords do not match." under the confirm field.
- [ ] Enter a password under 8 characters → should show "Password must be
      at least 8 characters."
- [ ] Submit a valid new account. Button should read "Creating account…"
      while submitting. Expect either:
      - a redirect to `/dashboard` (email confirmation is off), or
      - a green "Account created…" message (email confirmation is on) —
        check your inbox, confirm, then log in.
- [ ] Try registering the **same email again** → should show "An account
      with this email already exists. Try logging in instead." (not a
      raw Supabase error string).
- [ ] In Supabase dashboard → **Table Editor → profiles**, confirm a row
      was created automatically with `role = 'donor'` and the right
      `full_name`/`email`. (If this row is missing, the
      `on_auth_user_created` trigger didn't fire — check it was created
      by `schema.sql` under **Database → Triggers**.)

## 2. Login / logout

- [ ] `/login` with the wrong password → "Incorrect email or password."
- [ ] `/login` with correct credentials → redirected to `/dashboard` (or
      wherever you were trying to go before being bounced to login).
- [ ] Refresh the page while logged in → should stay logged in (session
      persists).
- [ ] Click **Log out** → nav switches back to Log in/Sign up, and you're
      sent to `/`.
- [ ] While logged out, manually visit `/dashboard`, `/donate`,
      `/browse`, and `/admin` → all four should redirect to `/login`.

## 3. Submitting a donation

- [ ] `/donate`, submit with no clothing type selected → "Select a
      clothing type."
- [ ] Quantity `0` or blank → "Quantity must be at least 1."
- [ ] Location blank → "Enter a pickup or drop-off location."
- [ ] Fill in a valid donation with **no photo** → submit → success
      message, and it shows up on `/dashboard` as "Awaiting review".
- [ ] Fill in a valid donation **with 1–2 photos** → submit → check
      Supabase **Storage → donation-photos** that files landed under a
      folder named with your user's UUID, and that the donation's
      `photo_urls` column (Table Editor) has matching public URLs.
- [ ] Try attaching a 5th photo (over the 4-photo limit) → should show
      "You can attach up to 4 photos." without letting it through.
- [ ] Try attaching a non-image file → "...is not an image file."
- [ ] Turn off your network (or throttle to offline in dev tools) and
      submit → should show a readable error, not a blank screen or an
      infinite spinner.

## 4. Donor dashboard

- [ ] Shows only donations you submitted, newest first.
- [ ] Status badges match what's in the database.
- [ ] A donation rejected with an admin note shows that note on the card.
- [ ] Submitting a second donation adds it without a full page reload
      being necessary (it should just appear after you return to the
      dashboard).

## 5. Browse donations

- [ ] Only `approved`/`fulfilled` donations appear — a still-`pending`
      donation (yours or anyone else's) should **not** show up here.
- [ ] Filtering by clothing type narrows the list correctly.
- [ ] Typing in the location filter narrows the list (partial match,
      case-insensitive — e.g. "town" should match "Downtown").
- [ ] No donor name/email/contact info appears on these cards — browse is
      intentionally donor-anonymous; only Admin sees who submitted what.

## 6. Admin dashboard

First promote an account to admin (README.md, Stage 2) and log back in.

- [ ] A non-admin account cannot reach `/admin` (redirects to
      `/dashboard`); confirm the **Admin** nav link itself doesn't appear
      for a donor account either.
- [ ] Pending tab shows unreviewed donations with the donor's name and
      email visible.
- [ ] **Approve** a donation → it disappears from the Pending tab and
      appears under Approved; confirm in Table Editor that `status`
      changed and `updated_at` moved.
- [ ] **Reject** a donation with a note in the admin-note box → the note
      should show up on the donor's dashboard for that item.
- [ ] **Mark picked up** on an approved donation → moves to Fulfilled,
      and still shows up on `/browse` (fulfilled items stay visible as a
      record, per the schema's select policy).
- [ ] The "All" tab shows every donation across all statuses.
- [ ] Buttons disable and show "Saving…" while an update is in flight,
      and re-enable after.

## 7. Permissions and Row Level Security — the part that most needs your testing

RLS bugs are invisible in casual use (the UI just doesn't show you other
people's data because it doesn't *ask* for it) — the real test is making
the Supabase client ask for things it shouldn't get, and confirming the
database itself says no, not just the UI.

Set up two donor accounts (**A** and **B**) plus one admin account.

- [ ] Log in as **A**, submit a donation, note its `id` from Table
      Editor.
- [ ] Log in as **B**. Open the browser console and run:
      ```js
      await window.supabase.from('donations').select('*').eq('id', 'A_DONATION_ID')
      ```
      (You'll need to temporarily expose the client — e.g.
      `window.supabase = supabase` in `main.tsx` — for console testing,
      and remove it afterward.) While A's donation is still `pending`,
      this should return an **empty array**, not the row — confirming B
      cannot read A's unapproved donation.
- [ ] Still as **B**, try to update it:
      ```js
      await window.supabase.from('donations').update({ status: 'approved' }).eq('id', 'A_DONATION_ID')
      ```
      Should affect **0 rows** (RLS silently filters it out — check
      `data` comes back empty, not an exception).
- [ ] As **B**, submit your own donation, then try inserting one
      impersonating A:
      ```js
      await window.supabase.from('donations').insert({ donor_id: 'A_USER_ID', clothing_type: "Men's clothing", quantity: 1, location: 'x' })
      ```
      Should fail — the insert policy requires `donor_id = auth.uid()`.
- [ ] As **B** (still just a donor), try to self-approve your own
      pending donation:
      ```js
      await window.supabase.from('donations').update({ status: 'approved' }).eq('id', 'B_DONATION_ID')
      ```
      Should return 0 affected rows — the donor update policy requires
      the row to *stay* `pending`.
- [ ] As **B**, try to write an admin note on your own donation:
      ```js
      await window.supabase.from('donations').update({ admin_notes: 'nice try' }).eq('id', 'B_DONATION_ID')
      ```
      Check Table Editor afterward — `admin_notes` should be unchanged;
      the `trg_protect_admin_only_fields` trigger should have silently
      dropped it even though the update "succeeded".
- [ ] As **B**, try to grant yourself admin:
      ```js
      await window.supabase.from('profiles').update({ role: 'admin' }).eq('id', 'B_USER_ID')
      ```
      Check Table Editor — `role` should still read `donor`.
- [ ] Log in as the **admin** account and repeat the approve/reject/mark-
      picked-up update on A's and B's donations from the console or the
      UI — these should all succeed, confirming the admin policies work
      and it's specifically non-admins who are blocked.
- [ ] As **B**, try to read **A's profile row**:
      ```js
      await window.supabase.from('profiles').select('*').eq('id', 'A_USER_ID')
      ```
      Should return an empty array (only the admin and A can read it).

If any of the "should fail" cases above actually succeed, that's a real
RLS bug — tell me which step and I'll fix the policy in `schema.sql`.

## 8. Responsive layout

- [ ] At ~375px width (phone): nav collapses to a hamburger; forms and
      cards stack to one column; no horizontal scrollbar anywhere.
- [ ] At ~768px (tablet): donation grids show 2 columns.
- [ ] At ~1280px+ (desktop): full nav bar, 3-column donation grids,
      content stays within a readable max-width rather than stretching
      edge-to-edge.
- [ ] Keyboard-only navigation: Tab through the Register form and the
      Navbar — focus should be visible at every stop (a visible outline),
      and the mobile menu button should be reachable and operable with
      Enter/Space.

## 9. Automated tests

```bash
npm test
```

Expected: all tests in `validation.test.ts`, `Login.test.tsx`, and
`RouteGuards.test.tsx` pass. If any fail, paste the output — the most
likely cause is a small mismatch between my mock of the Supabase client
and the real `@supabase/supabase-js` API surface (these were written
carefully but not executed, see Section 0).

## 10. Production build

```bash
npm run build
npm run preview
```

`npm run build` runs a real `tsc` type-check (unlike my stubbed sanity
check) against the actual library types — this is the first point where
genuine type errors against the real Supabase/React types would surface.
Fix anything it reports, or send it to me. `npm run preview` serves the
built `dist/` folder locally so you can sanity-check the production
bundle before deploying.
