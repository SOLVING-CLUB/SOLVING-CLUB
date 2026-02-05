# Access Control (Global + Per-Project)

This system supports:
- Global roles + permission bundles
- Per-project roles + permission bundles
- Custom per-user permissions by module or page

## Apply SQL
Run these in Supabase SQL Editor (or migrations):
1. `supabase/schema.sql` (already includes `profiles.is_admin`)
2. `supabase/access-control.sql`

## Seeded Templates
The SQL seeds:
- Roles: Owner, Admin, Manager, Member, Viewer + Project variants
- Bundles: Finance Admin, Docs Admin, Project Ops
- Permissions: module + project permissions (see `access_permissions`)

## Assign Access
Use the admin UI at `/dashboard/admin` (requires `admin.access` permission).

Quick SQL examples:
```sql
-- Make a user admin
update public.profiles set is_admin = true where id = '<user_uuid>';

-- Grant admin access permission directly
insert into public.access_user_permissions (user_id, permission_id)
select '<user_uuid>', id from public.access_permissions where key = 'admin.access';
```

## App Guards
Routes are guarded by permissions:
- Global pages use global permissions (e.g., `financial.view`)
- Project pages use project permissions (e.g., `project.view`)

## RLS Policy Usage
Use `public.has_permission('<perm_key>', <project_id>)` inside policies to enforce access.
Example:
```sql
create policy "Projects read by permission" on public.projects
for select using (public.has_permission('projects.view'));
```

## Inventory CSV Updates
If you add RLS policies or columns, update:
`docs/supabase-inventory/Supabase Snippet Enable row-level security for all public tables.csv`

