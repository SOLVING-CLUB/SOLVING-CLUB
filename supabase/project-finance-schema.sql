-- Project Finance Management Schema
-- Simplified schema for project-specific financial tracking

-- Project Budgets table
create table if not exists public.project_budgets (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references public.projects(id) on delete cascade not null,
    total_budget decimal(15,2) not null,
    currency text not null default 'INR',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(project_id)
);

-- Budget Installments table
create table if not exists public.budget_installments (
    id uuid primary key default gen_random_uuid(),
    budget_id uuid references public.project_budgets(id) on delete cascade not null,
    amount decimal(15,2) not null,
    due_date date not null,
    description text not null,
    status text not null default 'pending' check (status in ('pending', 'paid', 'overdue')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Client Payments table
create table if not exists public.client_payments (
    id uuid primary key default gen_random_uuid(),
    project_id uuid references public.projects(id) on delete cascade not null,
    installment_id uuid references public.budget_installments(id) on delete set null,
    amount decimal(15,2) not null,
    payment_date date not null,
    description text,
    status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Payment Proof Files table
create table if not exists public.payment_proof_files (
    id uuid primary key default gen_random_uuid(),
    payment_id uuid references public.client_payments(id) on delete cascade not null,
    file_name text not null,
    file_path text not null,
    file_size bigint not null,
    file_type text not null,
    uploaded_at timestamptz default now()
);

-- Triggers to update timestamps
create or replace trigger project_budgets_set_updated_at
before update on public.project_budgets
for each row execute function public.set_updated_at();

create or replace trigger budget_installments_set_updated_at
before update on public.budget_installments
for each row execute function public.set_updated_at();

create or replace trigger client_payments_set_updated_at
before update on public.client_payments
for each row execute function public.set_updated_at();

-- RLS Policies for Project Budgets
alter table public.project_budgets enable row level security;

create policy "Project owners and members can view budgets" on public.project_budgets
    for select using (
        auth.uid() in (select owner_id from public.projects where id = project_budgets.project_id) OR
        auth.uid() in (select user_id from public.project_members where project_id = project_budgets.project_id)
    );

create policy "Project owners can manage budgets" on public.project_budgets
    for all using (auth.uid() in (select owner_id from public.projects where id = project_budgets.project_id))
    with check (auth.uid() in (select owner_id from public.projects where id = project_budgets.project_id));

-- RLS Policies for Budget Installments
alter table public.budget_installments enable row level security;

create policy "Project owners and members can view installments" on public.budget_installments
    for select using (
        auth.uid() in (select owner_id from public.projects where id = (select project_id from public.project_budgets where id = budget_installments.budget_id)) OR
        auth.uid() in (select user_id from public.project_members where project_id = (select project_id from public.project_budgets where id = budget_installments.budget_id))
    );

create policy "Project owners can manage installments" on public.budget_installments
    for all using (auth.uid() in (select owner_id from public.projects where id = (select project_id from public.project_budgets where id = budget_installments.budget_id)))
    with check (auth.uid() in (select owner_id from public.projects where id = (select project_id from public.project_budgets where id = budget_installments.budget_id)));

-- RLS Policies for Client Payments
alter table public.client_payments enable row level security;

create policy "Project owners and members can view payments" on public.client_payments
    for select using (
        auth.uid() in (select owner_id from public.projects where id = client_payments.project_id) OR
        auth.uid() in (select user_id from public.project_members where project_id = client_payments.project_id)
    );

create policy "Project owners can manage payments" on public.client_payments
    for all using (auth.uid() in (select owner_id from public.projects where id = client_payments.project_id))
    with check (auth.uid() in (select owner_id from public.projects where id = client_payments.project_id));

-- RLS Policies for Payment Proof Files
alter table public.payment_proof_files enable row level security;

create policy "Project owners and members can view proof files" on public.payment_proof_files
    for select using (
        auth.uid() in (select owner_id from public.projects where id = (select project_id from public.client_payments where id = payment_proof_files.payment_id)) OR
        auth.uid() in (select user_id from public.project_members where project_id = (select project_id from public.client_payments where id = payment_proof_files.payment_id))
    );

create policy "Project owners can manage proof files" on public.payment_proof_files
    for all using (auth.uid() in (select owner_id from public.projects where id = (select project_id from public.client_payments where id = payment_proof_files.payment_id)))
    with check (auth.uid() in (select owner_id from public.projects where id = (select project_id from public.client_payments where id = payment_proof_files.payment_id)));

-- Storage bucket for payment proof files
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- Storage policies for payment proof files
create policy "Authenticated users can upload payment proof files" on storage.objects
    for insert with check (
        bucket_id = 'payment-proofs' AND auth.role() = 'authenticated'
    );

create policy "Project owners and members can view payment proof files" on storage.objects
    for select using (
        bucket_id = 'payment-proofs' AND auth.role() = 'authenticated'
    );

create policy "Project owners can delete payment proof files" on storage.objects
    for delete using (
        bucket_id = 'payment-proofs' AND auth.role() = 'authenticated'
    );

-- Indexes for better performance
create index if not exists project_budgets_project_id_idx on public.project_budgets(project_id);
create index if not exists budget_installments_budget_id_idx on public.budget_installments(budget_id);
create index if not exists budget_installments_status_idx on public.budget_installments(status);
create index if not exists client_payments_project_id_idx on public.client_payments(project_id);
create index if not exists client_payments_installment_id_idx on public.client_payments(installment_id);
create index if not exists client_payments_status_idx on public.client_payments(status);
create index if not exists payment_proof_files_payment_id_idx on public.payment_proof_files(payment_id);
