-- Add task_number (auto-incrementing per project)
ALTER TABLE public.project_tasks 
  ADD COLUMN IF NOT EXISTS task_number integer;

-- Create function to get next task number for a project
CREATE OR REPLACE FUNCTION public.get_next_task_number(p_project_id uuid)
RETURNS integer AS $$
DECLARE
  v_max_number integer;
BEGIN
  SELECT COALESCE(MAX(task_number), 0) INTO v_max_number
  FROM public.project_tasks
  WHERE project_id = p_project_id;
  
  RETURN v_max_number + 1;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign task number
CREATE OR REPLACE FUNCTION public.set_task_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.task_number IS NULL THEN
    NEW.task_number := public.get_next_task_number(NEW.project_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_tasks_set_task_number ON public.project_tasks;
CREATE TRIGGER project_tasks_set_task_number
  BEFORE INSERT ON public.project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_task_number();

-- Add new columns
ALTER TABLE public.project_tasks 
  ADD COLUMN IF NOT EXISTS assigned_team text,
  ADD COLUMN IF NOT EXISTS supporting_links text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS priority_label text DEFAULT 'P1' CHECK (priority_label ~ '^P[0-9]+$');

-- Update priority to use P1, P2, P3 format (migrate existing data)
UPDATE public.project_tasks 
SET priority_label = CASE 
  WHEN priority = 'high' THEN 'P1'
  WHEN priority = 'medium' THEN 'P2'
  WHEN priority = 'low' THEN 'P3'
  ELSE 'P2'
END
WHERE priority_label IS NULL OR priority_label = 'P1';

-- Create task comments table
CREATE TABLE IF NOT EXISTS public.project_task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.project_tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.project_task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON public.project_task_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created_at ON public.project_task_comments(created_at);

-- Create trigger for task comments updated_at
CREATE OR REPLACE TRIGGER project_task_comments_set_updated_at
  BEFORE UPDATE ON public.project_task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Create custom task properties table (for custom columns)
CREATE TABLE IF NOT EXISTS public.project_task_custom_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  property_name text NOT NULL,
  property_type text NOT NULL CHECK (property_type IN ('text', 'number', 'date', 'dropdown', 'tags', 'boolean', 'url')),
  property_options text[], -- For dropdown options
  display_order integer DEFAULT 0,
  is_required boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, property_name)
);

CREATE INDEX IF NOT EXISTS idx_custom_properties_project_id ON public.project_task_custom_properties(project_id);

-- Create task custom values table (stores actual values for custom properties)
CREATE TABLE IF NOT EXISTS public.project_task_custom_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.project_tasks(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.project_task_custom_properties(id) ON DELETE CASCADE NOT NULL,
  value_text text,
  value_number numeric,
  value_date date,
  value_boolean boolean,
  value_array text[], -- For tags/dropdown multi-select
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(task_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_values_task_id ON public.project_task_custom_values(task_id);
CREATE INDEX IF NOT EXISTS idx_custom_values_property_id ON public.project_task_custom_values(property_id);

-- Create trigger for custom values updated_at
CREATE OR REPLACE TRIGGER project_task_custom_values_set_updated_at
  BEFORE UPDATE ON public.project_task_custom_values
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.project_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_custom_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_task_custom_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task comments
DROP POLICY IF EXISTS "Users can view comments in their projects" ON public.project_task_comments;
CREATE POLICY "Users can view comments in their projects" ON public.project_task_comments
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_members 
      WHERE project_id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
      UNION
      SELECT owner_id FROM public.projects 
      WHERE id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    )
  );

DROP POLICY IF EXISTS "Project members can create comments" ON public.project_task_comments;
CREATE POLICY "Project members can create comments" ON public.project_task_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (
      SELECT user_id FROM public.project_members 
      WHERE project_id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
      UNION
      SELECT owner_id FROM public.projects 
      WHERE id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    )
  );

DROP POLICY IF EXISTS "Users can update their own comments" ON public.project_task_comments;
CREATE POLICY "Users can update their own comments" ON public.project_task_comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.project_task_comments;
CREATE POLICY "Users can delete their own comments" ON public.project_task_comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for custom properties
DROP POLICY IF EXISTS "Users can view custom properties in their projects" ON public.project_task_custom_properties;
CREATE POLICY "Users can view custom properties in their projects" ON public.project_task_custom_properties
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_members WHERE project_id = project_task_custom_properties.project_id
      UNION
      SELECT owner_id FROM public.projects WHERE id = project_task_custom_properties.project_id
    )
  );

DROP POLICY IF EXISTS "Project owners can manage custom properties" ON public.project_task_custom_properties;
CREATE POLICY "Project owners can manage custom properties" ON public.project_task_custom_properties
  FOR ALL USING (
    auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = project_id)
  );

-- RLS Policies for custom values
DROP POLICY IF EXISTS "Users can view custom values in their projects" ON public.project_task_custom_values;
CREATE POLICY "Users can view custom values in their projects" ON public.project_task_custom_values
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_members 
      WHERE project_id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
      UNION
      SELECT owner_id FROM public.projects 
      WHERE id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    )
  );

DROP POLICY IF EXISTS "Project members can manage custom values" ON public.project_task_custom_values;
CREATE POLICY "Project members can manage custom values" ON public.project_task_custom_values
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM public.project_members 
      WHERE project_id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
      UNION
      SELECT owner_id FROM public.projects 
      WHERE id = (SELECT project_id FROM public.project_tasks WHERE id = task_id)
    )
  );

-- Add index for task_number
CREATE INDEX IF NOT EXISTS idx_project_tasks_task_number ON public.project_tasks(project_id, task_number);

