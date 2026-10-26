-- Auto-create a profile row whenever an admin creates a user (Dashboard, or the
-- documented service-role invite script). The function is owned by the migration
-- role (postgres), which bypasses RLS, so this is the only way profiles get inserted —
-- the client has no INSERT grant on profiles (see 0004_rls.sql).
--
-- The FIRST user ever created becomes admin automatically (there is no admin yet to
-- promote them); every subsequent user defaults to 'member' and an existing admin must
-- promote them from Settings > Team. This is the secure bootstrap path referenced in
-- the README: no client code can grant itself admin.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  first_user boolean;
begin
  select not exists (select 1 from profiles) into first_user;

  insert into profiles (id, full_name, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when first_user then 'admin' else 'member' end::user_role,
    true
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
