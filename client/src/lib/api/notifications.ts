import { getSupabaseClient } from "../supabase";

export interface Notification {
	id: string;
	user_id: string;
	type: 'meeting_invite' | 'meeting_reminder' | 'task_assigned' | 'task_due' | 'task_updated' | 'project_update';
	title: string;
	message: string;
	related_id?: string;
	related_type?: 'meeting' | 'task' | 'project';
	is_read: boolean;
	created_at: string;
}

export async function getNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
	const supabase = getSupabaseClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	if (!user) return [];

	let query = supabase
		.from("notifications")
		.select("*")
		.eq("user_id", user.id)
		.order("created_at", { ascending: false })
		.limit(100);

	if (unreadOnly) {
		query = query.eq("is_read", false);
	}

	const { data, error } = await query;

	if (error) {
		console.error("Error fetching notifications:", error);
		return [];
	}

	return data || [];
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
	const supabase = getSupabaseClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	if (!user) return false;

	const { error } = await supabase
		.from("notifications")
		.update({ is_read: true })
		.eq("id", notificationId)
		.eq("user_id", user.id);

	if (error) {
		console.error("Error marking notification as read:", error);
		return false;
	}

	return true;
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
	const supabase = getSupabaseClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	if (!user) return false;

	const { error } = await supabase
		.from("notifications")
		.update({ is_read: true })
		.eq("user_id", user.id)
		.eq("is_read", false);

	if (error) {
		console.error("Error marking all notifications as read:", error);
		return false;
	}

	return true;
}

export async function deleteNotification(notificationId: string): Promise<boolean> {
	const supabase = getSupabaseClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	if (!user) return false;

	const { error } = await supabase
		.from("notifications")
		.delete()
		.eq("id", notificationId)
		.eq("user_id", user.id);

	if (error) {
		console.error("Error deleting notification:", error);
		return false;
	}

	return true;
}

export async function getUnreadNotificationCount(): Promise<number> {
	const supabase = getSupabaseClient();
	const { data: { user } } = await supabase.auth.getUser();
	
	if (!user) return 0;

	const { count, error } = await supabase
		.from("notifications")
		.select("*", { count: 'exact', head: true })
		.eq("user_id", user.id)
		.eq("is_read", false);

	if (error) {
		console.error("Error getting unread count:", error);
		return 0;
	}

	return count || 0;
}

