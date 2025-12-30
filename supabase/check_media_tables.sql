-- Check related tables and storage buckets for media functionality

-- 1. Check project_task_custom_properties table structure
SELECT 
    'project_task_custom_properties' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'project_task_custom_properties'
ORDER BY ordinal_position;

-- 2. Check project_task_custom_values table structure
SELECT 
    'project_task_custom_values' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'project_task_custom_values'
ORDER BY ordinal_position;

-- 3. Check property_type constraint (should include 'media')
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.project_task_custom_properties'::regclass
  AND contype = 'c'
  AND pg_get_constraintdef(oid) LIKE '%property_type%';

-- 4. Check storage buckets
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE name = 'project-files';

-- 5. Check storage policies for project-files bucket
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%project%files%'
  OR policyname LIKE '%Project members%';

-- 6. Check sample data in custom_properties (if any)
SELECT 
    id,
    project_id,
    property_name,
    property_type,
    display_order,
    is_required,
    created_at
FROM public.project_task_custom_properties
WHERE property_type = 'media'
LIMIT 5;

-- 7. Check sample data in custom_values (if any)
SELECT 
    id,
    task_id,
    property_id,
    value_array,
    created_at,
    updated_at
FROM public.project_task_custom_values
WHERE value_array IS NOT NULL
LIMIT 5;

-- 8. Count media custom properties
SELECT 
    COUNT(*) as total_media_properties
FROM public.project_task_custom_properties
WHERE property_type = 'media';

-- 9. Count tasks with media values
SELECT 
    COUNT(DISTINCT task_id) as tasks_with_media
FROM public.project_task_custom_values
WHERE value_array IS NOT NULL 
  AND jsonb_array_length(value_array::jsonb) > 0;

