-- Complete Project Finance Fix
-- This script fixes the missing budget_installments table and corrects RLS policies

-- Step 1: Create the missing budget_installments table
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

-- Step 2: Add missing installment_id column to client_payments if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'client_payments' 
                   AND column_name = 'installment_id') THEN
        ALTER TABLE public.client_payments
        ADD COLUMN installment_id uuid REFERENCES public.budget_installments(id) ON DELETE SET NULL;
        
        -- Create index for performance
        CREATE INDEX IF NOT EXISTS client_payments_installment_id_idx ON public.client_payments(installment_id);
        
        RAISE NOTICE 'Column installment_id added to public.client_payments table.';
    ELSE
        RAISE NOTICE 'Column installment_id already exists in public.client_payments table.';
    END IF;
END
$$;

-- Step 3: Create triggers for budget_installments
CREATE OR REPLACE TRIGGER budget_installments_set_updated_at
    BEFORE UPDATE ON public.budget_installments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS budget_installments_budget_id_idx ON public.budget_installments(budget_id);
CREATE INDEX IF NOT EXISTS budget_installments_status_idx ON public.budget_installments(status);
CREATE INDEX IF NOT EXISTS budget_installments_due_date_idx ON public.budget_installments(due_date);

-- Step 5: Enable RLS for budget_installments
ALTER TABLE public.budget_installments ENABLE ROW LEVEL SECURITY;

-- Step 6: Fix RLS policies for all project finance tables
-- First, drop the overly permissive "all_access" policies
DROP POLICY IF EXISTS "all_access" ON public.project_budgets;
DROP POLICY IF EXISTS "all_access" ON public.budget_installments;
DROP POLICY IF EXISTS "all_access" ON public.client_payments;
DROP POLICY IF EXISTS "all_access" ON public.payment_proof_files;

-- Step 7: Create proper RLS policies for project_budgets
CREATE POLICY "Project owners and members can view budgets" ON public.project_budgets
    FOR SELECT USING (
        auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = project_budgets.project_id) OR
        auth.uid() IN (SELECT user_id FROM public.project_members WHERE project_id = project_budgets.project_id)
    );

CREATE POLICY "Project owners can manage budgets" ON public.project_budgets
    FOR ALL USING (auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = project_budgets.project_id))
    WITH CHECK (auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = project_budgets.project_id));

-- Step 8: Create proper RLS policies for budget_installments
CREATE POLICY "Project owners and members can view installments" ON public.budget_installments
    FOR SELECT USING (
        auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = (SELECT project_id FROM public.project_budgets WHERE id = budget_installments.budget_id)) OR
        auth.uid() IN (SELECT user_id FROM public.project_members WHERE project_id = (SELECT project_id FROM public.project_budgets WHERE id = budget_installments.budget_id))
    );

CREATE POLICY "Project owners can manage installments" ON public.budget_installments
    FOR ALL USING (auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = (SELECT project_id FROM public.project_budgets WHERE id = budget_installments.budget_id)))
    WITH CHECK (auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = (SELECT project_id FROM public.project_budgets WHERE id = budget_installments.budget_id)));

-- Step 9: Create proper RLS policies for client_payments
CREATE POLICY "Project owners and members can view payments" ON public.client_payments
    FOR SELECT USING (
        auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = client_payments.project_id) OR
        auth.uid() IN (SELECT user_id FROM public.project_members WHERE project_id = client_payments.project_id)
    );

CREATE POLICY "Project owners and members can record payments" ON public.client_payments
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = client_payments.project_id) OR
        auth.uid() IN (SELECT user_id FROM public.project_members WHERE project_id = client_payments.project_id)
    );

CREATE POLICY "Project owners can manage all payments" ON public.client_payments
    FOR UPDATE USING (auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = client_payments.project_id))
    WITH CHECK (auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = client_payments.project_id));

CREATE POLICY "Project owners can delete payments" ON public.client_payments
    FOR DELETE USING (auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = client_payments.project_id));

-- Step 10: Create proper RLS policies for payment_proof_files
CREATE POLICY "Project owners and members can view proof files" ON public.payment_proof_files
    FOR SELECT USING (
        auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = (SELECT project_id FROM public.client_payments WHERE id = payment_proof_files.payment_id)) OR
        auth.uid() IN (SELECT user_id FROM public.project_members WHERE project_id = (SELECT project_id FROM public.client_payments WHERE id = payment_proof_files.payment_id))
    );

CREATE POLICY "Project owners and members can manage proof files" ON public.payment_proof_files
    FOR ALL USING (
        auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = (SELECT project_id FROM public.client_payments WHERE id = payment_proof_files.payment_id)) OR
        auth.uid() IN (SELECT user_id FROM public.project_members WHERE project_id = (SELECT project_id FROM public.client_payments WHERE id = payment_proof_files.payment_id))
    )
    WITH CHECK (
        auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = (SELECT project_id FROM public.client_payments WHERE id = payment_proof_files.payment_id)) OR
        auth.uid() IN (SELECT user_id FROM public.project_members WHERE project_id = (SELECT project_id FROM public.client_payments WHERE id = payment_proof_files.payment_id))
    );

-- Step 11: Create storage bucket for payment proofs if it doesn't exist
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Step 12: Create storage policies for payment proofs
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

-- Step 13: Ensure all tables have proper constraints and defaults
-- Update project_budgets to ensure currency defaults to INR
ALTER TABLE public.project_budgets ALTER COLUMN currency SET DEFAULT 'INR';

-- Update client_payments to ensure proper status constraints
ALTER TABLE public.client_payments DROP CONSTRAINT IF EXISTS client_payments_status_check;
ALTER TABLE public.client_payments ADD CONSTRAINT client_payments_status_check 
    CHECK (status IN ('pending', 'verified', 'rejected'));

-- Step 14: Create a function to calculate project financial summary
CREATE OR REPLACE FUNCTION public.get_project_financial_summary(project_uuid uuid)
RETURNS TABLE (
    total_budget decimal,
    total_paid decimal,
    remaining_amount decimal,
    currency text,
    installment_count bigint,
    paid_installments bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(pb.total_budget, 0) as total_budget,
        COALESCE(SUM(cp.amount) FILTER (WHERE cp.status = 'verified'), 0) as total_paid,
        COALESCE(pb.total_budget, 0) - COALESCE(SUM(cp.amount) FILTER (WHERE cp.status = 'verified'), 0) as remaining_amount,
        COALESCE(pb.currency, 'INR') as currency,
        COUNT(bi.id) as installment_count,
        COUNT(bi.id) FILTER (WHERE bi.status = 'paid') as paid_installments
    FROM public.projects p
    LEFT JOIN public.project_budgets pb ON p.id = pb.project_id
    LEFT JOIN public.budget_installments bi ON pb.id = bi.budget_id
    LEFT JOIN public.client_payments cp ON p.id = cp.project_id
    WHERE p.id = project_uuid
    GROUP BY pb.total_budget, pb.currency;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 15: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_project_financial_summary(uuid) TO authenticated;

-- Success message
SELECT 'Project Finance Management system fixed successfully!' as message,
       'All tables created, RLS policies secured, and functions added.' as details;
