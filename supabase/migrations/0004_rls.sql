-- Row Level Security. Default-deny: every table below only allows what a policy grants.
-- Base privileges are tightened too (defense in depth) so a missing/buggy policy can't
-- be the only thing standing between a request and a write.

alter table profiles enable row level security;
alter table pipeline_stages enable row level security;
alter table leads enable row level security;
alter table lead_notes enable row level security;
alter table activity_logs enable row level security;

revoke all on profiles, pipeline_stages, leads, lead_notes, activity_logs from anon, authenticated;

-- ---------- profiles ----------
-- Insert is never granted: rows are created only by the handle_new_auth_user trigger.
grant select, update on profiles to authenticated;

create policy profiles_select on profiles
  for select to authenticated
  using (public.is_active_member(auth.uid()));

create policy profiles_update on profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin(auth.uid()))
  with check (id = auth.uid() or public.is_admin(auth.uid()));

-- ---------- pipeline_stages ----------
grant select, insert, update on pipeline_stages to authenticated;

create policy pipeline_stages_select on pipeline_stages
  for select to authenticated
  using (public.is_active_member(auth.uid()));

create policy pipeline_stages_write on pipeline_stages
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ---------- leads ----------
grant select, insert, update on leads to authenticated;

-- Soft-deleted leads are hidden from ordinary members; admins can see them for the
-- deleted-leads/restore view.
create policy leads_select on leads
  for select to authenticated
  using (
    public.is_active_member(auth.uid())
    and (deleted_at is null or public.is_admin(auth.uid()))
  );

create policy leads_insert on leads
  for insert to authenticated
  with check (
    public.is_active_member(auth.uid())
    and exists (select 1 from pipeline_stages ps where ps.key = status and ps.is_active)
  );

create policy leads_update on leads
  for update to authenticated
  using (public.is_active_member(auth.uid()))
  with check (
    public.is_active_member(auth.uid())
    and exists (select 1 from pipeline_stages ps where ps.key = status and ps.is_active)
  );

-- ---------- lead_notes (append-only) ----------
grant select, insert on lead_notes to authenticated;

create policy lead_notes_select on lead_notes
  for select to authenticated
  using (
    public.is_active_member(auth.uid())
    and exists (
      select 1 from leads l where l.id = lead_id
        and (l.deleted_at is null or public.is_admin(auth.uid()))
    )
  );

create policy lead_notes_insert on lead_notes
  for insert to authenticated
  with check (
    public.is_active_member(auth.uid())
    and exists (select 1 from leads l where l.id = lead_id and l.deleted_at is null)
  );

-- ---------- activity_logs (read-only to clients, written only by SECURITY DEFINER triggers) ----------
grant select on activity_logs to authenticated;

create policy activity_logs_select on activity_logs
  for select to authenticated
  using (
    public.is_active_member(auth.uid())
    and exists (
      select 1 from leads l where l.id = lead_id
        and (l.deleted_at is null or public.is_admin(auth.uid()))
    )
  );

-- Realtime: broadcast changes on the tables the UI subscribes to.
alter publication supabase_realtime add table leads;
alter publication supabase_realtime add table lead_notes;
alter publication supabase_realtime add table activity_logs;
alter publication supabase_realtime add table pipeline_stages;
alter publication supabase_realtime add table profiles;
