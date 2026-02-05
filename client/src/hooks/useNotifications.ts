import { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import type { Notification } from '@/lib/api/notifications';
import { getUserNotifications, getUnreadNotificationCount } from '@/lib/api/notifications';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();
  const retryTimer = useRef<number | null>(null);
  const retryCount = useRef(0);
  const retryScheduled = useRef(false);
  const tearingDown = useRef(false);
  const lastStatus = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadNotifications() {
      try {
        const [notificationsData, count] = await Promise.all([
          getUserNotifications(50),
          getUnreadNotificationCount(),
        ]);

        if (mounted) {
          setNotifications(notificationsData);
          setUnreadCount(count);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading notifications', error);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadNotifications();

    // Set up real-time subscription with backoff
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const scheduleRetry = () => {
      if (retryScheduled.current) return;
      retryScheduled.current = true;
      retryCount.current += 1;
      const delay = Math.min(30000, 1000 * 2 ** (retryCount.current - 1));
      if (retryTimer.current) window.clearTimeout(retryTimer.current);
      retryTimer.current = window.setTimeout(() => {
        if (!mounted) return;
        retryScheduled.current = false;
        startRealtime();
      }, delay);
    };

    const teardown = () => {
      if (tearingDown.current) return;
      tearingDown.current = true;
      if (channel) {
        const current = channel;
        channel = null;
        // Defer removal to avoid recursive callbacks
        setTimeout(() => {
          supabase.removeChannel(current);
          tearingDown.current = false;
        }, 0);
      } else {
        tearingDown.current = false;
      }
    };

    const startRealtime = () => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user || !mounted) {
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        console.log('🔔 Setting up real-time subscription for user:', user.id);

        channel = supabase
          .channel(`notifications-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (!mounted) return;
              const newNotification = payload.new as Notification;
              setNotifications((prev) => [newNotification, ...prev]);
              setUnreadCount((prev) => prev + 1);
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (!mounted) return;
              const updatedNotification = payload.new as Notification;
              setNotifications((prev) =>
                prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
              );
              if (updatedNotification.is_read) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }
            }
          )
          .subscribe((status) => {
            if (lastStatus.current !== status) {
              console.log('🔔 Real-time subscription status:', status);
              lastStatus.current = status;
            }
            if (status === 'SUBSCRIBED') {
              retryCount.current = 0;
              retryScheduled.current = false;
            } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
              console.error('❌ Real-time subscription error');
              teardown();
              scheduleRetry();
            }
          });
      });
    };

    startRealtime();

    return () => {
      mounted = false;
      if (retryTimer.current) {
        window.clearTimeout(retryTimer.current);
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  const refreshNotifications = async () => {
    try {
      const [notificationsData, count] = await Promise.all([
        getUserNotifications(50),
        getUnreadNotificationCount(),
      ]);
      setNotifications(notificationsData);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error refreshing notifications', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
  };
}
