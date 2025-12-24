import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import type { Notification } from '@/lib/api/notifications';
import { getUserNotifications, getUnreadNotificationCount } from '@/lib/api/notifications';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

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

    // Set up real-time subscription
    let channel: ReturnType<typeof supabase.channel> | null = null;

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
            console.log('🔔 Real-time INSERT received:', payload);
            if (!mounted) return;
            const newNotification = payload.new as Notification;
            console.log('➕ Adding new notification:', newNotification);
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => {
              const newCount = prev + 1;
              console.log('📊 Unread count updated:', newCount);
              return newCount;
            });
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
            console.log('🔔 Real-time UPDATE received:', payload);
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
          console.log('🔔 Real-time subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to notifications');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Real-time subscription error');
          }
        });
    });

    return () => {
      mounted = false;
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

