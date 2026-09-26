-- Sayeed Courses: ADMIN RLS + public coupon validation repair
-- Run ONCE in Supabase SQL Editor after the existing schema/repair SQL.
-- Does not delete existing courses, notifications, admins or coupons.

begin;

-- ---------------------------------------------------------------------------
-- 1. Stable admin check without exposing admin_users to normal clients.
-- ---------------------------------------------------------------------------
create or replace function public.is_active_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
      and is_active = true
  );
$$;

revoke all on function public.is_active_admin() from public;
grant execute on function public.is_active_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Authenticated active-admin RLS policies.
-- ---------------------------------------------------------------------------

-- Course catalogue
alter table public.course_catalogue enable row level security;
drop policy if exists "admin read courses" on public.course_catalogue;
drop policy if exists "admin insert courses" on public.course_catalogue;
drop policy if exists "admin update courses" on public.course_catalogue;
drop policy if exists "admin delete courses" on public.course_catalogue;
create policy "admin read courses" on public.course_catalogue
  for select to authenticated using (public.is_active_admin());
create policy "admin insert courses" on public.course_catalogue
  for insert to authenticated with check (public.is_active_admin());
create policy "admin update courses" on public.course_catalogue
  for update to authenticated using (public.is_active_admin()) with check (public.is_active_admin());
create policy "admin delete courses" on public.course_catalogue
  for delete to authenticated using (public.is_active_admin());

-- Notifications
alter table public.notifications enable row level security;
drop policy if exists "admin read notifications" on public.notifications;
drop policy if exists "admin insert notifications" on public.notifications;
drop policy if exists "admin update notifications" on public.notifications;
drop policy if exists "admin delete notifications" on public.notifications;
create policy "admin read notifications" on public.notifications
  for select to authenticated using (public.is_active_admin());
create policy "admin insert notifications" on public.notifications
  for insert to authenticated with check (public.is_active_admin());
create policy "admin update notifications" on public.notifications
  for update to authenticated using (public.is_active_admin()) with check (public.is_active_admin());
create policy "admin delete notifications" on public.notifications
  for delete to authenticated using (public.is_active_admin());

-- Coupons
alter table public.coupons enable row level security;
drop policy if exists "admin read coupons" on public.coupons;
drop policy if exists "admin insert coupons" on public.coupons;
drop policy if exists "admin update coupons" on public.coupons;
drop policy if exists "admin delete coupons" on public.coupons;
create policy "admin read coupons" on public.coupons
  for select to authenticated using (public.is_active_admin());
create policy "admin insert coupons" on public.coupons
  for insert to authenticated with check (public.is_active_admin());
create policy "admin update coupons" on public.coupons
  for update to authenticated using (public.is_active_admin()) with check (public.is_active_admin());
create policy "admin delete coupons" on public.coupons
  for delete to authenticated using (public.is_active_admin());

-- Audit log
alter table public.admin_audit_log enable row level security;
drop policy if exists "admin read audit" on public.admin_audit_log;
drop policy if exists "admin insert audit" on public.admin_audit_log;
create policy "admin read audit" on public.admin_audit_log
  for select to authenticated using (public.is_active_admin());
create policy "admin insert audit" on public.admin_audit_log
  for insert to authenticated with check (public.is_active_admin() and admin_user_id = auth.uid());

-- Restore table grants after the earlier hardening revoke. RLS remains the gate.
grant select, insert, update, delete on public.course_catalogue to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.coupons to authenticated;
grant select, insert on public.admin_audit_log to authenticated;

-- Course reactions are readable only by active admins; public reaction counts
-- continue to come from the existing security-definer count functions.
alter table public.course_reactions enable row level security;
drop policy if exists "admin read reactions" on public.course_reactions;
create policy "admin read reactions" on public.course_reactions
  for select to authenticated using (public.is_active_admin());
grant select on public.course_reactions to authenticated;

-- Identity sequences: grant only the sequences used by admin-managed tables.
do $$
declare
  seq_name text;
begin
  foreach seq_name in array array['course_catalogue_id_seq','notifications_id_seq','coupons_id_seq','admin_audit_log_id_seq'] loop
    if to_regclass('public.' || seq_name) is not null then
      execute format('grant usage, select on sequence public.%I to authenticated', seq_name);
    end if;
  end loop;
end $$;

-- Keep the public count aligned with the visible catalogue.
create or replace function public.get_course_count()
returns bigint
language sql
security definer
set search_path = public
stable
as $$ select count(*) from public.course_catalogue where is_published = true; $$;
grant execute on function public.get_course_count() to anon;

-- ---------------------------------------------------------------------------
-- 3. Public coupon validation: returns no sensitive coupon fields beyond the
--    code/discount/result. It never grants public table access.
-- ---------------------------------------------------------------------------
create or replace function public.validate_coupon(p_code text)
returns table(valid boolean, code text, discount_percent integer, reason text)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  normalized text := upper(trim(coalesce(p_code, '')));
  c public.coupons%rowtype;
begin
  if normalized = '' or length(normalized) > 64 then
    return query select false, null::text, null::integer, 'not_valid'::text;
    return;
  end if;

  select * into c
  from public.coupons
  where public.coupons.code = normalized
  limit 1;

  if not found then
    return query select false, null::text, null::integer, 'not_valid'::text;
  elsif not c.is_active or (c.expires_at is not null and c.expires_at <= now()) then
    return query select false, c.code, c.discount_percent, 'expired'::text;
  else
    return query select true, c.code, c.discount_percent, 'valid'::text;
  end if;
end;
$$;

revoke all on function public.validate_coupon(text) from public;
grant execute on function public.validate_coupon(text) to anon, authenticated;

-- Realtime: catalogue additions, notification publishes and reactions can
-- reach the public UI without waiting for the polling fallback.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='course_catalogue') then
    alter publication supabase_realtime add table public.course_catalogue;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='course_reactions') then
    alter publication supabase_realtime add table public.course_reactions;
  end if;
end $$;

commit;
