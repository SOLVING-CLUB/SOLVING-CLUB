-- Create Project Finance tables in correct order
-- Run this script to create all tables properly

-- Step 1: Create project_budgets table first
CREATE TABLE IF NOT EXISTS public.project_budgets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    total_budget decimal(15,2) NOT NULL,
    currency text NOT NULL DEFAULT 'INR',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(project_id)
);

-- Step 2: Create budget_installments table (depends on project_budgets)
CREATE TABLE IF NOT EXISTS public.budget_installments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id uuid REFERENCES public.project_budgets(id) ON DELETE CASCADE NOT NULL,
    amount decimal(15,2) NOT NULL,
    due_date date NOT NULL,
    description text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Step 3: Create client_payments table (depends on projects and budget_installments)
CREATE TABLE IF NOT EXISTS public.client_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    installment_id uuid REFERENCES public.budget_installments(id) ON DELETE SET NULL,
    amount decimal(15,2) NOT NULL,
    payment_date date NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Step 4: Create payment_proof_files table (depends on client_payments)
CREATE TABLE IF NOT EXISTS public.payment_proof_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid REFERENCES public.client_payments(id) ON DELETE CASCADE NOT NULL,
    file_name text NOT NULL,
    file_path text NOT NULL,
    file_size bigint NOT NULL,
    file_type text NOT NULL,
    uploaded_at timestamptz DEFAULT now()
);

-- Step 5: Create triggers
CREATE OR REPLACE TRIGGER project_budgets_set_updated_at
    BEFORE UPDATE ON public.project_budgets
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER budget_installments_set_updated_at
    BEFORE UPDATE ON public.budget_installments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER client_payments_set_updated_at
    BEFORE UPDATE ON public.client_payments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Step 6: Enable RLS
ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proof_files ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
-- Project Budgets policies
DROP POLICY IF EXISTS "Project owners and members can view budgets" ON public.project_budgets;
CREATE POLICY "Project owners and members can view budgets" ON public.project_budgets
    FOR SELECT USING (
        auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = project_budgets.project_id) OR
        auth.uid() IN (SELECT user_id FROM public.project_members WHERE project_id = project_budgets.project_id)
    );

DROP POLICY IF EXISTS "Project owners can manage budgets" ON public.project_budgets;
CREATE POLICY "Project owners can manage budgets" ON public.project_budgets
    FOR ALL USING (auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = project_budgets.project_id))
    WITH CHECK (auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = project_budgets.project_id));

-- Budget Installments policies
DROP POLICY IF EXISTS "Project owners and members can view installments" ON public.budget_installments;
CREATE POLICY "Project owners and members can view installments" ON public.budget_installments
    FOR SELECT USING (
        auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = (SELECT project_id FROM public.project_budgets WHERE id = budget_installments.budget_id)) OR
        auth.uid() IN (SELECT user_id FROM public.project_members WHERE project_id = (SELECT project_id FROM public.project_budgets WHERE id = budget_installments.budget_id))
    );

DROP POLICY IF EXISTS "Project owners can manage installments" ON public.budget_installments;
CREATE POLICY "Project owners can manage installments" ON public.budget_installments
    FOR ALL USING (auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = (SELECT project_id FROM public.project_budgets WHERE id = budget_installments.budget_id)))
    WITH CHECK (auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = (SELECT project_id FROM public.project_budgets WHERE id = budget_installments.budget_id)));

-- Client Payments policies
DROP POLICY IF EXISTS "Project owners and members can view payments" ON public.client_payments;
CREATE POLICY "Project owners and members can view payments" ON public.client_payments
    FOR SELECT USING (
        auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = client_payments.project_id) OR
        auth.uid() IN (SELECT user_id FROM public.project_members WHERE project_id = client_payments.project_id)
    );

DROP POLICY IF EXISTS "Project owners can manage payments" ON public.client_payments;
CREATE POLICY "Project owners can manage payments" ON public.client_payments
    FOR ALL USING (auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = client_payments.project_id))
    WITH CHECK (auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = client_payments.project_id));

-- Payment Proof Files policies
DROP POLICY IF EXISTS "Project owners and members can view proof files" ON public.payment_proof_files;
CREATE POLICY "Project owners and members can view proof files" ON public.payment_proof_files
    FOR SELECT USING (
        auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = (SELECT project_id FROM public.client_payments WHERE id = payment_proof_files.payment_id)) OR
        auth.uid() IN (SELECT user_id FROM public.project_members WHERE project_id = (SELECT project_id FROM public.client_payments WHERE id = payment_proof_files.payment_id))
    );

DROP POLICY IF EXISTS "Project owners can manage proof files" ON public.payment_proof_files;
CREATE POLICY "Project owners can manage proof files" ON public.payment_proof_files
    FOR ALL USING (auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = (SELECT project_id FROM public.client_payments WHERE id = payment_proof_files.payment_id)))
    WITH CHECK (auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = (SELECT project_id FROM public.client_payments WHERE id = payment_proof_files.payment_id)));

-- Step 8: Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Step 9: Create storage policies
DROP POLICY IF EXISTS "Authenticated users can upload payment proof files" ON storage.objects;
CREATE POLICY "Authenticated users can upload payment proof files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'payment-proofs' AND auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Project owners and members can view payment proof files" ON storage.objects;
CREATE POLICY "Project owners and members can view payment proof files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment-proofs' AND auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Project owners can delete payment proof files" ON storage.objects;
CREATE POLICY "Project owners can delete payment proof files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'payment-proofs' AND auth.role() = 'authenticated'
    );

-- Step 10: Create indexes
CREATE INDEX IF NOT EXISTS project_budgets_project_id_idx ON public.project_budgets(project_id);
CREATE INDEX IF NOT EXISTS budget_installments_budget_id_idx ON public.budget_installments(budget_id);
CREATE INDEX IF NOT EXISTS budget_installments_status_idx ON public.budget_installments(status);
CREATE INDEX IF NOT EXISTS client_payments_project_id_idx ON public.client_payments(project_id);
CREATE INDEX IF NOT EXISTS client_payments_installment_id_idx ON public.client_payments(installment_id);
CREATE INDEX IF NOT EXISTS client_payments_status_idx ON public.client_payments(status);
CREATE INDEX IF NOT EXISTS payment_proof_files_payment_id_idx ON public.payment_proof_files(payment_id);

-- Success message
SELECT 'Project Finance Management tables created successfully!' as message;
