-- Fix script for missing installment_id column
-- Run this if you get "column installment_id does not exist" error

-- Check if the column exists and add it if missing
DO $$ 
BEGIN
    -- Add installment_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'client_payments' 
        AND column_name = 'installment_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.client_payments 
        ADD COLUMN installment_id uuid references public.budget_installments(id) on delete set null;
        
        -- Add index for the new column
        CREATE INDEX IF NOT EXISTS client_payments_installment_id_idx 
        ON public.client_payments(installment_id);
        
        RAISE NOTICE 'Added installment_id column to client_payments table';
    ELSE
        RAISE NOTICE 'installment_id column already exists in client_payments table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'client_payments' 
AND table_schema = 'public'
ORDER BY ordinal_position;
