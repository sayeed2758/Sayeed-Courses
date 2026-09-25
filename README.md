# Sayeed Courses

Premium course catalogue UI built with Next.js and designed for Vercel.

## Current foundation
- Compact mobile-first header
- Install App action
- Direct Telegram support: @LWS_SPECIAL_SUPPORTS
- Refresh reloads the app and loader
- Search + sort
- Compact premium course cards
- Like / dislike with toast feedback
- Cart with live local total
- Buy-all Telegram message generation
- Notification Center UI
- FAQ + category drawers

## Live backend (optional but recommended)
Create a Supabase project, run `supabase-schema.sql`, then add:

`NEXT_PUBLIC_SUPABASE_URL`
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

in Vercel Environment Variables. With those configured, reactions, notifications and the course count are shared across users.


## Admin Phase
See `README-ADMIN-SETUP.md`. Admin access uses Supabase Auth + a server-side `admin_users` allowlist. Never expose the `SUPABASE_SECRET_KEY`.
