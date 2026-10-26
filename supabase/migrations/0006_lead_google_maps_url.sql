-- Adds an optional Google Maps link per lead, and folds it into the existing
-- "lead_updated" audit diff alongside the other profile-ish fields.

alter table leads add column if not exists google_maps_url text;

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
    or old.google_maps_url is distinct from new.google_maps_url
    or old.source is distinct from new.source
    or old.tags is distinct from new.tags
    or old.follow_up_at is distinct from new.follow_up_at
  then
    insert into activity_logs (lead_id, actor_id, action, old_values, new_values)
    values (new.id, actor, 'lead_updated',
      jsonb_build_object(
        'client_name', old.client_name, 'company_name', old.company_name,
        'email', old.email, 'phone', old.phone, 'website', old.website,
        'google_maps_url', old.google_maps_url,
        'source', old.source, 'tags', old.tags, 'follow_up_at', old.follow_up_at
      ),
      jsonb_build_object(
        'client_name', new.client_name, 'company_name', new.company_name,
        'email', new.email, 'phone', new.phone, 'website', new.website,
        'google_maps_url', new.google_maps_url,
        'source', new.source, 'tags', new.tags, 'follow_up_at', new.follow_up_at
      ));
  end if;

  return new;
end;
$$;
