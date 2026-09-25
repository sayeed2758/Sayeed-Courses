# Sayeed Courses — Admin Phase Setup

## Security model

The `/admin` route is not secured by hiding the URL. Access is protected by Supabase Auth + a server-side `admin_users` allowlist. Every admin API request re-checks the session and the allowlist. Privileged database operations run only with the server-side `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY` fallback), never in browser code.

## One-time Supabase setup

1. In Supabase Dashboard → Authentication → Users, create the one admin user with email/password.
2. Copy that user's UUID.
3. Run this SQL in Supabase SQL Editor after running the main `supabase-schema.sql`:

```sql
insert into public.admin_users (user_id, email, role, is_active)
values ('PASTE-ADMIN-USER-UUID-HERE', 'your-admin-email@example.com', 'super_admin', true)
on conflict (user_id) do update
set email = excluded.email, role = excluded.role, is_active = true;
```

4. In Vercel → Settings → Environment Variables add **server-only**:

`SUPABASE_SECRET_KEY`

Use the Supabase Dashboard's Settings → API Keys secret key. Do not use a `NEXT_PUBLIC_` name and never put this value in source control. Supabase documents that secret keys bypass RLS and must stay server-side.

The existing public variables remain:

`NEXT_PUBLIC_SUPABASE_URL`
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

5. Redeploy Vercel.

## Admin URL

`https://YOUR-DOMAIN/admin`

Unauthenticated visitors are redirected to `/admin/login`. A signed-in user who is not in `admin_users` is rejected by the server and cannot use the admin APIs.
