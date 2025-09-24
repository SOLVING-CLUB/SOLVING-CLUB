-- Global Task Management System Schema
-- This schema is separate from project tasks but intelligently linked to users

-- Global Task Categories
create table if not exists public.global_task_categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    color text default '#3B82F6', -- Default blue color
    icon text default 'folder', -- Lucide icon name
    created_by uuid references auth.users(id) on delete cascade not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(name, created_by) -- Each user can have unique category names
);

-- Global Task Tags
create table if not exists public.global_task_tags (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    color text default '#6B7280', -- Default gray color
    created_by uuid references auth.users(id) on delete cascade not null,
    created_at timestamptz default now(),
    unique(name, created_by) -- Each user can have unique tag names
);

-- Global Tasks (separate from project tasks)
create table if not exists public.global_tasks (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    status text not null default 'todo' check (status in ('todo', 'in-progress', 'completed', 'cancelled', 'on-hold')),
    priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
    category_id uuid references public.global_task_categories(id) on delete set null,
    assigned_to uuid references auth.users(id) on delete set null,
    created_by uuid references auth.users(id) on delete cascade not null,
    due_date timestamptz,
    start_date timestamptz,
    completed_at timestamptz,
    estimated_hours decimal(5,2), -- Estimated time in hours
    actual_hours decimal(5,2) default 0, -- Actual time spent
    progress integer default 0 check (progress >= 0 and progress <= 100),
    is_recurring boolean default false,
    recurring_pattern text, -- 'daily', 'weekly', 'monthly', 'yearly'
    recurring_interval integer default 1, -- Every X days/weeks/months/years
    parent_task_id uuid references public.global_tasks(id) on delete cascade, -- For subtasks
    project_id uuid references public.projects(id) on delete set null, -- Link to project if related
    project_task_id uuid references public.project_tasks(id) on delete set null, -- Link to specific project task
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Task Dependencies (for task relationships)
create table if not exists public.global_task_dependencies (
    id uuid primary key default gen_random_uuid(),
    task_id uuid references public.global_tasks(id) on delete cascade not null,
    depends_on_task_id uuid references public.global_tasks(id) on delete cascade not null,
    dependency_type text not null default 'finish-to-start' check (dependency_type in ('finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish')),
    created_at timestamptz default now(),
    unique(task_id, depends_on_task_id) -- Prevent duplicate dependencies
);

-- Task Tags (many-to-many relationship)
create table if not exists public.global_task_tag_assignments (
    id uuid primary key default gen_random_uuid(),
    task_id uuid references public.global_tasks(id) on delete cascade not null,
    tag_id uuid references public.global_task_tags(id) on delete cascade not null,
    created_at timestamptz default now(),
    unique(task_id, tag_id) -- Prevent duplicate tag assignments
);

-- Task Comments/Notes
create table if not exists public.global_task_comments (
    id uuid primary key default gen_random_uuid(),
    task_id uuid references public.global_tasks(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    content text not null,
    is_internal boolean default false, -- Internal notes vs public comments
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Task Time Tracking
create table if not exists public.global_task_time_entries (
    id uuid primary key default gen_random_uuid(),
    task_id uuid references public.global_tasks(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    start_time timestamptz not null,
    end_time timestamptz,
    duration_minutes integer, -- Calculated duration in minutes
    description text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Task Attachments
create table if not exists public.global_task_attachments (
    id uuid primary key default gen_random_uuid(),
    task_id uuid references public.global_tasks(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    filename text not null,
    file_path text not null,
    file_size bigint,
    file_type text,
    created_at timestamptz default now()
);

-- Task Notifications/Reminders
create table if not exists public.global_task_reminders (
    id uuid primary key default gen_random_uuid(),
    task_id uuid references public.global_tasks(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    reminder_type text not null default 'due_date' check (reminder_type in ('due_date', 'start_date', 'custom')),
    reminder_time timestamptz not null,
    is_sent boolean default false,
    notification_method text not null default 'in_app' check (notification_method in ('in_app', 'email', 'push')),
    created_at timestamptz default now()
);

-- User Task Preferences
create table if not exists public.user_task_preferences (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    default_view text not null default 'kanban' check (default_view in ('kanban', 'list', 'calendar', 'gantt')),
    default_priority text not null default 'medium' check (default_priority in ('low', 'medium', 'high', 'urgent')),
    default_category_id uuid references public.global_task_categories(id) on delete set null,
    auto_archive_completed boolean default true,
    show_completed_tasks boolean default false,
    time_tracking_enabled boolean default true,
    notifications_enabled boolean default true,
    email_notifications boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(user_id)
);

-- Indexes for performance
create index if not exists global_tasks_created_by_idx on public.global_tasks(created_by);
create index if not exists global_tasks_assigned_to_idx on public.global_tasks(assigned_to);
create index if not exists global_tasks_status_idx on public.global_tasks(status);
create index if not exists global_tasks_priority_idx on public.global_tasks(priority);
create index if not exists global_tasks_due_date_idx on public.global_tasks(due_date);
create index if not exists global_tasks_category_idx on public.global_tasks(category_id);
create index if not exists global_tasks_project_idx on public.global_tasks(project_id);
create index if not exists global_tasks_parent_idx on public.global_tasks(parent_task_id);
create index if not exists global_task_dependencies_task_idx on public.global_task_dependencies(task_id);
create index if not exists global_task_dependencies_depends_idx on public.global_task_dependencies(depends_on_task_id);
create index if not exists global_task_comments_task_idx on public.global_task_comments(task_id);
create index if not exists global_task_time_entries_task_idx on public.global_task_time_entries(task_id);
create index if not exists global_task_attachments_task_idx on public.global_task_attachments(task_id);
create index if not exists global_task_reminders_task_idx on public.global_task_reminders(task_id);
create index if not exists global_task_reminders_user_idx on public.global_task_reminders(user_id);

-- Triggers for updated_at timestamps
create or replace trigger global_task_categories_set_updated_at
before update on public.global_task_categories
for each row execute function public.set_updated_at();

create or replace trigger global_tasks_set_updated_at
before update on public.global_tasks
for each row execute function public.set_updated_at();

create or replace trigger global_task_comments_set_updated_at
before update on public.global_task_comments
for each row execute function public.set_updated_at();

create or replace trigger global_task_time_entries_set_updated_at
before update on public.global_task_time_entries
for each row execute function public.set_updated_at();

create or replace trigger user_task_preferences_set_updated_at
before update on public.user_task_preferences
for each row execute function public.set_updated_at();

-- Function to automatically update actual_hours when time entries are added/updated
create or replace function update_task_actual_hours()
returns trigger as $$
begin
    update public.global_tasks 
    set actual_hours = (
        select coalesce(sum(duration_minutes), 0) / 60.0
        from public.global_task_time_entries 
        where task_id = coalesce(new.task_id, old.task_id)
    )
    where id = coalesce(new.task_id, old.task_id);
    
    return coalesce(new, old);
end;
$$ language plpgsql;

create trigger update_task_actual_hours_trigger
after insert or update or delete on public.global_task_time_entries
for each row execute function update_task_actual_hours();

-- Function to set completed_at when status changes to completed
create or replace function set_task_completed_at()
returns trigger as $$
begin
    if new.status = 'completed' and old.status != 'completed' then
        new.completed_at = now();
    elsif new.status != 'completed' and old.status = 'completed' then
        new.completed_at = null;
    end if;
    
    return new;
end;
$$ language plpgsql;

create trigger set_task_completed_at_trigger
before update on public.global_tasks
for each row execute function set_task_completed_at();

-- Enable RLS for all tables
alter table public.global_task_categories enable row level security;
alter table public.global_task_tags enable row level security;
alter table public.global_tasks enable row level security;
alter table public.global_task_dependencies enable row level security;
alter table public.global_task_tag_assignments enable row level security;
alter table public.global_task_comments enable row level security;
alter table public.global_task_time_entries enable row level security;
alter table public.global_task_attachments enable row level security;
alter table public.global_task_reminders enable row level security;
alter table public.user_task_preferences enable row level security;

-- RLS Policies for Global Task Categories
drop policy if exists "Users can view their own categories" on public.global_task_categories;
create policy "Users can view their own categories" on public.global_task_categories
    for select using (auth.uid() = created_by);

drop policy if exists "Users can create their own categories" on public.global_task_categories;
create policy "Users can create their own categories" on public.global_task_categories
    for insert with check (auth.uid() = created_by);

drop policy if exists "Users can update their own categories" on public.global_task_categories;
create policy "Users can update their own categories" on public.global_task_categories
    for update using (auth.uid() = created_by);

drop policy if exists "Users can delete their own categories" on public.global_task_categories;
create policy "Users can delete their own categories" on public.global_task_categories
    for delete using (auth.uid() = created_by);

-- RLS Policies for Global Task Tags
drop policy if exists "Users can view their own tags" on public.global_task_tags;
create policy "Users can view their own tags" on public.global_task_tags
    for select using (auth.uid() = created_by);

drop policy if exists "Users can create their own tags" on public.global_task_tags;
create policy "Users can create their own tags" on public.global_task_tags
    for insert with check (auth.uid() = created_by);

drop policy if exists "Users can update their own tags" on public.global_task_tags;
create policy "Users can update their own tags" on public.global_task_tags
    for update using (auth.uid() = created_by);

drop policy if exists "Users can delete their own tags" on public.global_task_tags;
create policy "Users can delete their own tags" on public.global_task_tags
    for delete using (auth.uid() = created_by);

-- RLS Policies for Global Tasks
drop policy if exists "Users can view their own tasks and assigned tasks" on public.global_tasks;
create policy "Users can view their own tasks and assigned tasks" on public.global_tasks
    for select using (
        auth.uid() = created_by or 
        auth.uid() = assigned_to or
        (project_id is not null and auth.uid() in (
            select user_id from public.project_members where project_id = global_tasks.project_id
            union
            select owner_id from public.projects where id = global_tasks.project_id
        ))
    );

drop policy if exists "Users can create their own tasks" on public.global_tasks;
create policy "Users can create their own tasks" on public.global_tasks
    for insert with check (auth.uid() = created_by);

drop policy if exists "Users can update their own tasks and assigned tasks" on public.global_tasks;
create policy "Users can update their own tasks and assigned tasks" on public.global_tasks
    for update using (
        auth.uid() = created_by or 
        auth.uid() = assigned_to
    );

drop policy if exists "Users can delete their own tasks" on public.global_tasks;
create policy "Users can delete their own tasks" on public.global_tasks
    for delete using (auth.uid() = created_by);

-- RLS Policies for Task Dependencies
drop policy if exists "Users can view dependencies of their tasks" on public.global_task_dependencies;
create policy "Users can view dependencies of their tasks" on public.global_task_dependencies
    for select using (
        auth.uid() in (
            select created_by from public.global_tasks where id = task_id
            union
            select assigned_to from public.global_tasks where id = task_id
        )
    );

drop policy if exists "Users can create dependencies for their tasks" on public.global_task_dependencies;
create policy "Users can create dependencies for their tasks" on public.global_task_dependencies
    for insert with check (
        auth.uid() in (
            select created_by from public.global_tasks where id = task_id
            union
            select assigned_to from public.global_tasks where id = task_id
        )
    );

drop policy if exists "Users can delete dependencies of their tasks" on public.global_task_dependencies;
create policy "Users can delete dependencies of their tasks" on public.global_task_dependencies
    for delete using (
        auth.uid() in (
            select created_by from public.global_tasks where id = task_id
            union
            select assigned_to from public.global_tasks where id = task_id
        )
    );

-- RLS Policies for Task Tag Assignments
drop policy if exists "Users can view tag assignments of their tasks" on public.global_task_tag_assignments;
create policy "Users can view tag assignments of their tasks" on public.global_task_tag_assignments
    for select using (
        auth.uid() in (
            select created_by from public.global_tasks where id = task_id
            union
            select assigned_to from public.global_tasks where id = task_id
        )
    );

drop policy if exists "Users can create tag assignments for their tasks" on public.global_task_tag_assignments;
create policy "Users can create tag assignments for their tasks" on public.global_task_tag_assignments
    for insert with check (
        auth.uid() in (
            select created_by from public.global_tasks where id = task_id
            union
            select assigned_to from public.global_tasks where id = task_id
        )
    );

drop policy if exists "Users can delete tag assignments of their tasks" on public.global_task_tag_assignments;
create policy "Users can delete tag assignments of their tasks" on public.global_task_tag_assignments
    for delete using (
        auth.uid() in (
            select created_by from public.global_tasks where id = task_id
            union
            select assigned_to from public.global_tasks where id = task_id
        )
    );

-- RLS Policies for Task Comments
drop policy if exists "Users can view comments of their tasks" on public.global_task_comments;
create policy "Users can view comments of their tasks" on public.global_task_comments
    for select using (
        auth.uid() in (
            select created_by from public.global_tasks where id = task_id
            union
            select assigned_to from public.global_tasks where id = task_id
        )
    );

drop policy if exists "Users can create comments on their tasks" on public.global_task_comments;
create policy "Users can create comments on their tasks" on public.global_task_comments
    for insert with check (
        auth.uid() = user_id and
        auth.uid() in (
            select created_by from public.global_tasks where id = task_id
            union
            select assigned_to from public.global_tasks where id = task_id
        )
    );

drop policy if exists "Users can update their own comments" on public.global_task_comments;
create policy "Users can update their own comments" on public.global_task_comments
    for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own comments" on public.global_task_comments;
create policy "Users can delete their own comments" on public.global_task_comments
    for delete using (auth.uid() = user_id);

-- RLS Policies for Task Time Entries
drop policy if exists "Users can view time entries of their tasks" on public.global_task_time_entries;
create policy "Users can view time entries of their tasks" on public.global_task_time_entries
    for select using (
        auth.uid() in (
            select created_by from public.global_tasks where id = task_id
            union
            select assigned_to from public.global_tasks where id = task_id
        )
    );

drop policy if exists "Users can create time entries for their tasks" on public.global_task_time_entries;
create policy "Users can create time entries for their tasks" on public.global_task_time_entries
    for insert with check (
        auth.uid() = user_id and
        auth.uid() in (
            select created_by from public.global_tasks where id = task_id
            union
            select assigned_to from public.global_tasks where id = task_id
        )
    );

drop policy if exists "Users can update their own time entries" on public.global_task_time_entries;
create policy "Users can update their own time entries" on public.global_task_time_entries
    for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own time entries" on public.global_task_time_entries;
create policy "Users can delete their own time entries" on public.global_task_time_entries
    for delete using (auth.uid() = user_id);

-- RLS Policies for Task Attachments
drop policy if exists "Users can view attachments of their tasks" on public.global_task_attachments;
create policy "Users can view attachments of their tasks" on public.global_task_attachments
    for select using (
        auth.uid() in (
            select created_by from public.global_tasks where id = task_id
            union
            select assigned_to from public.global_tasks where id = task_id
        )
    );

drop policy if exists "Users can create attachments for their tasks" on public.global_task_attachments;
create policy "Users can create attachments for their tasks" on public.global_task_attachments
    for insert with check (
        auth.uid() = user_id and
        auth.uid() in (
            select created_by from public.global_tasks where id = task_id
            union
            select assigned_to from public.global_tasks where id = task_id
        )
    );

drop policy if exists "Users can delete their own attachments" on public.global_task_attachments;
create policy "Users can delete their own attachments" on public.global_task_attachments
    for delete using (auth.uid() = user_id);

-- RLS Policies for Task Reminders
drop policy if exists "Users can view their own reminders" on public.global_task_reminders;
create policy "Users can view their own reminders" on public.global_task_reminders
    for select using (auth.uid() = user_id);

drop policy if exists "Users can create their own reminders" on public.global_task_reminders;
create policy "Users can create their own reminders" on public.global_task_reminders
    for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own reminders" on public.global_task_reminders;
create policy "Users can update their own reminders" on public.global_task_reminders
    for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own reminders" on public.global_task_reminders;
create policy "Users can delete their own reminders" on public.global_task_reminders
    for delete using (auth.uid() = user_id);

-- RLS Policies for User Task Preferences
drop policy if exists "Users can view their own preferences" on public.user_task_preferences;
create policy "Users can view their own preferences" on public.user_task_preferences
    for select using (auth.uid() = user_id);

drop policy if exists "Users can create their own preferences" on public.user_task_preferences;
create policy "Users can create their own preferences" on public.user_task_preferences
    for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own preferences" on public.user_task_preferences;
create policy "Users can update their own preferences" on public.user_task_preferences
    for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own preferences" on public.user_task_preferences;
create policy "Users can delete their own preferences" on public.user_task_preferences
    for delete using (auth.uid() = user_id);

-- Storage bucket for global task attachments
insert into storage.buckets (id, name, public) values ('global-task-attachments', 'global-task-attachments', false)
on conflict (id) do nothing;

-- Storage policies for global task attachments
drop policy if exists "Users can upload global task attachments" on storage.objects;
create policy "Users can upload global task attachments" on storage.objects
    for insert with check (
        bucket_id = 'global-task-attachments' and
        auth.uid() is not null
    );

drop policy if exists "Users can view global task attachments" on storage.objects;
create policy "Users can view global task attachments" on storage.objects
    for select using (
        bucket_id = 'global-task-attachments' and
        auth.uid() is not null
    );

drop policy if exists "Users can delete global task attachments" on storage.objects;
create policy "Users can delete global task attachments" on storage.objects
    for delete using (
        bucket_id = 'global-task-attachments' and
        auth.uid() is not null
    );

-- Create default categories for new users
create or replace function create_default_task_categories()
returns trigger as $$
begin
    -- Create default categories for new users
    insert into public.global_task_categories (name, description, color, icon, created_by) values
    ('Work', 'Work-related tasks', '#3B82F6', 'briefcase', new.id),
    ('Personal', 'Personal tasks and errands', '#10B981', 'user', new.id),
    ('Learning', 'Learning and skill development', '#8B5CF6', 'book-open', new.id),
    ('Health', 'Health and fitness related tasks', '#EF4444', 'heart', new.id),
    ('Finance', 'Financial tasks and planning', '#F59E0B', 'dollar-sign', new.id);
    
    -- Create default user preferences
    insert into public.user_task_preferences (user_id) values (new.id);
    
    return new;
end;
$$ language plpgsql;

-- Trigger to create default categories and preferences for new users
create trigger create_default_task_categories_trigger
after insert on auth.users
for each row execute function create_default_task_categories();
