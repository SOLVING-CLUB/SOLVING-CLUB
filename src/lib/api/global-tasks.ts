// Global Task Management API Functions
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import type {
  GlobalTask,
  GlobalTaskCategory,
  GlobalTaskTag,
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
  KanbanBoard,
  CalendarEvent,
  GanttChart,
} from '@/lib/types/global-tasks';

const supabase = getSupabaseBrowserClient();

// Global Tasks CRUD Operations
export async function getGlobalTasks(
  filters?: GlobalTaskFilters,
  sort?: GlobalTaskSortOptions,
  limit?: number,
  offset?: number
): Promise<{ data: GlobalTask[]; count: number; error: any }> {
  try {
    let query = supabase
      .from('global_tasks')
      .select(`
        *,
        category:global_task_categories(*),
        project:projects(id, name),
        project_task:project_tasks(id, title),
        tags:global_task_tag_assignments(tag:global_task_tags(*)),
        dependencies:global_task_dependencies!task_id(*),
        comments:global_task_comments(*),
        time_entries:global_task_time_entries(*),
        attachments:global_task_attachments(*),
        reminders:global_task_reminders(*)
      `, { count: 'exact' });

    // Apply filters
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }
      if (filters.category_id && filters.category_id.length > 0) {
        query = query.in('category_id', filters.category_id);
      }
      if (filters.assigned_to && filters.assigned_to.length > 0) {
        query = query.in('assigned_to', filters.assigned_to);
      }
      if (filters.created_by && filters.created_by.length > 0) {
        query = query.in('created_by', filters.created_by);
      }
      if (filters.project_id && filters.project_id.length > 0) {
        query = query.in('project_id', filters.project_id);
      }
      if (filters.due_date_from) {
        query = query.gte('due_date', filters.due_date_from);
      }
      if (filters.due_date_to) {
        query = query.lte('due_date', filters.due_date_to);
      }
      if (filters.created_date_from) {
        query = query.gte('created_at', filters.created_date_from);
      }
      if (filters.created_date_to) {
        query = query.lte('created_at', filters.created_date_to);
      }
      if (filters.has_dependencies !== undefined) {
        if (filters.has_dependencies) {
          query = query.not('parent_task_id', 'is', null);
        } else {
          query = query.is('parent_task_id', null);
        }
      }
      if (filters.is_recurring !== undefined) {
        query = query.eq('is_recurring', filters.is_recurring);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    }

    // Apply sorting
    if (sort) {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.range(offset, offset + (limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching global tasks:', error);
      return { data: [], count: 0, error };
    }

    // Transform the data to flatten nested relationships
    const transformedData = data?.map(task => ({
      ...task,
      tags: task.tags?.map((t: any) => t.tag).filter(Boolean) || [],
      dependencies: task.dependencies?.map((d: any) => ({
        ...d,
        depends_on_task: d.depends_on_task
      })) || [],
    })) || [];

    return { data: transformedData, count: count || 0, error: null };
  } catch (error) {
    console.error('Error in getGlobalTasks:', error);
    return { data: [], count: 0, error };
  }
}

export async function getGlobalTaskById(id: string): Promise<{ data: GlobalTask | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('global_tasks')
      .select(`
        *,
        category:global_task_categories(*),
        project:projects(id, name),
        project_task:project_tasks(id, title),
        tags:global_task_tag_assignments(tag:global_task_tags(*)),
        dependencies:global_task_dependencies!task_id(*),
        comments:global_task_comments(*),
        time_entries:global_task_time_entries(*),
        attachments:global_task_attachments(*),
        reminders:global_task_reminders(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching global task:', error);
      return { data: null, error };
    }

    // Transform the data
    const transformedData = {
      ...data,
      tags: data.tags?.map((t: any) => t.tag).filter(Boolean) || [],
      dependencies: data.dependencies?.map((d: any) => ({
        ...d,
        depends_on_task: d.depends_on_task
      })) || [],
    };

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('Error in getGlobalTaskById:', error);
    return { data: null, error };
  }
}

export async function createGlobalTask(taskData: CreateGlobalTaskData): Promise<{ data: GlobalTask | null; error: any }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // sanitize payload (nulls for optional FKs/dates) and exclude non-column fields
    const {
      tag_ids,
      due_date,
      start_date,
      project_id,
      project_task_id,
      category_id,
      parent_task_id,
      assigned_to,
      ...rest
    } = taskData as any;

    const insertPayload: any = {
      ...rest,
      created_by: user.user.id,
      category_id: category_id || null,
      parent_task_id: parent_task_id || null,
      project_id: project_id || null,
      project_task_id: project_task_id || null,
      due_date: due_date || null,
      start_date: start_date || null,
      assigned_to: assigned_to || null,
    };

    const { data: insertedRow, error: insertError } = await supabase
      .from('global_tasks')
      .insert(insertPayload)
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating global task:', {
        message: (insertError as any)?.message,
        details: (insertError as any)?.details,
        hint: (insertError as any)?.hint,
        code: (insertError as any)?.code,
      });
      return { data: null, error: insertError };
    }

    const newTaskId = insertedRow.id as string;

    // Add tags if provided
    if (tag_ids && tag_ids.length > 0) {
      const tagAssignments = tag_ids.map((tagId: string) => ({
        task_id: newTaskId,
        tag_id: tagId,
      }));

      await supabase
        .from('global_task_tag_assignments')
        .insert(tagAssignments);
    }

    // Fetch full row (best-effort)
    const { data: fullTask } = await supabase
      .from('global_tasks')
      .select(`
        *,
        category:global_task_categories(*),
        project:projects(id, name),
        project_task:project_tasks(id, title),
        tags:global_task_tag_assignments(tag:global_task_tags(*))
      `)
      .eq('id', newTaskId)
      .maybeSingle();

    return { data: (fullTask as any) || ({ id: newTaskId, ...insertPayload } as any), error: null };
  } catch (error) {
    console.error('Error in createGlobalTask:', error);
    return { data: null, error };
  }
}

export async function updateGlobalTask(id: string, taskData: UpdateGlobalTaskData): Promise<{ data: GlobalTask | null; error: any }> {
  try {
    const {
      tag_ids,
      due_date,
      start_date,
      project_id,
      project_task_id,
      category_id,
      parent_task_id,
      ...rest
    } = taskData as any;

    const updatePayload: any = {
      ...rest,
      category_id: category_id ?? undefined,
      parent_task_id: parent_task_id ?? undefined,
      project_id: project_id ?? undefined,
      project_task_id: project_task_id ?? undefined,
      due_date: due_date === '' ? null : due_date,
      start_date: start_date === '' ? null : start_date,
    };

    const { data, error } = await supabase
      .from('global_tasks')
      .update(updatePayload)
      .eq('id', id)
      .select(`
        *,
        category:global_task_categories(*),
        project:projects(id, name),
        project_task:project_tasks(id, title)
      `)
      .single();

    if (error) {
      console.error('Error updating global task:', error);
      return { data: null, error };
    }

    // Update tags if provided
    if (tag_ids !== undefined) {
      // Remove existing tag assignments
      await supabase
        .from('global_task_tag_assignments')
        .delete()
        .eq('task_id', id);

      // Add new tag assignments
      if (tag_ids.length > 0) {
        const tagAssignments = tag_ids.map((tagId: string) => ({
          task_id: id,
          tag_id: tagId,
        }));

        await supabase
          .from('global_task_tag_assignments')
          .insert(tagAssignments);
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in updateGlobalTask:', error);
    return { data: null, error };
  }
}

export async function deleteGlobalTask(id: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('global_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting global task:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteGlobalTask:', error);
    return { error };
  }
}

// Categories CRUD Operations
export async function getGlobalTaskCategories(): Promise<{ data: GlobalTaskCategory[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from('global_task_categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching global task categories:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error in getGlobalTaskCategories:', error);
    return { data: [], error };
  }
}

export async function createGlobalTaskCategory(categoryData: CreateGlobalTaskCategoryData): Promise<{ data: GlobalTaskCategory | null; error: any }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('global_task_categories')
      .insert({
        ...categoryData,
        created_by: user.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating global task category:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        categoryData,
        userId: user.user.id
      });
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createGlobalTaskCategory:', error);
    return { data: null, error };
  }
}

export async function updateGlobalTaskCategory(id: string, categoryData: Partial<CreateGlobalTaskCategoryData>): Promise<{ data: GlobalTaskCategory | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('global_task_categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating global task category:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in updateGlobalTaskCategory:', error);
    return { data: null, error };
  }
}

export async function deleteGlobalTaskCategory(id: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('global_task_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting global task category:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteGlobalTaskCategory:', error);
    return { error };
  }
}

// Tags CRUD Operations
export async function getGlobalTaskTags(): Promise<{ data: GlobalTaskTag[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from('global_task_tags')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching global task tags:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error in getGlobalTaskTags:', error);
    return { data: [], error };
  }
}

export async function createGlobalTaskTag(tagData: CreateGlobalTaskTagData): Promise<{ data: GlobalTaskTag | null; error: any }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('global_task_tags')
      .insert({
        ...tagData,
        created_by: user.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating global task tag:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createGlobalTaskTag:', error);
    return { data: null, error };
  }
}

export async function updateGlobalTaskTag(id: string, tagData: Partial<CreateGlobalTaskTagData>): Promise<{ data: GlobalTaskTag | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('global_task_tags')
      .update(tagData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating global task tag:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in updateGlobalTaskTag:', error);
    return { data: null, error };
  }
}

export async function deleteGlobalTaskTag(id: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('global_task_tags')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting global task tag:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteGlobalTaskTag:', error);
    return { error };
  }
}

// Comments CRUD Operations
export async function getGlobalTaskComments(taskId: string): Promise<{ data: GlobalTaskComment[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from('global_task_comments')
      .select(`
        *
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching global task comments:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error in getGlobalTaskComments:', error);
    return { data: [], error };
  }
}

export async function createGlobalTaskComment(taskId: string, commentData: CreateGlobalTaskCommentData): Promise<{ data: GlobalTaskComment | null; error: any }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('global_task_comments')
      .insert({
        ...commentData,
        task_id: taskId,
        user_id: user.user.id,
      })
      .select(`
        *,
        user:profiles!global_task_comments_user_id_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error creating global task comment:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createGlobalTaskComment:', error);
    return { data: null, error };
  }
}

// Time Entries CRUD Operations
export async function getGlobalTaskTimeEntries(taskId: string): Promise<{ data: GlobalTaskTimeEntry[]; error: any }> {
  try {
    const { data, error } = await supabase
      .from('global_task_time_entries')
      .select(`
        *
      `)
      .eq('task_id', taskId)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching global task time entries:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error in getGlobalTaskTimeEntries:', error);
    return { data: [], error };
  }
}

export async function createGlobalTaskTimeEntry(taskId: string, timeEntryData: CreateGlobalTaskTimeEntryData): Promise<{ data: GlobalTaskTimeEntry | null; error: any }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    const { data, error } = await supabase
      .from('global_task_time_entries')
      .insert({
        ...timeEntryData,
        task_id: taskId,
        user_id: user.user.id,
      })
      .select(`
        *
      `)
      .single();

    if (error) {
      console.error('Error creating global task time entry:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createGlobalTaskTimeEntry:', error);
    return { data: null, error };
  }
}

export async function updateGlobalTaskTimeEntry(id: string, timeEntryData: Partial<CreateGlobalTaskTimeEntryData>): Promise<{ data: GlobalTaskTimeEntry | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('global_task_time_entries')
      .update(timeEntryData)
      .eq('id', id)
      .select(`
        *,
        user:profiles!global_task_time_entries_user_id_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (error) {
      console.error('Error updating global task time entry:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in updateGlobalTaskTimeEntry:', error);
    return { data: null, error };
  }
}

export async function deleteGlobalTaskTimeEntry(id: string): Promise<{ error: any }> {
  try {
    const { error } = await supabase
      .from('global_task_time_entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting global task time entry:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteGlobalTaskTimeEntry:', error);
    return { error };
  }
}

// User Preferences
export async function getUserTaskPreferences(): Promise<{ data: UserTaskPreferences | null; error: any }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Fetch the most recent preferences row without single-object header to avoid 409 on duplicates
    const { data, error } = await supabase
      .from('user_task_preferences')
      .select(`
        *,
        default_category:global_task_categories(*)
      `)
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching user task preferences:', error);
      return { data: null, error };
    }

    const pref = Array.isArray(data) ? (data[0] as any) : (data as any);
    return { data: (pref || null) as unknown as UserTaskPreferences, error: null };
  } catch (error) {
    console.error('Error in getUserTaskPreferences:', error);
    return { data: null, error };
  }
}

export async function updateUserTaskPreferences(preferences: Partial<UserTaskPreferences>): Promise<{ data: UserTaskPreferences | null; error: any }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Normalize payload (map nested default_category to default_category_id if needed)
    const normalized: any = { ...preferences };
    if ((normalized as any).default_category && !(normalized as any).default_category_id) {
      normalized.default_category_id = (normalized as any).default_category.id ?? null;
      delete normalized.default_category;
    }

    // First try update existing row for this user to avoid duplicate rows
    const { data: updated, error: updateError } = await supabase
      .from('user_task_preferences')
      .update(normalized)
      .eq('user_id', user.user.id)
      .select(`
        *,
        default_category:global_task_categories(*)
      `);

    if (updateError) {
      console.error('Error updating user task preferences:', updateError);
      return { data: null, error: updateError };
    }

    if (updated && updated.length > 0) {
      return { data: updated[0] as any, error: null };
    }

    // If no row existed, insert a new one
    const { data: inserted, error: insertError } = await supabase
      .from('user_task_preferences')
      .insert({
        user_id: user.user.id,
        ...normalized,
      })
      .select(`
        *,
        default_category:global_task_categories(*)
      `)
      .single();

    if (insertError) {
      console.error('Error inserting user task preferences:', insertError);
      return { data: null, error: insertError };
    }

    return { data: inserted as any, error: null };
  } catch (error) {
    console.error('Error in updateUserTaskPreferences:', error);
    return { data: null, error };
  }
}

// Analytics Functions
export async function getGlobalTaskAnalytics(): Promise<{ data: GlobalTaskAnalytics | null; error: any }> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { data: null, error: { message: 'User not authenticated' } };
    }

    // Get basic task counts
    const { data: tasks, error: tasksError } = await supabase
      .from('global_tasks')
      .select('status, priority, category_id, created_at, completed_at, actual_hours, due_date')
      .or(`created_by.eq.${user.user.id},assigned_to.eq.${user.user.id}`);

    if (tasksError) {
      console.error('Error fetching tasks for analytics:', tasksError);
      return { data: null, error: tasksError };
    }

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
    const inProgressTasks = tasks?.filter(t => t.status === 'in-progress').length || 0;
    const overdueTasks = tasks?.filter(t => 
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    ).length || 0;

    // Calculate analytics
    const tasksByStatus = tasks?.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const tasksByPriority = tasks?.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const totalTimeTracked = tasks?.reduce((sum, task) => sum + (task.actual_hours || 0), 0) || 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const analytics: GlobalTaskAnalytics = {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      in_progress_tasks: inProgressTasks,
      overdue_tasks: overdueTasks,
      tasks_by_status: tasksByStatus,
      tasks_by_priority: tasksByPriority,
      tasks_by_category: {}, // Will be populated with category data
      average_completion_time: 0, // Will be calculated with more complex logic
      total_time_tracked: totalTimeTracked,
      productivity_score: completionRate,
      completion_rate: completionRate,
    };

    return { data: analytics, error: null };
  } catch (error) {
    console.error('Error in getGlobalTaskAnalytics:', error);
    return { data: null, error };
  }
}

// Kanban Board
export async function getKanbanBoard(): Promise<{ data: KanbanBoard | null; error: any }> {
  try {
    const { data: tasks, error } = await supabase
      .from('global_tasks')
      .select(`
        *,
        category:global_task_categories(*),
        tags:global_task_tag_assignments(
          tag:global_task_tags(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks for kanban board:', error);
      return { data: null, error };
    }

    const statuses = ['todo', 'in-progress', 'completed', 'cancelled', 'on-hold'];
    const statusColors = {
      'todo': '#6B7280',
      'in-progress': '#3B82F6',
      'completed': '#10B981',
      'cancelled': '#EF4444',
      'on-hold': '#F59E0B',
    };

    const columns = statuses.map(status => ({
      id: status,
      title: status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      status,
      tasks: tasks?.filter(task => task.status === status).map(task => ({
        ...task,
        tags: task.tags?.map((t: any) => t.tag).filter(Boolean) || [],
      })) || [],
      color: statusColors[status as keyof typeof statusColors],
    }));

    const kanbanBoard: KanbanBoard = {
      columns,
      total_tasks: tasks?.length || 0,
    };

    return { data: kanbanBoard, error: null };
  } catch (error) {
    console.error('Error in getKanbanBoard:', error);
    return { data: null, error };
  }
}

// Calendar Events
export async function getCalendarEvents(startDate: string, endDate: string): Promise<{ data: CalendarEvent[]; error: any }> {
  try {
    const { data: tasks, error } = await supabase
      .from('global_tasks')
      .select(`
        *,
        category:global_task_categories(*)
      `)
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .order('due_date');

    if (error) {
      console.error('Error fetching tasks for calendar:', error);
      return { data: [], error };
    }

    const events: CalendarEvent[] = tasks?.map(task => ({
      id: task.id,
      title: task.title,
      start: task.due_date || task.created_at,
      end: task.due_date || task.created_at,
      allDay: true,
      task,
      color: task.category?.color || '#3B82F6',
    })) || [];

    return { data: events, error: null };
  } catch (error) {
    console.error('Error in getCalendarEvents:', error);
    return { data: [], error };
  }
}

// Gantt Chart
export async function getGanttChart(): Promise<{ data: GanttChart | null; error: any }> {
  try {
    const { data: tasks, error } = await supabase
      .from('global_tasks')
      .select(`
        *,
        dependencies:global_task_dependencies(
          depends_on_task_id
        )
      `)
      .not('start_date', 'is', null)
      .not('due_date', 'is', null);

    if (error) {
      console.error('Error fetching tasks for gantt chart:', error);
      return { data: null, error };
    }

    const ganttTasks = tasks?.map(task => ({
      id: task.id,
      title: task.title,
      start: task.start_date || task.created_at,
      end: task.due_date || task.created_at,
      progress: task.progress,
      dependencies: task.dependencies?.map((d: any) => d.depends_on_task_id) || [],
      task,
    })) || [];

    const dependencies = tasks?.flatMap(task => 
      task.dependencies?.map((dep: any) => ({
        id: `${task.id}-${dep.depends_on_task_id}`,
        source: dep.depends_on_task_id,
        target: task.id,
        type: 'finish-to-start',
      })) || []
    ) || [];

    const ganttChart: GanttChart = {
      tasks: ganttTasks,
      dependencies,
    };

    return { data: ganttChart, error: null };
  } catch (error) {
    console.error('Error in getGanttChart:', error);
    return { data: null, error };
  }
}
