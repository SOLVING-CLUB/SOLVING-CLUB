import { getSupabaseClient } from '@/lib/supabase';
import type { TaskComment } from '@/lib/types/project-tasks';

const supabase = getSupabaseClient();

/**
 * Get comments for a task
 */
export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from('project_task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching task comments', error);
    throw error;
  }

  // Enrich with user data
  const comments = (data || []) as TaskComment[];
  const userIds = new Set(comments.map(c => c.user_id));

  if (userIds.size === 0) return comments;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', Array.from(userIds));

  const profileMap = new Map(
    (profiles || []).map(p => [p.id, { id: p.id, full_name: p.full_name, avatar_url: p.avatar_url }])
  );

  return comments.map(comment => ({
    ...comment,
    user: profileMap.get(comment.user_id),
  }));
}

/**
 * Create a comment
 */
export async function createTaskComment(taskId: string, comment: string): Promise<TaskComment> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('project_task_comments')
    .insert({
      task_id: taskId,
      user_id: user.id,
      comment,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating comment', error);
    throw error;
  }

  // Enrich with user data
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  return {
    ...data,
    user: profile ? { id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url } : undefined,
  } as TaskComment;
}

/**
 * Update a comment
 */
export async function updateTaskComment(commentId: string, comment: string): Promise<TaskComment> {
  const { data, error } = await supabase
    .from('project_task_comments')
    .update({ comment })
    .eq('id', commentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating comment', error);
    throw error;
  }

  // Enrich with user data
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', data.user_id)
    .single();

  return {
    ...data,
    user: profile ? { id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url } : undefined,
  } as TaskComment;
}

/**
 * Delete a comment
 */
export async function deleteTaskComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('project_task_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment', error);
    throw error;
  }
}

