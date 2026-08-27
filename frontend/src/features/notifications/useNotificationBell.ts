import { useCallback, useEffect, useState } from "react";
import { BackendNotification, connectNotificationsSocket, notificationsApi } from "@/shared/api/notifications";

/**
 * Everything a portal's notification bell needs: the caller's own feed, a
 * real unread count, live push, and optimistic mark-read.
 *
 * Shared because each portal had grown its own copy, and the copies had
 * drifted into non-working states — a hard-coded unread dot, a "Mark all
 * read" label with no handler, rows that couldn't be clicked, and a
 * hard-coded `role` filter that hid every personally-addressed notification.
 *
 * No `role` is sent: the server already scopes a non-admin to their personal
 * notifications plus their role's broadcasts, and passing one is what dropped
 * the personal half (those rows have `role = null`).
 */
export function useNotificationBell({ enabled = true, pageSize = 8 } = {}) {
  const [notifications, setNotifications] = useState<BackendNotification[]>([]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    notificationsApi.list({ pageSize })
      .then(res => { if (!cancelled) setNotifications(res.items); })
      .catch(() => { if (!cancelled) setNotifications([]); });
    return () => { cancelled = true; };
  }, [enabled, pageSize]);

  useEffect(() => {
    if (!enabled) return;
    const socket = connectNotificationsSocket();
    socket.on("notification", (raw: BackendNotification) => {
      setNotifications(prev => (prev.some(n => n.id === raw.id) ? prev : [raw, ...prev].slice(0, pageSize)));
    });
    return () => { socket.disconnect(); };
  }, [enabled, pageSize]);

  const unreadCount = notifications.filter(n => n.readAt === null).length;

  const markRead = useCallback((id: string) => {
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, readAt: n.readAt ?? now } : n)));
    notificationsApi.markRead(id).catch(() => {
      // Server state didn't change — undo the optimistic read.
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, readAt: null } : n)));
    });
  }, []);

  const markAllRead = useCallback(() => {
    notifications.filter(n => n.readAt === null).forEach(n => markRead(n.id));
  }, [notifications, markRead]);

  return { notifications, unreadCount, markRead, markAllRead };
}
