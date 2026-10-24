-- Ultimate XI leaderboard, update 3: allow 22-team seasons (1992/93 to 1994/95 have 42 games).
-- Paste into Supabase: SQL Editor > New query > Run.
alter table public.scores
  drop constraint if exists scores_won_check,
  drop constraint if exists scores_drawn_check,
  drop constraint if exists scores_lost_check,
  drop constraint if exists scores_games_check,
  drop constraint if exists scores_check,
  drop constraint if exists scores_position_check;
alter table public.scores
  add constraint scores_won_check check (won between 0 and 42),
  add constraint scores_drawn_check check (drawn between 0 and 42),
  add constraint scores_lost_check check (lost between 0 and 42),
  add constraint scores_games_check check (games between 30 and 42 and won + drawn + lost = games),
  add constraint scores_position_check check (position between 1 and 22);
