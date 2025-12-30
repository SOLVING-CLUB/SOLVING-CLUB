-- Add 'media' as a valid property type for custom columns
-- This migration safely updates the check constraint to include 'media' type
-- Using DO block to dynamically find and drop the existing constraint

DO $$
DECLARE
  constraint_name text;
  constraint_def text;
BEGIN
  -- Find all check constraints on the table and locate the one for property_type
  FOR constraint_name, constraint_def IN
    SELECT conname, pg_get_constraintdef(oid)
    FROM pg_constraint
    WHERE conrelid = 'public.project_task_custom_properties'::regclass
      AND contype = 'c'
  LOOP
    -- Check if this constraint is for property_type (contains property_type and IN clause)
    IF constraint_def LIKE '%property_type%' AND constraint_def LIKE '%IN%' THEN
      -- Drop the constraint
      EXECUTE format('ALTER TABLE public.project_task_custom_properties DROP CONSTRAINT IF EXISTS %I', constraint_name);
      RAISE NOTICE 'Dropped constraint: % (definition: %)', constraint_name, constraint_def;
      EXIT; -- Exit loop after finding and dropping the constraint
    END IF;
  END LOOP;
END $$;

-- Recreate the constraint with 'media' included
-- Drop the named constraint first if it exists (in case it was created with a specific name)
DO $$
BEGIN
  -- Drop the constraint by name if it exists (regardless of its definition)
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.project_task_custom_properties'::regclass
      AND conname = 'project_task_custom_properties_property_type_check'
  ) THEN
    ALTER TABLE public.project_task_custom_properties 
      DROP CONSTRAINT IF EXISTS project_task_custom_properties_property_type_check;
    RAISE NOTICE 'Dropped existing constraint by name';
  END IF;
  
  -- Now add the new constraint with media support
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'project_task_custom_properties'
  ) THEN
    ALTER TABLE public.project_task_custom_properties 
      ADD CONSTRAINT project_task_custom_properties_property_type_check 
      CHECK (property_type IN ('text', 'number', 'date', 'dropdown', 'tags', 'boolean', 'url', 'media'));
    RAISE NOTICE 'Added constraint with media type support';
  END IF;
END $$;

-- Note: Media values will be stored in value_array as JSON objects with file metadata
-- Example structure: [{"file_path": "...", "file_url": "...", "file_name": "...", "file_type": "...", "file_size": ...}]

