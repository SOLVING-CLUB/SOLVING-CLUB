import { getSupabaseClient } from '@/lib/supabase';
import type {
  ProjectTask,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  TaskSort,
  TaskGroupBy,
} from '@/lib/types/project-tasks';

const supabase = getSupabaseClient();

/**
 * Get all tasks for a project with optional filtering, sorting, and grouping
 */
export async function getProjectTasks(
  projectId: string,
  filters?: TaskFilters,
  sort?: TaskSort,
  groupBy?: TaskGroupBy
): Promise<ProjectTask[]> {
  let query = supabase
    .from('project_tasks')
    .select('*')
    .eq('project_id', projectId);

  // Apply filters
  if (filters) {
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    if (filters.priority && filters.priority.length > 0) {
      query = query.in('priority_label', filters.priority);
    }
    if (filters.assigned_to && filters.assigned_to.length > 0) {
      query = query.in('assigned_to', filters.assigned_to);
    }
    if (filters.assigned_team && filters.assigned_team.length > 0) {
      query = query.in('assigned_team', filters.assigned_team);
    }
    if (filters.sprint && filters.sprint.length > 0) {
      query = query.in('sprint', filters.sprint);
    }
    if (filters.milestone && filters.milestone.length > 0) {
      query = query.in('milestone', filters.milestone);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    // Tags and labels filtering (array contains)
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }
    if (filters.labels && filters.labels.length > 0) {
      query = query.overlaps('labels', filters.labels);
    }
  }

  // Apply sorting
  if (sort) {
    if (sort.field === 'priority') {
      // Sort by priority_label for P1, P2, etc.
      query = query.order('priority_label', { ascending: sort.direction === 'asc' });
    } else if (sort.field === 'task_number') {
      query = query.order('task_number', { ascending: sort.direction === 'asc' });
    } else {
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });
    }
  } else {
    query = query.order('task_number', { ascending: true }).order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching project tasks', error);
    throw error;
  }

  // Enrich with user data, comments, and custom properties
  const tasks = (data || []) as ProjectTask[];
  const enrichedTasks = await enrichTasksWithUsers(tasks);
  const tasksWithComments = await enrichTasksWithComments(enrichedTasks);
  const tasksWithCustomProps = await enrichTasksWithCustomProperties(tasksWithComments);

  return tasksWithCustomProps;
}

/**
 * Get a single task by ID
 */
export async function getProjectTaskById(taskId: string): Promise<ProjectTask | null> {
  const { data, error } = await supabase
    .from('project_tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) {
    console.error('Error fetching task', error);
    throw error;
  }

  if (!data) return null;

  const enriched = await enrichTasksWithUsers([data as ProjectTask]);
  const withComments = await enrichTasksWithComments(enriched);
  const withCustomProps = await enrichTasksWithCustomProperties(withComments);
  return withCustomProps[0] || null;
}

/**
 * Create a new task
 */
export async function createProjectTask(input: CreateTaskInput): Promise<ProjectTask> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const taskData: any = {
    ...input,
    created_by: user.id,
    status: input.status || 'todo',
    priority_label: input.priority || 'P2', // Default to P2 (medium)
    priority: 'medium', // Keep old field for backward compatibility
  };

  // Get max order_index for this project
  const { data: maxOrder } = await supabase
    .from('project_tasks')
    .select('order_index')
    .eq('project_id', input.project_id)
    .order('order_index', { ascending: false })
    .limit(1)
    .single();

  taskData.order_index = (maxOrder?.order_index || 0) + 1;

  const { data, error } = await supabase
    .from('project_tasks')
    .insert(taskData)
    .select()
    .single();

  if (error) {
    console.error('Error creating task', error);
    throw error;
  }

  const enriched = await enrichTasksWithUsers([data as ProjectTask]);
  const withComments = await enrichTasksWithComments(enriched);
  const withCustomProps = await enrichTasksWithCustomProperties(withComments);
  return withCustomProps[0];
}

/**
 * Update a task
 */
export async function updateProjectTask(taskId: string, input: UpdateTaskInput): Promise<ProjectTask> {
  // Handle priority_label update
  const updateData: any = { ...input };
  if (input.priority) {
    updateData.priority_label = input.priority;
  }

  const { data, error } = await supabase
    .from('project_tasks')
    .update(updateData)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Error updating task', error);
    throw error;
  }

  const enriched = await enrichTasksWithUsers([data as ProjectTask]);
  const withComments = await enrichTasksWithComments(enriched);
  const withCustomProps = await enrichTasksWithCustomProperties(withComments);
  return withCustomProps[0];
}

/**
 * Delete a task
 */
export async function deleteProjectTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('project_tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting task', error);
    throw error;
  }
}

/**
 * Update task order (for drag and drop)
 */
export async function updateTaskOrder(taskIds: string[]): Promise<void> {
  const updates = taskIds.map((id, index) => ({
    id,
    order_index: index,
  }));

  for (const update of updates) {
    await supabase
      .from('project_tasks')
      .update({ order_index: update.order_index })
      .eq('id', update.id);
  }
}

/**
 * Enrich tasks with user information (assignee and creator)
 */
async function enrichTasksWithUsers(tasks: ProjectTask[]): Promise<ProjectTask[]> {
  const userIds = new Set<string>();
  
  tasks.forEach(task => {
    if (task.assigned_to) userIds.add(task.assigned_to);
    if (task.created_by) userIds.add(task.created_by);
  });

  if (userIds.size === 0) return tasks;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', Array.from(userIds));

  const profileMap = new Map(
    (profiles || []).map(p => [p.id, { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url }])
  );

  return tasks.map(task => ({
    ...task,
    assignee: task.assigned_to ? profileMap.get(task.assigned_to) : undefined,
    creator: task.created_by ? profileMap.get(task.created_by) : undefined,
  }));
}

/**
 * Enrich tasks with comments
 */
async function enrichTasksWithComments(tasks: ProjectTask[]): Promise<ProjectTask[]> {
  if (tasks.length === 0) return tasks;

  const taskIds = tasks.map(t => t.id);
  const { data: comments } = await supabase
    .from('project_task_comments')
    .select('*, user:profiles(id, full_name, avatar_url)')
    .in('task_id', taskIds)
    .order('created_at', { ascending: true });

  if (!comments) return tasks;

  // Get user IDs for comments
  const userIds = new Set<string>();
  comments.forEach((c: any) => {
    if (c.user_id) userIds.add(c.user_id);
  });

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', Array.from(userIds));

  const profileMap = new Map(
    (profiles || []).map(p => [p.id, { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url }])
  );

  // Group comments by task_id
  const commentsByTask = new Map<string, any[]>();
  comments.forEach((c: any) => {
    if (!commentsByTask.has(c.task_id)) {
      commentsByTask.set(c.task_id, []);
    }
    commentsByTask.get(c.task_id)!.push({
      ...c,
      user: profileMap.get(c.user_id),
    });
  });

  return tasks.map(task => ({
    ...task,
    comments: commentsByTask.get(task.id) || [],
  }));
}

/**
 * Enrich tasks with custom properties
 */
async function enrichTasksWithCustomProperties(tasks: ProjectTask[]): Promise<ProjectTask[]> {
  if (tasks.length === 0) return tasks;

  const taskIds = tasks.map(t => t.id);
  const projectId = tasks[0].project_id;

  // Get custom properties for this project
  const { data: properties } = await supabase
    .from('project_task_custom_properties')
    .select('*')
    .eq('project_id', projectId)
    .order('display_order', { ascending: true });

  if (!properties || properties.length === 0) return tasks;

  // Get custom values for these tasks
  const { data: values } = await supabase
    .from('project_task_custom_values')
    .select('*, property:project_task_custom_properties(*)')
    .in('task_id', taskIds);

  if (!values) return tasks;

  // Group values by task_id
  const valuesByTask = new Map<string, Record<string, any>>();
  values.forEach((v: any) => {
    if (!valuesByTask.has(v.task_id)) {
      valuesByTask.set(v.task_id, {});
    }
    const prop = v.property;
    if (prop) {
      let value: any;
      switch (prop.property_type) {
        case 'text':
          value = v.value_text;
          break;
        case 'number':
          value = v.value_number;
          break;
        case 'date':
          value = v.value_date;
          break;
        case 'boolean':
          value = v.value_boolean;
          break;
        case 'tags':
        case 'dropdown':
          value = v.value_array;
          break;
        case 'url':
          value = v.value_text;
          break;
        default:
          value = v.value_text;
      }
      valuesByTask.get(v.task_id)![prop.property_name] = value;
    }
  });

  return tasks.map(task => ({
    ...task,
    custom_properties: valuesByTask.get(task.id) || {},
  }));
}

/**
 * Get unique values for filters (sprints, milestones, tags, labels, teams)
 */
export async function getProjectTaskMetadata(projectId: string): Promise<{
  tags: string[];
  labels: string[];
  teams: string[];
}> {
  const { data, error } = await supabase
    .from('project_tasks')
    .select('tags, labels, assigned_team')
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching task metadata', error);
    return { tags: [], labels: [], teams: [] };
  }

  const tags = new Set<string>();
  const labels = new Set<string>();
  const teams = new Set<string>();

  (data || []).forEach((task: any) => {
    if (task.assigned_team) teams.add(task.assigned_team);
    if (task.tags && Array.isArray(task.tags)) {
      task.tags.forEach((tag: string) => tags.add(tag));
    }
    if (task.labels && Array.isArray(task.labels)) {
      task.labels.forEach((label: string) => labels.add(label));
    }
  });

  return {
    tags: Array.from(tags).sort(),
    labels: Array.from(labels).sort(),
    teams: Array.from(teams).sort(),
  };
}

