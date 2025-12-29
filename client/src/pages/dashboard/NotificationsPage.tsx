import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from '@/lib/api/notifications';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';
import { getSupabaseClient } from '@/lib/supabase';

export default function NotificationsPage() {
  const { notifications, unreadCount, refreshNotifications } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const supabase = getSupabaseClient();

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.related_type === 'meeting' && notification.related_id) {
      // Get project_id from the meeting
      const { data: meeting } = await supabase
        .from('project_meetings')
        .select('project_id')
        .eq('id', notification.related_id)
        .single();

      if (meeting) {
        window.location.href = `/dashboard/projects/${meeting.project_id}#meetings`;
      }
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'meeting_scheduled':
      case 'meeting_updated':
      case 'meeting_cancelled':
        return '📅';
      case 'task_assigned':
        return '✅';
      case 'message':
        return '💬';
      default:
        return '🔔';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            Stay updated with your activities and updates
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filter === 'unread' ? 'Unread Notifications' : 'All Notifications'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {filter === 'unread'
                  ? 'No unread notifications'
                  : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-muted/30 border-primary/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(
                                new Date(notification.created_at),
                                { addSuffix: true }
                              )}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <Badge variant="default" className="shrink-0">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

