-- Ultimate XI leaderboard. Paste into Supabase: SQL Editor > New query > Run.
create table public.scores (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  mode text not null check (mode in ('top5', 'pl')),
  name text not null check (char_length(name) between 1 and 16),
  season text not null check (char_length(season) <= 40),
  formation text not null check (char_length(formation) <= 12),
  won int not null check (won between 0 and 38),
  drawn int not null check (drawn between 0 and 38),
  lost int not null check (lost between 0 and 38),
  games int not null check (games between 30 and 38 and won + drawn + lost = games),
  points int generated always as (won * 3 + drawn) stored,
  ppg numeric generated always as (round((won * 3 + drawn)::numeric / games, 3)) stored,
  gd int not null check (gd between -150 and 150),
  position int not null check (position between 1 and 20),
  seed text not null unique check (char_length(seed) <= 40),
  link text not null check (char_length(link) <= 600)
);
create index scores_board on public.scores (mode, created_at desc);

alter table public.scores enable row level security;
create policy "anyone can read" on public.scores for select to anon using (true);
create policy "anyone can add" on public.scores for insert to anon with check (true);
