-- =====================================================================
-- ReThread — Clothing Donation Platform
-- Database schema, triggers, and Row Level Security policies
--
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New
-- query) on a fresh project, or apply it as a migration with the
-- Supabase CLI. It is written to be safe to re-run (uses IF NOT EXISTS /
-- OR REPLACE / ON CONFLICT where practical), but review before re-running
-- on a project that already has data.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILES
-- One row per authenticated user. Created automatically on sign-up by
-- the handle_new_user trigger below — the app never inserts into this
-- table directly, which is what stops a user from granting themselves
-- the 'admin' role at sign-up time.
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role text not null default 'donor' check (role in ('donor', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- SECURITY DEFINER helper so RLS policies can check "is this user an
-- admin?" without recursively re-evaluating the profiles RLS policy on
-- itself (which would otherwise cause infinite recursion / be blocked).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin());

-- Belt-and-braces: even if a future policy change allowed a user to
-- UPDATE their own row, this trigger silently discards any attempt to
-- change `role` unless the caller is already an admin. Role escalation
-- can only happen by an admin editing the row directly (e.g. in the SQL
-- editor or a future admin-only "manage users" feature).
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_role_escalation();

-- Auto-create a profile row whenever a new auth user is created. The
-- full name comes from the `full_name` passed in signUp()'s `options.data`;
-- role always starts as 'donor'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    'donor'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();


-- ---------------------------------------------------------------------
-- 2. DONATIONS
-- ---------------------------------------------------------------------

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles (id) on delete cascade,
  clothing_type text not null,
  quantity integer not null check (quantity > 0 and quantity <= 10000),
  location text not null,
  description text,
  photo_urls text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'fulfilled')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_donations_donor_id on public.donations (donor_id);
create index if not exists idx_donations_status on public.donations (status);
create index if not exists idx_donations_created_at on public.donations (created_at desc);

alter table public.donations enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_donations_updated_at on public.donations;
create trigger trg_donations_updated_at
  before update on public.donations
  for each row
  execute function public.set_updated_at();

-- SELECT: donors see their own records in any status; everyone signed in
-- can see donations that have cleared review (approved/fulfilled);
-- admins see everything.
drop policy if exists "Donors can view their own donations" on public.donations;
create policy "Donors can view their own donations"
  on public.donations for select
  using (auth.uid() = donor_id);

drop policy if exists "Authenticated users can view approved donations" on public.donations;
create policy "Authenticated users can view approved donations"
  on public.donations for select
  to authenticated
  using (status in ('approved', 'fulfilled'));

drop policy if exists "Admins can view all donations" on public.donations;
create policy "Admins can view all donations"
  on public.donations for select
  using (public.is_admin());

-- INSERT: a user may only create a donation attributed to themselves,
-- and it must start out 'pending' — nobody can self-approve on create.
drop policy if exists "Users can create their own donations" on public.donations;
create policy "Users can create their own donations"
  on public.donations for insert
  to authenticated
  with check (auth.uid() = donor_id and status = 'pending');

-- UPDATE: donors may edit their own submission only while it is still
-- pending (and the edit must keep it pending — they cannot approve their
-- own donation by writing 'approved' into the status column). Admins can
-- update any donation to any status.
drop policy if exists "Donors can edit their own pending donations" on public.donations;
create policy "Donors can edit their own pending donations"
  on public.donations for update
  using (auth.uid() = donor_id and status = 'pending')
  with check (auth.uid() = donor_id and status = 'pending');

drop policy if exists "Admins can update any donation" on public.donations;
create policy "Admins can update any donation"
  on public.donations for update
  using (public.is_admin());

-- DELETE: donors may remove their own still-pending submissions; admins
-- may remove any record.
drop policy if exists "Donors can delete their own pending donations" on public.donations;
create policy "Donors can delete their own pending donations"
  on public.donations for delete
  using (auth.uid() = donor_id and status = 'pending');

drop policy if exists "Admins can delete any donation" on public.donations;
create policy "Admins can delete any donation"
  on public.donations for delete
  using (public.is_admin());

-- Defense in depth: the app's UI never shows donors an admin_notes field,
-- but RLS policies alone don't restrict access at the column level, so a
-- donor could otherwise set admin_notes directly through the API. This
-- trigger silently discards any change to admin_notes from a non-admin,
-- the same way trg_prevent_role_escalation protects profiles.role.
create or replace function public.protect_admin_only_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.admin_notes := old.admin_notes;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_admin_only_fields on public.donations;
create trigger trg_protect_admin_only_fields
  before update on public.donations
  for each row
  execute function public.protect_admin_only_fields();


-- ---------------------------------------------------------------------
-- 3. STORAGE — donation photo uploads
-- Photos are stored at "<user-id>/<random>-<filename>" inside a public
-- bucket (the files themselves are not sensitive — they are photos of
-- clothing, shown on approved public listings). Only the owning user can
-- upload or delete inside their own folder.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('donation-photos', 'donation-photos', true)
on conflict (id) do nothing;

drop policy if exists "Donation photos are publicly viewable" on storage.objects;
create policy "Donation photos are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'donation-photos');

drop policy if exists "Users can upload photos to their own folder" on storage.objects;
create policy "Users can upload photos to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'donation-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete photos in their own folder" on storage.objects;
create policy "Users can delete photos in their own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'donation-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ---------------------------------------------------------------------
-- 4. PROMOTING AN ADMIN
-- There is no sign-up flow or in-app button that grants the 'admin'
-- role — that is intentional (see "Protect administrative operations").
-- After a person has registered normally, promote them by running this
-- in the SQL Editor, signed in as the project owner:
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ---------------------------------------------------------------------
