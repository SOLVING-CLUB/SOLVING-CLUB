# Solving Club Dashboard (karthik)

Full-stack Next.js (App Router) + Supabase boilerplate for Learnings, Projects, Profiles, and Hours.

## Tech
- Next.js 14+ (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres, Storage, Realtime)
- Deployed on Vercel

## Getting Started
1. Copy `.env.example` to `.env.local` and fill in Supabase values:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
2. Install deps and run
```
npm install
npm run dev
```
3. Database schema (SQL) is in `/supabase/schema.sql`. Run it in Supabase SQL editor.

## Flow for development and testing
We will implement and test in this order:
1) Profile
2) Working Hours
3) Learning Space
4) Project Management & Space

Open `/dashboard/profile` to create/update your profile after signing up.
