-- ADALAT v7 — multiplayer schema. Run in the Supabase SQL editor (or `supabase db push`).
-- Model: clients NEVER read or write these tables directly. All writes go through /api/* (service role).
-- Clients only receive Realtime broadcasts on private topics they are authorised for.

create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[0-9A-HJKMNP-TV-Z]{9}$'),
  host_user uuid not null,
  status text not null default 'lobby' check (status in ('lobby','in_game','finished','expired','ended')),
  case_id text not null,
  level int not null check (level between 1 and 3),
  allow_spectators boolean not null default true,
  state jsonb,                         -- authoritative engine state (contains hidden data)
  version int not null default 0,
  expires_at timestamptz not null default now() + interval '30 minutes',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms on delete cascade,
  user_id uuid not null,
  display_name text not null check (char_length(display_name) between 2 and 24),
  role text check (role in ('judge','pros','def','accused','witness')),
  is_spectator boolean not null default false,
  ready boolean not null default false,
  last_seen timestamptz not null default now(),
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);
create unique index if not exists room_players_role_unique on public.room_players(room_id, role) where role is not null;

create table if not exists public.room_seat_modes (
  room_id uuid not null references public.rooms on delete cascade,
  role text not null check (role in ('judge','pros','def','accused','witness')),
  mode text not null default 'ai' check (mode in ('human','ai')),
  primary key (room_id, role)
);

create table if not exists public.room_actions (
  action_id uuid primary key,          -- client-generated; uniqueness blocks replay
  room_id uuid not null references public.rooms on delete cascade,
  turn_id int not null,
  version int not null,
  actor_player uuid references public.room_players on delete set null,
  move_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  hits int not null
);

create table if not exists public.security_log (
  id bigserial primary key,
  at timestamptz not null default now(),
  request_id text, event text not null, user_hash text, room_id uuid, code text
);

-- Lock everything down: RLS on, no client policies. The service role bypasses RLS.
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.room_seat_modes enable row level security;
alter table public.room_actions enable row level security;
alter table public.rate_limits enable row level security;
alter table public.security_log enable row level security;
revoke all on public.rooms, public.room_players, public.room_seat_modes, public.room_actions, public.rate_limits, public.security_log from anon, authenticated;

-- Newer Supabase projects don't auto-grant SQL-created tables to API roles. The server (service_role) needs them.
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Atomic fixed-window rate limiter. Returns true if allowed.
create or replace function public.hit_rate(p_key text, p_window_s int, p_max int)
returns boolean language plpgsql security definer set search_path = public as $$
declare r public.rate_limits;
begin
  insert into public.rate_limits as rl (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when rl.window_start < now() - make_interval(secs => p_window_s) then 1 else rl.hits + 1 end,
    window_start = case when rl.window_start < now() - make_interval(secs => p_window_s) then now() else rl.window_start end
  returning * into r;
  return r.hits <= p_max;
end $$;
revoke all on function public.hit_rate(text,int,int) from public, anon, authenticated;
grant execute on function public.hit_rate(text,int,int) to service_role;
notify pgrst, 'reload schema';

-- Membership check used by Realtime authorisation (security definer so it can read room_players).
create or replace function public.can_read_topic(p_topic text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.room_players p
    where p.user_id = auth.uid()
      and ( p_topic = 'room:' || p.room_id::text
         or p_topic = 'room:' || p.room_id::text || ':seat:' || p.id::text )
  );
$$;
grant execute on function public.can_read_topic(text) to authenticated;

-- Realtime private channels: members may RECEIVE broadcasts for their room/seat, and track presence on the room topic.
-- Nobody but the server may SEND broadcast messages (no insert policy for extension = 'broadcast').
drop policy if exists "adalat read room topics" on realtime.messages;
create policy "adalat read room topics" on realtime.messages for select to authenticated
  using ( public.can_read_topic(realtime.topic()) );
drop policy if exists "adalat presence on room topic" on realtime.messages;
create policy "adalat presence on room topic" on realtime.messages for insert to authenticated
  with check ( realtime.messages.extension = 'presence' and public.can_read_topic(realtime.topic()) and realtime.topic() not like '%:seat:%' );

-- Expiry + cleanup (requires pg_cron: Database → Extensions → pg_cron).
-- select cron.schedule('adalat-expire', '*/5 * * * *', $$
--   update public.rooms set status = 'expired' where status in ('lobby','in_game') and expires_at < now();
--   delete from public.rooms where status in ('expired','ended','finished') and updated_at < now() - interval '24 hours';
--   delete from public.rate_limits where window_start < now() - interval '1 day';
--   delete from public.security_log where at < now() - interval '30 days';
-- $$);
