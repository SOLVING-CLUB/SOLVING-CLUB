# Media Storage Verification Guide

## Database Tables

### 1. `project_task_custom_properties`
**Purpose:** Stores custom column definitions (including media columns)

**Schema:**
```sql
CREATE TABLE public.project_task_custom_properties (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  property_name text NOT NULL,
  property_type text NOT NULL CHECK (property_type IN ('text', 'number', 'date', 'dropdown', 'tags', 'boolean', 'url', 'media')),
  property_options text[],
  display_order integer DEFAULT 0,
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, property_name)
);
```

**Key Points:**
- `property_type` must include 'media' (enforced by CHECK constraint)
- Migration: `20251225000002_add_media_property_type.sql` adds 'media' to allowed types

### 2. `project_task_custom_values`
**Purpose:** Stores actual values for custom properties (including media file metadata)

**Schema:**
```sql
CREATE TABLE public.project_task_custom_values (
  id uuid PRIMARY KEY,
  task_id uuid REFERENCES project_tasks(id),
  property_id uuid REFERENCES project_task_custom_properties(id),
  value_text text,
  value_number numeric,
  value_date date,
  value_boolean boolean,
  value_array text[],  -- Media files stored here as JSON array
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(task_id, property_id)
);
```

**Media Storage Format:**
For media type properties, data is stored in `value_array` as:
```json
[
  {
    "file_path": "projects/{projectId}/task-media/{taskId}/{fileName}",
    "file_name": "original-name.jpg",
    "file_type": "image/jpeg",
    "file_size": 123456,
    "uploaded_at": "2025-01-25T..."
  }
]
```

## Storage Buckets

### `project-files` Bucket
**Purpose:** Stores all project files including task media

**Configuration:**
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-files', 'project-files', false);
```

**Key Points:**
- `public: false` - Private bucket (requires signed URLs)
- Files stored at: `projects/{projectId}/task-media/{taskId}/{fileName}`

## Storage Policies

### Upload Policy
```sql
CREATE POLICY "Project members can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'project-files' AND
  auth.uid() IN (
    SELECT user_id FROM project_members 
    WHERE project_id::text = (storage.foldername(name))[2]
    UNION
    SELECT owner_id FROM projects 
    WHERE id::text = (storage.foldername(name))[2]
  )
);
```

### View Policy
```sql
CREATE POLICY "Project members can view files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'project-files' AND
  auth.uid() IN (
    SELECT user_id FROM project_members 
    WHERE project_id::text = (storage.foldername(name))[2]
    UNION
    SELECT owner_id FROM projects 
    WHERE id::text = (storage.foldername(name))[2]
  )
);
```

### Delete Policy
```sql
CREATE POLICY "Project members can delete files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'project-files' AND
  auth.uid() IN (
    SELECT user_id FROM project_members 
    WHERE project_id::text = (storage.foldername(name))[2]
    UNION
    SELECT owner_id FROM projects 
    WHERE id::text = (storage.foldername(name))[2]
  )
);
```

## Verification Queries

### Check if 'media' type is allowed:
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.project_task_custom_properties'::regclass
  AND contype = 'c'
  AND pg_get_constraintdef(oid) LIKE '%media%';
```

### Check storage bucket exists:
```sql
SELECT id, name, public 
FROM storage.buckets 
WHERE name = 'project-files';
```

### Check media custom properties:
```sql
SELECT id, project_id, property_name, property_type
FROM public.project_task_custom_properties
WHERE property_type = 'media';
```

### Check media values:
```sql
SELECT 
  ctv.id,
  ctv.task_id,
  cp.property_name,
  ctv.value_array
FROM public.project_task_custom_values ctv
JOIN public.project_task_custom_properties cp ON ctv.property_id = cp.id
WHERE cp.property_type = 'media'
  AND ctv.value_array IS NOT NULL;
```

### Check storage files:
```sql
SELECT name, bucket_id, created_at, metadata
FROM storage.objects
WHERE bucket_id = 'project-files'
  AND name LIKE 'projects/%/task-media/%'
ORDER BY created_at DESC
LIMIT 10;
```

## RLS Policies

### Custom Properties RLS
- **View:** Project members can view custom properties
- **Manage:** Project owners can create/update/delete custom properties

### Custom Values RLS
- **View:** Project members can view custom values
- **Manage:** Project members can create/update/delete custom values

## Migration Files

1. `20251225000001_enhance_task_tracker_advanced.sql`
   - Creates `project_task_custom_properties` table
   - Creates `project_task_custom_values` table
   - Sets up RLS policies

2. `20251225000002_add_media_property_type.sql`
   - Adds 'media' to property_type CHECK constraint
   - Ensures constraint allows media type

## File Upload Flow

1. **Upload to Storage:**
   - File uploaded to `project-files` bucket
   - Path: `projects/{projectId}/task-media/{taskId}/{fileName}`
   - Returns upload confirmation

2. **Save Metadata:**
   - Media metadata saved to `project_task_custom_values.value_array`
   - Includes: file_path, file_name, file_type, file_size, uploaded_at

3. **Retrieval:**
   - Generate signed URL using `createSignedUrl()` (1 hour expiry)
   - Use signed URL for preview and full-screen viewing

## Troubleshooting

### Media not showing:
1. Check if file exists in storage: `SELECT * FROM storage.objects WHERE name = '{file_path}'`
2. Check if metadata exists: `SELECT * FROM project_task_custom_values WHERE property_id = '{property_id}'`
3. Verify signed URL generation works
4. Check browser console for errors

### Upload fails:
1. Verify storage policies allow upload
2. Check user is project member
3. Verify bucket exists and is accessible
4. Check file size limits

### Constraint violation:
1. Verify migration `20251225000002_add_media_property_type.sql` ran
2. Check constraint includes 'media': Run verification query above
3. Re-run migration if needed

