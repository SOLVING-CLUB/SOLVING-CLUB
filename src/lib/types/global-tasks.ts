// Global Task Management System Types
// These types are separate from project tasks but can be linked

export interface GlobalTaskCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GlobalTaskTag {
  id: string;
  name: string;
  color: string;
  created_by: string;
  created_at: string;
}

export interface GlobalTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled' | 'on-hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category_id?: string;
  category?: GlobalTaskCategory;
  assigned_to?: string;
  assigned_user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  created_by: string;
  created_user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  due_date?: string;
  start_date?: string;
  completed_at?: string;
  estimated_hours?: number;
  actual_hours: number;
  progress: number;
  is_recurring: boolean;
  recurring_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurring_interval: number;
  parent_task_id?: string;
  parent_task?: GlobalTask;
  subtasks?: GlobalTask[];
  project_id?: string;
  project?: {
    id: string;
    name: string;
  };
  project_task_id?: string;
  project_task?: {
    id: string;
    title: string;
  };
  tags?: GlobalTaskTag[];
  dependencies?: GlobalTaskDependency[];
  comments?: GlobalTaskComment[];
  time_entries?: GlobalTaskTimeEntry[];
  attachments?: GlobalTaskAttachment[];
  reminders?: GlobalTaskReminder[];
  created_at: string;
  updated_at: string;
}

export interface GlobalTaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  depends_on_task?: GlobalTask;
  dependency_type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  created_at: string;
}

export interface GlobalTaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  content: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

export interface GlobalTaskTimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface GlobalTaskAttachment {
  id: string;
  task_id: string;
  user_id: string;
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  filename: string;
  file_path: string;
  file_size?: number;
  file_type?: string;
  created_at: string;
}

export interface GlobalTaskReminder {
  id: string;
  task_id: string;
  user_id: string;
  reminder_type: 'due_date' | 'start_date' | 'custom';
  reminder_time: string;
  is_sent: boolean;
  notification_method: 'in_app' | 'email' | 'push';
  created_at: string;
}

export interface UserTaskPreferences {
  id: string;
  user_id: string;
  default_view: 'kanban' | 'list' | 'calendar' | 'gantt';
  default_priority: 'low' | 'medium' | 'high' | 'urgent';
  default_category_id?: string;
  default_category?: GlobalTaskCategory;
  auto_archive_completed: boolean;
  show_completed_tasks: boolean;
  time_tracking_enabled: boolean;
  notifications_enabled: boolean;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

// Form types for creating/editing tasks
export interface CreateGlobalTaskData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category_id?: string;
  assigned_to?: string;
  due_date?: string;
  start_date?: string;
  estimated_hours?: number;
  is_recurring?: boolean;
  recurring_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurring_interval?: number;
  parent_task_id?: string;
  project_id?: string;
  project_task_id?: string;
  tag_ids?: string[];
}

export interface UpdateGlobalTaskData extends Partial<CreateGlobalTaskData> {
  status?: 'todo' | 'in-progress' | 'completed' | 'cancelled' | 'on-hold';
  progress?: number;
}

export interface CreateGlobalTaskCategoryData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface CreateGlobalTaskTagData {
  name: string;
  color?: string;
}

export interface CreateGlobalTaskCommentData {
  content: string;
  is_internal?: boolean;
}

export interface CreateGlobalTaskTimeEntryData {
  start_time: string;
  end_time?: string;
  description?: string;
}

export interface CreateGlobalTaskReminderData {
  reminder_type: 'due_date' | 'start_date' | 'custom';
  reminder_time: string;
  notification_method?: 'in_app' | 'email' | 'push';
}

// Filter and search types
export interface GlobalTaskFilters {
  status?: ('todo' | 'in-progress' | 'completed' | 'cancelled' | 'on-hold')[];
  priority?: ('low' | 'medium' | 'high' | 'urgent')[];
  category_id?: string[];
  assigned_to?: string[];
  created_by?: string[];
  project_id?: string[];
  tag_ids?: string[];
  due_date_from?: string;
  due_date_to?: string;
  created_date_from?: string;
  created_date_to?: string;
  has_dependencies?: boolean;
  is_recurring?: boolean;
  search?: string;
}

export interface GlobalTaskSortOptions {
  field: 'title' | 'status' | 'priority' | 'due_date' | 'created_at' | 'updated_at' | 'progress';
  direction: 'asc' | 'desc';
}

// Analytics and reporting types
export interface GlobalTaskAnalytics {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  tasks_by_status: Record<string, number>;
  tasks_by_priority: Record<string, number>;
  tasks_by_category: Record<string, number>;
  average_completion_time: number;
  total_time_tracked: number;
  productivity_score: number;
  completion_rate: number;
}

export interface GlobalTaskTimeAnalytics {
  total_hours: number;
  hours_by_day: Record<string, number>;
  hours_by_week: Record<string, number>;
  hours_by_month: Record<string, number>;
  hours_by_category: Record<string, number>;
  hours_by_user: Record<string, number>;
  average_session_duration: number;
  most_productive_hours: number[];
}

// Kanban board types
export interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  tasks: GlobalTask[];
  color: string;
  limit?: number;
}

export interface KanbanBoard {
  columns: KanbanColumn[];
  total_tasks: number;
}

// Calendar view types
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  task: GlobalTask;
  color: string;
}

// Gantt chart types
export interface GanttTask {
  id: string;
  title: string;
  start: string;
  end: string;
  progress: number;
  dependencies: string[];
  task: GlobalTask;
}

export interface GanttChart {
  tasks: GanttTask[];
  dependencies: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
  }>;
}

// Notification types
export interface GlobalTaskNotification {
  id: string;
  type: 'task_assigned' | 'task_due' | 'task_overdue' | 'task_completed' | 'comment_added' | 'time_entry_added';
  title: string;
  message: string;
  task_id: string;
  task?: GlobalTask;
  user_id: string;
  is_read: boolean;
  created_at: string;
}

// Export all types
export type {
  GlobalTaskCategory,
  GlobalTaskTag,
  GlobalTask,
  GlobalTaskDependency,
  GlobalTaskComment,
  GlobalTaskTimeEntry,
  GlobalTaskAttachment,
  GlobalTaskReminder,
  UserTaskPreferences,
  CreateGlobalTaskData,
  UpdateGlobalTaskData,
  CreateGlobalTaskCategoryData,
  CreateGlobalTaskTagData,
  CreateGlobalTaskCommentData,
  CreateGlobalTaskTimeEntryData,
  CreateGlobalTaskReminderData,
  GlobalTaskFilters,
  GlobalTaskSortOptions,
  GlobalTaskAnalytics,
  GlobalTaskTimeAnalytics,
  KanbanColumn,
  KanbanBoard,
  CalendarEvent,
  GanttTask,
  GanttChart,
  GlobalTaskNotification,
};
