export type TaskStatus = 'todo' | 'in-progress' | 'completed';
export type TaskPriority = 'P1' | 'P2' | 'P3' | 'P4' | 'P5'; // P1 = highest priority

export interface ProjectTask {
  id: string;
  project_id: string;
  task_number?: number; // Auto-incrementing task ID per project
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  priority_label?: string; // For display (P1, P2, etc.)
  due_date?: string;
  start_date?: string;
  assigned_to?: string;
  assigned_team?: string; // Team name
  created_by?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  tags?: string[];
  labels?: string[];
  sprint?: string;
  milestone?: string;
  estimated_hours?: number;
  actual_hours?: number;
  order_index?: number;
  supporting_links?: string[]; // Array of URLs
  // Enriched fields
  assignee?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  creator?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  comments?: TaskComment[];
  custom_properties?: Record<string, any>; // Custom property values
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface CustomProperty {
  id: string;
  project_id: string;
  property_name: string;
  property_type: 'text' | 'number' | 'date' | 'dropdown' | 'tags' | 'boolean' | 'url';
  property_options?: string[]; // For dropdown options
  display_order: number;
  is_required: boolean;
  created_at: string;
}

export interface CreateTaskInput {
  project_id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  start_date?: string;
  assigned_to?: string;
  assigned_team?: string;
  tags?: string[];
  labels?: string[];
  sprint?: string;
  milestone?: string;
  estimated_hours?: number;
  supporting_links?: string[];
  custom_properties?: Record<string, any>;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  start_date?: string;
  assigned_to?: string;
  assigned_team?: string;
  tags?: string[];
  labels?: string[];
  sprint?: string;
  milestone?: string;
  estimated_hours?: number;
  actual_hours?: number;
  order_index?: number;
  supporting_links?: string[];
  custom_properties?: Record<string, any>;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigned_to?: string[];
  assigned_team?: string[];
  tags?: string[];
  labels?: string[];
  sprint?: string[];
  milestone?: string[];
  search?: string;
}

export type TaskSortField = 'task_number' | 'title' | 'status' | 'priority' | 'due_date' | 'created_at' | 'assigned_to' | 'assigned_team' | 'sprint' | 'milestone';
export type TaskSortDirection = 'asc' | 'desc';

export interface TaskSort {
  field: TaskSortField;
  direction: TaskSortDirection;
}

export type TaskGroupBy = 'status' | 'priority' | 'assignee' | 'assigned_team' | 'sprint' | 'milestone' | 'none';

