import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, type Notification } from "@/lib/api/notifications";
import { getSupabaseClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Bell, Check, CheckCheck, Trash2, Calendar, CheckSquare, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface NotificationCenterProps {
	trigger?: React.ReactNode;
}

export function NotificationCenter({ trigger }: NotificationCenterProps) {
	const [open, setOpen] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const supabase = getSupabaseClient();

	const loadNotifications = useCallback(async () => {
		setLoading(true);
		const data = await getNotifications();
		setNotifications(data);
		const unread = data.filter(n => !n.is_read).length;
		setUnreadCount(unread);
		setLoading(false);
	}, []);

	useEffect(() => {
		loadNotifications();

		// Subscribe to real-time notifications
		let channel: ReturnType<typeof supabase.channel> | null = null;
		
		(async () => {
			const { data: { user } } = await supabase.auth.getUser();
			if (!user) return;

			channel = supabase
				.channel(`notifications-${user.id}`)
				.on(
					'postgres_changes',
					{
						event: '*',
						schema: 'public',
						table: 'notifications',
						filter: `user_id=eq.${user.id}`,
					},
					() => {
						loadNotifications();
					}
				)
				.subscribe();
		})();

		return () => {
			if (channel) {
				supabase.removeChannel(channel);
			}
		};
	}, [loadNotifications, supabase]);

	async function handleMarkAsRead(notificationId: string) {
		await markNotificationAsRead(notificationId);
		loadNotifications();
	}

	async function handleMarkAllAsRead() {
		await markAllNotificationsAsRead();
		toast.success("All notifications marked as read");
		loadNotifications();
	}

	async function handleDelete(notificationId: string) {
		await deleteNotification(notificationId);
		loadNotifications();
	}

	function getNotificationIcon(type: Notification['type']) {
		switch (type) {
			case 'meeting_invite':
			case 'meeting_reminder':
				return <Calendar className="h-4 w-4" />;
			case 'task_assigned':
			case 'task_due':
			case 'task_updated':
				return <CheckSquare className="h-4 w-4" />;
			case 'project_update':
				return <Briefcase className="h-4 w-4" />;
			default:
				return <Bell className="h-4 w-4" />;
		}
	}

	function getNotificationColor(type: Notification['type']) {
		switch (type) {
			case 'meeting_invite':
			case 'meeting_reminder':
				return "text-blue-500";
			case 'task_assigned':
			case 'task_due':
			case 'task_updated':
				return "text-green-500";
			case 'project_update':
				return "text-purple-500";
			default:
				return "text-gray-500";
		}
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				{trigger || (
					<Button variant="ghost" size="icon" className="relative">
						<Bell className="h-5 w-5" />
						{unreadCount > 0 && (
							<Badge
								variant="destructive"
								className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
							>
								{unreadCount > 9 ? "9+" : unreadCount}
							</Badge>
						)}
					</Button>
				)}
			</SheetTrigger>
			<SheetContent className="w-full sm:max-w-md">
				<SheetHeader>
					<div className="flex items-center justify-between">
						<SheetTitle>Notifications</SheetTitle>
						{unreadCount > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleMarkAllAsRead}
								className="h-8"
							>
								<CheckCheck className="h-4 w-4 mr-1" />
								Mark all read
							</Button>
						)}
					</div>
					<SheetDescription>
						{unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : "All caught up!"}
					</SheetDescription>
				</SheetHeader>

				<ScrollArea className="h-[calc(100vh-120px)] mt-4">
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<div className="text-muted-foreground">Loading notifications...</div>
						</div>
					) : notifications.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<Bell className="h-12 w-12 text-muted-foreground mb-4" />
							<p className="text-muted-foreground">No notifications yet</p>
						</div>
					) : (
						<div className="space-y-1">
							{notifications.map((notification) => (
								<div
									key={notification.id}
									className={cn(
										"p-4 rounded-lg border transition-colors",
										!notification.is_read && "bg-accent/50 border-primary/20"
									)}
								>
									<div className="flex items-start gap-3">
										<div className={cn("mt-0.5", getNotificationColor(notification.type))}>
											{getNotificationIcon(notification.type)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between gap-2">
												<div className="flex-1">
													<p className={cn(
														"font-medium text-sm",
														!notification.is_read && "font-semibold"
													)}>
														{notification.title}
													</p>
													<p className="text-sm text-muted-foreground mt-1">
														{notification.message}
													</p>
													<p className="text-xs text-muted-foreground mt-2">
														{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
													</p>
												</div>
												{!notification.is_read && (
													<div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
												)}
											</div>
											<div className="flex items-center gap-2 mt-3">
												{!notification.is_read && (
													<Button
														variant="ghost"
														size="sm"
														className="h-7 text-xs"
														onClick={() => handleMarkAsRead(notification.id)}
													>
														<Check className="h-3 w-3 mr-1" />
														Mark read
													</Button>
												)}
												<Button
													variant="ghost"
													size="sm"
													className="h-7 text-xs text-destructive hover:text-destructive"
													onClick={() => handleDelete(notification.id)}
												>
													<Trash2 className="h-3 w-3 mr-1" />
													Delete
												</Button>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</SheetContent>
		</Sheet>
	);
}

