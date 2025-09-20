-- Financial Management Schema for Projects
-- This file contains all financial-related tables and functionality

-- Project Budgets table
create table if not exists public.project_budgets (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references public.projects(id) on delete cascade not null,
    total_budget decimal(12,2) not null default 0,
    currency text not null default 'USD',
    budget_type text not null default 'fixed' check (budget_type in ('fixed', 'hourly', 'milestone')),
    hourly_rate decimal(8,2), -- for hourly projects
    estimated_hours integer, -- for hourly projects
    contingency_percentage decimal(5,2) default 10.0, -- 10% contingency
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(project_id)
);

-- Budget Categories for detailed breakdown
create table if not exists public.budget_categories (
    id uuid primary key default gen_random_uuid(),
    budget_id uuid references public.project_budgets(id) on delete cascade not null,
    category_name text not null,
    allocated_amount decimal(12,2) not null,
    spent_amount decimal(12,2) default 0,
    description text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Project Expenses table
create table if not exists public.project_expenses (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references public.projects(id) on delete cascade not null,
    budget_category_id uuid references public.budget_categories(id) on delete set null,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text,
    amount decimal(12,2) not null,
    currency text not null default 'USD',
    expense_date date not null,
    category text not null, -- 'labor', 'materials', 'software', 'travel', 'other'
    vendor text,
    receipt_url text, -- URL to uploaded receipt
    is_billable boolean default true,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Client Payments table
create table if not exists public.client_payments (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references public.projects(id) on delete cascade not null,
    client_id uuid references public.clients(id) on delete set null,
    amount decimal(12,2) not null,
    currency text not null default 'USD',
    payment_date date not null,
    payment_method text not null, -- 'bank_transfer', 'credit_card', 'paypal', 'check', 'cash', 'other'
    payment_reference text, -- transaction ID, check number, etc.
    status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Payment Proof Files table
create table if not exists public.payment_proof_files (
    id uuid primary key default gen_random_uuid(),
    payment_id uuid references public.client_payments(id) on delete cascade not null,
    file_name text not null,
    file_path text not null,
    file_size bigint,
    file_type text not null, -- 'image/jpeg', 'image/png', 'application/pdf', etc.
    uploaded_by uuid references auth.users(id) on delete cascade not null,
    created_at timestamptz default now()
);

-- Payment Milestones table (for milestone-based payments)
create table if not exists public.payment_milestones (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references public.projects(id) on delete cascade not null,
    milestone_name text not null,
    description text,
    due_date date,
    amount decimal(12,2) not null,
    percentage decimal(5,2) not null, -- percentage of total project value
    status text not null default 'pending' check (status in ('pending', 'completed', 'paid', 'overdue')),
    completion_date date,
    payment_id uuid references public.client_payments(id) on delete set null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Invoice Templates table
create table if not exists public.invoice_templates (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    template_name text not null,
    company_name text,
    company_address text,
    company_phone text,
    company_email text,
    company_website text,
    logo_url text,
    terms_and_conditions text,
    payment_terms text,
    is_default boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Invoices table
create table if not exists public.invoices (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references public.projects(id) on delete cascade not null,
    client_id uuid references public.clients(id) on delete set null,
    template_id uuid references public.invoice_templates(id) on delete set null,
    invoice_number text not null,
    issue_date date not null,
    due_date date not null,
    subtotal decimal(12,2) not null,
    tax_rate decimal(5,2) default 0,
    tax_amount decimal(12,2) default 0,
    total_amount decimal(12,2) not null,
    currency text not null default 'USD',
    status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    notes text,
    payment_terms text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Invoice Items table
create table if not exists public.invoice_items (
    id uuid primary key default gen_random_uuid(),
    invoice_id uuid references public.invoices(id) on delete cascade not null,
    description text not null,
    quantity decimal(10,2) not null default 1,
    unit_price decimal(12,2) not null,
    total_price decimal(12,2) not null,
    created_at timestamptz default now()
);

-- Financial Reports table (for storing generated reports)
create table if not exists public.financial_reports (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references public.projects(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    report_type text not null, -- 'budget_summary', 'expense_report', 'payment_summary', 'profit_loss'
    report_name text not null,
    report_data jsonb not null,
    generated_at timestamptz default now()
);

-- Triggers for updated_at timestamps
create or replace trigger project_budgets_set_updated_at
before update on public.project_budgets
for each row execute function public.set_updated_at();

create or replace trigger budget_categories_set_updated_at
before update on public.budget_categories
for each row execute function public.set_updated_at();

create or replace trigger project_expenses_set_updated_at
before update on public.project_expenses
for each row execute function public.set_updated_at();

create or replace trigger client_payments_set_updated_at
before update on public.client_payments
for each row execute function public.set_updated_at();

create or replace trigger payment_milestones_set_updated_at
before update on public.payment_milestones
for each row execute function public.set_updated_at();

create or replace trigger invoice_templates_set_updated_at
before update on public.invoice_templates
for each row execute function public.set_updated_at();

create or replace trigger invoices_set_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

-- Enable RLS for all financial tables
alter table public.project_budgets enable row level security;
alter table public.budget_categories enable row level security;
alter table public.project_expenses enable row level security;
alter table public.client_payments enable row level security;
alter table public.payment_proof_files enable row level security;
alter table public.payment_milestones enable row level security;
alter table public.invoice_templates enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.financial_reports enable row level security;

-- RLS Policies for Project Budgets
drop policy if exists "Users can view budgets for their projects" on public.project_budgets;
create policy "Users can view budgets for their projects" on public.project_budgets
    for select using (
        auth.uid() in (
            select user_id from public.project_members where project_id = project_budgets.project_id
            union
            select owner_id from public.projects where id = project_budgets.project_id
        )
    );

drop policy if exists "Project owners can manage budgets" on public.project_budgets;
create policy "Project owners can manage budgets" on public.project_budgets
    for all using (
        auth.uid() = (select owner_id from public.projects where id = project_budgets.project_id)
    );

-- RLS Policies for Budget Categories
drop policy if exists "Users can view budget categories for their projects" on public.budget_categories;
create policy "Users can view budget categories for their projects" on public.budget_categories
    for select using (
        auth.uid() in (
            select user_id from public.project_members pm
            join public.project_budgets pb on pm.project_id = pb.project_id
            where pb.id = budget_categories.budget_id
            union
            select owner_id from public.projects p
            join public.project_budgets pb on p.id = pb.project_id
            where pb.id = budget_categories.budget_id
        )
    );

drop policy if exists "Project owners can manage budget categories" on public.budget_categories;
create policy "Project owners can manage budget categories" on public.budget_categories
    for all using (
        auth.uid() = (
            select p.owner_id from public.projects p
            join public.project_budgets pb on p.id = pb.project_id
            where pb.id = budget_categories.budget_id
        )
    );

-- RLS Policies for Project Expenses
drop policy if exists "Users can view expenses for their projects" on public.project_expenses;
create policy "Users can view expenses for their projects" on public.project_expenses
    for select using (
        auth.uid() in (
            select user_id from public.project_members where project_id = project_expenses.project_id
            union
            select owner_id from public.projects where id = project_expenses.project_id
        )
    );

drop policy if exists "Project members can create expenses" on public.project_expenses;
create policy "Project members can create expenses" on public.project_expenses
    for insert with check (
        auth.uid() in (
            select user_id from public.project_members where project_id = project_expenses.project_id
            union
            select owner_id from public.projects where id = project_expenses.project_id
        )
    );

drop policy if exists "Project members can update their expenses" on public.project_expenses;
create policy "Project members can update their expenses" on public.project_expenses
    for update using (
        auth.uid() = user_id or
        auth.uid() = (select owner_id from public.projects where id = project_expenses.project_id)
    );

-- RLS Policies for Client Payments
drop policy if exists "Users can view payments for their projects" on public.client_payments;
create policy "Users can view payments for their projects" on public.client_payments
    for select using (
        auth.uid() in (
            select user_id from public.project_members where project_id = client_payments.project_id
            union
            select owner_id from public.projects where id = client_payments.project_id
        )
    );

drop policy if exists "Project owners can manage payments" on public.client_payments;
create policy "Project owners can manage payments" on public.client_payments
    for all using (
        auth.uid() = (select owner_id from public.projects where id = client_payments.project_id)
    );

-- RLS Policies for Payment Proof Files
drop policy if exists "Users can view payment proof files for their projects" on public.payment_proof_files;
create policy "Users can view payment proof files for their projects" on public.payment_proof_files
    for select using (
        auth.uid() in (
            select user_id from public.project_members pm
            join public.client_payments cp on pm.project_id = cp.project_id
            where cp.id = payment_proof_files.payment_id
            union
            select owner_id from public.projects p
            join public.client_payments cp on p.id = cp.project_id
            where cp.id = payment_proof_files.payment_id
        )
    );

drop policy if exists "Project owners can manage payment proof files" on public.payment_proof_files;
create policy "Project owners can manage payment proof files" on public.payment_proof_files
    for all using (
        auth.uid() = (
            select p.owner_id from public.projects p
            join public.client_payments cp on p.id = cp.project_id
            where cp.id = payment_proof_files.payment_id
        )
    );

-- RLS Policies for Payment Milestones
drop policy if exists "Users can view milestones for their projects" on public.payment_milestones;
create policy "Users can view milestones for their projects" on public.payment_milestones
    for select using (
        auth.uid() in (
            select user_id from public.project_members where project_id = payment_milestones.project_id
            union
            select owner_id from public.projects where id = payment_milestones.project_id
        )
    );

drop policy if exists "Project owners can manage milestones" on public.payment_milestones;
create policy "Project owners can manage milestones" on public.payment_milestones
    for all using (
        auth.uid() = (select owner_id from public.projects where id = payment_milestones.project_id)
    );

-- RLS Policies for Invoice Templates
drop policy if exists "Users can view their invoice templates" on public.invoice_templates;
create policy "Users can view their invoice templates" on public.invoice_templates
    for select using (auth.uid() = user_id);

drop policy if exists "Users can manage their invoice templates" on public.invoice_templates;
create policy "Users can manage their invoice templates" on public.invoice_templates
    for all using (auth.uid() = user_id);

-- RLS Policies for Invoices
drop policy if exists "Users can view invoices for their projects" on public.invoices;
create policy "Users can view invoices for their projects" on public.invoices
    for select using (
        auth.uid() in (
            select user_id from public.project_members where project_id = invoices.project_id
            union
            select owner_id from public.projects where id = invoices.project_id
        )
    );

drop policy if exists "Project owners can manage invoices" on public.invoices;
create policy "Project owners can manage invoices" on public.invoices
    for all using (
        auth.uid() = (select owner_id from public.projects where id = invoices.project_id)
    );

-- RLS Policies for Invoice Items
drop policy if exists "Users can view invoice items for their projects" on public.invoice_items;
create policy "Users can view invoice items for their projects" on public.invoice_items
    for select using (
        auth.uid() in (
            select user_id from public.project_members pm
            join public.invoices i on pm.project_id = i.project_id
            where i.id = invoice_items.invoice_id
            union
            select owner_id from public.projects p
            join public.invoices i on p.id = i.project_id
            where i.id = invoice_items.invoice_id
        )
    );

drop policy if exists "Project owners can manage invoice items" on public.invoice_items;
create policy "Project owners can manage invoice items" on public.invoice_items
    for all using (
        auth.uid() = (
            select p.owner_id from public.projects p
            join public.invoices i on p.id = i.project_id
            where i.id = invoice_items.invoice_id
        )
    );

-- RLS Policies for Financial Reports
drop policy if exists "Users can view reports for their projects" on public.financial_reports;
create policy "Users can view reports for their projects" on public.financial_reports
    for select using (
        auth.uid() in (
            select user_id from public.project_members where project_id = financial_reports.project_id
            union
            select owner_id from public.projects where id = financial_reports.project_id
        )
    );

drop policy if exists "Project members can create reports" on public.financial_reports;
create policy "Project members can create reports" on public.financial_reports
    for insert with check (
        auth.uid() = user_id and
        auth.uid() in (
            select user_id from public.project_members where project_id = financial_reports.project_id
            union
            select owner_id from public.projects where id = financial_reports.project_id
        )
    );

-- Storage bucket for financial files
insert into storage.buckets (id, name, public) values ('financial-files', 'financial-files', false)
on conflict (id) do nothing;

-- Storage policies for financial files
drop policy if exists "Project members can upload financial files" on storage.objects;
create policy "Project members can upload financial files" on storage.objects
    for insert with check (
        bucket_id = 'financial-files' and
        auth.uid() in (
            select user_id from public.project_members 
            where project_id::text = (storage.foldername(name))[2]
            union
            select owner_id from public.projects 
            where id::text = (storage.foldername(name))[2]
        )
    );

drop policy if exists "Project members can view financial files" on storage.objects;
create policy "Project members can view financial files" on storage.objects
    for select using (
        bucket_id = 'financial-files' and
        auth.uid() in (
            select user_id from public.project_members 
            where project_id::text = (storage.foldername(name))[2]
            union
            select owner_id from public.projects 
            where id::text = (storage.foldername(name))[2]
        )
    );

drop policy if exists "Project members can delete financial files" on storage.objects;
create policy "Project members can delete financial files" on storage.objects
    for delete using (
        bucket_id = 'financial-files' and
        auth.uid() in (
            select user_id from public.project_members 
            where project_id::text = (storage.foldername(name))[2]
            union
            select owner_id from public.projects 
            where id::text = (storage.foldername(name))[2]
        )
    );

-- Indexes for better performance
create index if not exists project_budgets_project_idx on public.project_budgets(project_id);
create index if not exists budget_categories_budget_idx on public.budget_categories(budget_id);
create index if not exists project_expenses_project_idx on public.project_expenses(project_id);
create index if not exists project_expenses_category_idx on public.project_expenses(budget_category_id);
create index if not exists project_expenses_date_idx on public.project_expenses(expense_date);
create index if not exists client_payments_project_idx on public.client_payments(project_id);
create index if not exists client_payments_client_idx on public.client_payments(client_id);
create index if not exists client_payments_date_idx on public.client_payments(payment_date);
create index if not exists payment_proof_files_payment_idx on public.payment_proof_files(payment_id);
create index if not exists payment_milestones_project_idx on public.payment_milestones(project_id);
create index if not exists invoice_templates_user_idx on public.invoice_templates(user_id);
create index if not exists invoices_project_idx on public.invoices(project_id);
create index if not exists invoices_client_idx on public.invoices(client_id);
create index if not exists invoice_items_invoice_idx on public.invoice_items(invoice_id);
create index if not exists financial_reports_project_idx on public.financial_reports(project_id);
create index if not exists financial_reports_user_idx on public.financial_reports(user_id);
