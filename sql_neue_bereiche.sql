-- Wiz fan Club – neue Bereiche: Feed, My Kingdom, Help Me, AoO-Showcase
-- Einmal im Supabase SQL-Editor ausführen.

-- ---------- Profil-Spalte für den AoO-Showcase ----------
alter table public.leaderboard add column if not exists aoo_card jsonb;

-- ---------- Feed ----------
create table if not exists public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'text',          -- text | showcase | kvk | craft | aoo
  body text,
  image text,                                  -- Bild-URL (Storage-Bucket showcase)
  data jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.feed_reactions (
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.feed_posts enable row level security;
alter table public.feed_reactions enable row level security;
drop policy if exists feed_posts_read on public.feed_posts;
drop policy if exists feed_posts_insert on public.feed_posts;
drop policy if exists feed_posts_update on public.feed_posts;
drop policy if exists feed_posts_delete on public.feed_posts;
create policy feed_posts_read   on public.feed_posts for select to authenticated using (true);
create policy feed_posts_insert on public.feed_posts for insert to authenticated with check (user_id = auth.uid());
create policy feed_posts_update on public.feed_posts for update to authenticated using (user_id = auth.uid());
create policy feed_posts_delete on public.feed_posts for delete to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.feature_access f where f.user_id = auth.uid() and f.feature = 'admin'));
drop policy if exists feed_reactions_read on public.feed_reactions;
drop policy if exists feed_reactions_write on public.feed_reactions;
drop policy if exists feed_reactions_update on public.feed_reactions;
drop policy if exists feed_reactions_delete on public.feed_reactions;
create policy feed_reactions_read   on public.feed_reactions for select to authenticated using (true);
create policy feed_reactions_write  on public.feed_reactions for insert to authenticated with check (user_id = auth.uid());
create policy feed_reactions_update on public.feed_reactions for update to authenticated using (user_id = auth.uid());
create policy feed_reactions_delete on public.feed_reactions for delete to authenticated using (user_id = auth.uid());

-- ---------- My Kingdom ----------
create table if not exists public.kingdoms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  number text,
  owner uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.kingdom_members (
  kingdom_id uuid not null references public.kingdoms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rank int not null default 1,                 -- 5 = R5 … 1 = R1
  status text not null default 'invited',      -- invited | member
  invited_by uuid,
  created_at timestamptz not null default now(),
  primary key (kingdom_id, user_id)
);
create table if not exists public.kingdom_posts (
  id uuid primary key default gen_random_uuid(),
  kingdom_id uuid not null references public.kingdoms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.kingdom_events (
  id uuid primary key default gen_random_uuid(),
  kingdom_id uuid not null references public.kingdoms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  kind text not null default 'event',          -- event | kvk
  starts_at timestamptz not null,
  note text,
  created_at timestamptz not null default now()
);
create table if not exists public.kingdom_autarchs (
  id uuid primary key default gen_random_uuid(),
  kingdom_id uuid not null references public.kingdoms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  governor_id text,
  kvk text,
  note text,
  created_at timestamptz not null default now()
);
-- Hilfsfunktionen (umgehen die RLS-Rekursion): bin ich Mitglied / welcher Rang
create or replace function public.kd_is_member(kid uuid) returns boolean language sql security definer stable as $$
  select exists (select 1 from public.kingdom_members m where m.kingdom_id = kid and m.user_id = auth.uid() and m.status = 'member');
$$;
create or replace function public.kd_rank(kid uuid) returns int language sql security definer stable as $$
  select coalesce((select m.rank from public.kingdom_members m where m.kingdom_id = kid and m.user_id = auth.uid() and m.status = 'member'), 0);
$$;
create or replace function public.kd_is_invited(kid uuid) returns boolean language sql security definer stable as $$
  select exists (select 1 from public.kingdom_members m where m.kingdom_id = kid and m.user_id = auth.uid());
$$;
alter table public.kingdoms enable row level security;
alter table public.kingdom_members enable row level security;
alter table public.kingdom_posts enable row level security;
alter table public.kingdom_events enable row level security;
alter table public.kingdom_autarchs enable row level security;
drop policy if exists kd_read on public.kingdoms;   drop policy if exists kd_insert on public.kingdoms;   drop policy if exists kd_update on public.kingdoms;   drop policy if exists kd_delete on public.kingdoms;
create policy kd_read   on public.kingdoms for select to authenticated using (public.kd_is_invited(id));
create policy kd_insert on public.kingdoms for insert to authenticated with check (owner = auth.uid());
create policy kd_update on public.kingdoms for update to authenticated using (owner = auth.uid());
create policy kd_delete on public.kingdoms for delete to authenticated using (owner = auth.uid());
drop policy if exists kdm_read on public.kingdom_members; drop policy if exists kdm_insert on public.kingdom_members; drop policy if exists kdm_update on public.kingdom_members; drop policy if exists kdm_delete on public.kingdom_members;
create policy kdm_read   on public.kingdom_members for select to authenticated using (user_id = auth.uid() or public.kd_is_member(kingdom_id));
create policy kdm_insert on public.kingdom_members for insert to authenticated
  with check (public.kd_rank(kingdom_id) >= 4 or exists (select 1 from public.kingdoms k where k.id = kingdom_id and k.owner = auth.uid()));
create policy kdm_update on public.kingdom_members for update to authenticated
  using (user_id = auth.uid() or public.kd_rank(kingdom_id) >= 4);
create policy kdm_delete on public.kingdom_members for delete to authenticated
  using (user_id = auth.uid() or public.kd_rank(kingdom_id) >= 4);
drop policy if exists kdp_read on public.kingdom_posts; drop policy if exists kdp_insert on public.kingdom_posts; drop policy if exists kdp_delete on public.kingdom_posts;
create policy kdp_read   on public.kingdom_posts for select to authenticated using (public.kd_is_member(kingdom_id));
create policy kdp_insert on public.kingdom_posts for insert to authenticated with check (user_id = auth.uid() and public.kd_is_member(kingdom_id));
create policy kdp_delete on public.kingdom_posts for delete to authenticated using (user_id = auth.uid() or public.kd_rank(kingdom_id) >= 4);
drop policy if exists kde_read on public.kingdom_events; drop policy if exists kde_insert on public.kingdom_events; drop policy if exists kde_delete on public.kingdom_events;
create policy kde_read   on public.kingdom_events for select to authenticated using (public.kd_is_member(kingdom_id));
create policy kde_insert on public.kingdom_events for insert to authenticated with check (user_id = auth.uid() and public.kd_rank(kingdom_id) >= 4);
create policy kde_delete on public.kingdom_events for delete to authenticated using (user_id = auth.uid() or public.kd_rank(kingdom_id) >= 4);
drop policy if exists kda_read on public.kingdom_autarchs; drop policy if exists kda_insert on public.kingdom_autarchs; drop policy if exists kda_delete on public.kingdom_autarchs;
create policy kda_read   on public.kingdom_autarchs for select to authenticated using (public.kd_is_member(kingdom_id));
create policy kda_insert on public.kingdom_autarchs for insert to authenticated with check (user_id = auth.uid() and public.kd_rank(kingdom_id) >= 4);
create policy kda_delete on public.kingdom_autarchs for delete to authenticated using (public.kd_rank(kingdom_id) >= 4);

-- ---------- Help Me ----------
create table if not exists public.help_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  sets jsonb not null,
  status text not null default 'open',         -- open | closed
  created_at timestamptz not null default now()
);
create table if not exists public.help_answers (
  request_id uuid not null references public.help_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  picks jsonb not null,                        -- bis zu 5 Teile, Reihenfolge = Priorität
  note text,
  created_at timestamptz not null default now(),
  primary key (request_id, user_id)
);
alter table public.help_requests enable row level security;
alter table public.help_answers enable row level security;
drop policy if exists hr_read on public.help_requests; drop policy if exists hr_insert on public.help_requests; drop policy if exists hr_update on public.help_requests; drop policy if exists hr_delete on public.help_requests;
create policy hr_read   on public.help_requests for select to authenticated using (true);
create policy hr_insert on public.help_requests for insert to authenticated with check (user_id = auth.uid());
create policy hr_update on public.help_requests for update to authenticated using (user_id = auth.uid());
create policy hr_delete on public.help_requests for delete to authenticated using (user_id = auth.uid());
drop policy if exists ha_read on public.help_answers; drop policy if exists ha_insert on public.help_answers; drop policy if exists ha_update on public.help_answers; drop policy if exists ha_delete on public.help_answers;
create policy ha_read   on public.help_answers for select to authenticated using (true);
create policy ha_insert on public.help_answers for insert to authenticated with check (user_id = auth.uid());
create policy ha_update on public.help_answers for update to authenticated using (user_id = auth.uid());
create policy ha_delete on public.help_answers for delete to authenticated using (user_id = auth.uid());

notify pgrst, 'reload schema';
