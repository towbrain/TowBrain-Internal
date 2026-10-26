-- Privileged helper functions + triggers. All SECURITY DEFINER functions pin search_path
-- and are granted only to `authenticated` to avoid privilege-escalation via search_path tricks.

-- ---------- Identity / membership helpers (break RLS recursion on profiles) ----------

create or replace function public.is_active_member(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from profiles p where p.id = uid and p.is_active
  );
$$;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from profiles p where p.id = uid and p.is_active and p.role = 'admin'
  );
$$;

revoke all on function public.is_active_member(uuid) from public;
revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_active_member(uuid) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;

-- ---------- Generic updated_at / identity-stamping ----------

create or replace function public.touch_profiles()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  -- Role/active-state are privileged fields: only an admin may change them, on anyone's
  -- profile. A non-admin's update (e.g. editing their own display name) silently keeps
  -- the existing values instead of erroring, so ordinary profile edits aren't blocked.
  if not public.is_admin(auth.uid()) then
    new.role := old.role;
    new.is_active := old.is_active;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_touch on profiles;
create trigger profiles_touch
  before update on profiles
  for each row execute function public.touch_profiles();

-- Insert: force created_by/last_edited_by to the authenticated session, never a client-supplied id.
-- Update: force last_edited_by, bump updated_at, enforce deleted_by consistency.
create or replace function public.stamp_lead()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.last_edited_by := auth.uid();
    new.created_at := now();
    new.updated_at := now();
    new.deleted_at := null;
    new.deleted_by := null;
  elsif tg_op = 'UPDATE' then
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.last_edited_by := auth.uid();
    new.updated_at := now();
    if new.deleted_at is not null and old.deleted_at is null then
      new.deleted_by := auth.uid();
    elsif new.deleted_at is null then
      if old.deleted_at is not null and not public.is_admin(auth.uid()) then
        raise exception 'Only an administrator can restore a deleted lead';
      end if;
      new.deleted_by := null;
    end if;
  end if;

  new.email_normalized := nullif(lower(btrim(new.email)), '');
  new.phone_normalized := nullif(regexp_replace(coalesce(new.phone, ''), '[^0-9]', '', 'g'), '');
  return new;
end;
$$;

drop trigger if exists leads_stamp on leads;
create trigger leads_stamp
  before insert or update on leads
  for each row execute function public.stamp_lead();

create or replace function public.stamp_lead_note()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.author_id := auth.uid();
  new.created_at := now();
  return new;
end;
$$;

drop trigger if exists lead_notes_stamp on lead_notes;
create trigger lead_notes_stamp
  before insert on lead_notes
  for each row execute function public.stamp_lead_note();

-- ---------- Audit trail (same transaction as the business change) ----------
-- security definer: ordinary users have no INSERT grant on activity_logs, only this
-- trusted trigger does, so the audit trail cannot be edited or forged from the app.

create or replace function public.audit_lead_changes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    insert into activity_logs (lead_id, actor_id, action, new_values)
    values (new.id, actor, 'lead_created', jsonb_build_object(
      'client_name', new.client_name,
      'status', new.status,
      'approval_status', new.approval_status,
      'assigned_to', new.assigned_to
    ));
    return new;
  end if;

  -- tg_op = 'UPDATE'
  if old.deleted_at is null and new.deleted_at is not null then
    insert into activity_logs (lead_id, actor_id, action, old_values, new_values)
    values (new.id, actor, 'lead_deleted',
      jsonb_build_object('deleted_at', old.deleted_at),
      jsonb_build_object('deleted_at', new.deleted_at));
    return new;
  end if;

  if old.deleted_at is not null and new.deleted_at is null then
    insert into activity_logs (lead_id, actor_id, action, old_values, new_values)
    values (new.id, actor, 'lead_restored',
      jsonb_build_object('deleted_at', old.deleted_at),
      jsonb_build_object('deleted_at', null));
    return new;
  end if;

  if old.status is distinct from new.status then
    insert into activity_logs (lead_id, actor_id, action, old_values, new_values)
    values (new.id, actor, 'status_changed',
      jsonb_build_object('status', old.status), jsonb_build_object('status', new.status));
  end if;

  if old.approval_status is distinct from new.approval_status then
    insert into activity_logs (lead_id, actor_id, action, old_values, new_values)
    values (new.id, actor, 'approval_status_changed',
      jsonb_build_object('approval_status', old.approval_status),
      jsonb_build_object('approval_status', new.approval_status));
  end if;

  if old.assigned_to is distinct from new.assigned_to then
    insert into activity_logs (lead_id, actor_id, action, old_values, new_values)
    values (new.id, actor, 'assignee_changed',
      jsonb_build_object('assigned_to', old.assigned_to),
      jsonb_build_object('assigned_to', new.assigned_to));
  end if;

  if old.client_name is distinct from new.client_name
    or old.company_name is distinct from new.company_name
    or old.email is distinct from new.email
    or old.phone is distinct from new.phone
    or old.website is distinct from new.website
    or old.source is distinct from new.source
    or old.tags is distinct from new.tags
    or old.follow_up_at is distinct from new.follow_up_at
  then
    insert into activity_logs (lead_id, actor_id, action, old_values, new_values)
    values (new.id, actor, 'lead_updated',
      jsonb_build_object(
        'client_name', old.client_name, 'company_name', old.company_name,
        'email', old.email, 'phone', old.phone, 'website', old.website,
        'source', old.source, 'tags', old.tags, 'follow_up_at', old.follow_up_at
      ),
      jsonb_build_object(
        'client_name', new.client_name, 'company_name', new.company_name,
        'email', new.email, 'phone', new.phone, 'website', new.website,
        'source', new.source, 'tags', new.tags, 'follow_up_at', new.follow_up_at
      ));
  end if;

  return new;
end;
$$;

drop trigger if exists leads_audit on leads;
create trigger leads_audit
  after insert or update on leads
  for each row execute function public.audit_lead_changes();

create or replace function public.audit_lead_note()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into activity_logs (lead_id, actor_id, action, new_values, details)
  values (
    new.lead_id,
    new.author_id,
    case when new.kind = 'contact_attempt' then 'contact_attempt_recorded' else 'note_added' end::activity_action,
    jsonb_build_object(
      'note_id', new.id,
      'contact_method', new.contact_method,
      'contact_outcome', new.contact_outcome,
      'next_follow_up_at', new.next_follow_up_at
    ),
    left(new.note_text, 200)
  );
  return new;
end;
$$;

drop trigger if exists lead_notes_audit on lead_notes;
create trigger lead_notes_audit
  after insert on lead_notes
  for each row execute function public.audit_lead_note();
