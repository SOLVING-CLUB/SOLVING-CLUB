import { getSupabaseClient } from '@/lib/supabase';

const supabase = getSupabaseClient();

export interface Notification {
  id: string;
  user_id: string;
  type: 'meeting_scheduled' | 'meeting_updated' | 'meeting_cancelled' | 'task_assigned' | 'message' | 'other';
  title: string;
  message: string;
  related_id: string | null;
  related_type: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationInput {
  user_id: string;
  type: Notification['type'];
  title: string;
  message: string;
  related_id?: string;
  related_type?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      message: input.message,
      related_id: input.related_id || null,
      related_type: input.related_type || null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating notification', error);
    throw error;
  }

  return data as Notification;
}

/**
 * Create notifications for multiple users
 */
export async function createNotificationsForUsers(
  userIds: string[],
  notificationData: Omit<CreateNotificationInput, 'user_id'>
): Promise<Notification[]> {
  if (userIds.length === 0) {
    console.warn('⚠️ No user IDs provided for notifications');
    return [];
  }

  // Get current user to verify authentication
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) {
    console.error('❌ Not authenticated - cannot create notifications');
    throw new Error('Not authenticated');
  }

  const notifications = userIds.map((userId) => ({
    user_id: userId,
    ...notificationData,
  }));

  console.log('📤 Creating notifications:', {
    currentUserId: currentUser.id,
    targetUserIds: userIds,
    notificationCount: notifications.length,
    notificationData
  });

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select('*');

  if (error) {
    console.error('❌ Error creating notifications:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    console.error('Failed notification data:', notifications);
    throw error;
  }

  console.log('✅ Notifications created successfully:', data?.length || 0);
  if (data && data.length > 0) {
    console.log('Created notification IDs:', data.map(n => n.id));
    console.log('Created notification user_ids:', data.map(n => n.user_id));
  } else {
    console.warn('⚠️ No notifications returned from insert (but no error)');
  }
  
  return (data || []) as Notification[];
}

/**
 * Get notifications for the current user
 */
export async function getUserNotifications(limit: number = 50): Promise<Notification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ Not authenticated - cannot fetch notifications');
    throw new Error('Not authenticated');
  }

  console.log('📥 Fetching notifications for user:', user.id);

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ Error fetching notifications', error);
    throw error;
  }

  console.log('📥 Fetched notifications:', data?.length || 0);
  return (data || []) as Notification[];
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read', error);
    throw error;
  }
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Error getting unread notification count', error);
    throw error;
  }

  return count || 0;
}

