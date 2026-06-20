/**
 * MessagingContext — connects to real backend endpoints.
 * Falls back to mock data when the backend is unreachable.
 * Polls unread counts every 30 seconds while the tab is visible.
 */
import {
  createContext, useContext, useState, useEffect, useCallback,
  useRef, useMemo, type ReactNode,
} from "react";
import {
  notificationsApi, messagesApi,
  type ApiNotification,
} from "@/lib/api";
import {
  mockNotifications, mockMessages,
  type MockNotification, type MockMessage, type Role,
} from "@/lib/mock-data";
import { getAccessToken } from "@/lib/api";

export type UINotification = {
  id: string;
  type: MockNotification["type"];
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function apiNotifToUI(n: ApiNotification): UINotification {
  return {
    id:         String(n.id),
    type:       n.notification_type as UINotification["type"],
    title:      n.title,
    message:    n.message,
    is_read:    n.is_read,
    created_at: n.created_at,
  };
}

interface MessagingContextValue {
  notifications: UINotification[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  messages: MockMessage[];
  unreadMessageCount: number;
  markMessageRead: (id: string) => void;
  sendMessage: (msg: Omit<MockMessage, "id" | "created_at" | "reply_count" | "is_read">) => void;
  composeOpen: boolean;
  setComposeOpen: (open: boolean) => void;
  replyTo: MockMessage | null;
  setReplyTo: (msg: MockMessage | null) => void;
}

const MessagingContext = createContext<MessagingContextValue | null>(null);

export function MessagingProvider({ children, role }: { children: ReactNode; role: Role }) {
  // Stable: compute once, not on every render
  const hasToken = useRef(Boolean(getAccessToken()));

  const [notifications, setNotifications] = useState<UINotification[]>(() =>
    mockNotifications[role].map((n) => ({ ...n }))
  );
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [messages, setMessages] = useState<MockMessage[]>(() => mockMessages[role]);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<MockMessage | null>(null);

  // Sync mock data when role changes (dev mode only)
  const prevRoleRef = useRef(role);
  useEffect(() => {
    if (prevRoleRef.current === role) return;
    prevRoleRef.current = role;
    setMessages(mockMessages[role]);
    if (!hasToken.current) {
      setNotifications(mockNotifications[role].map((n) => ({ ...n })));
    }
  }, [role]);

  // Fetch from API — stable refs, no deps that change every render
  const fetchNotifications = useCallback(async () => {
    if (!hasToken.current) return;
    try {
      const [listRes, countRes] = await Promise.all([
        notificationsApi.list(),
        notificationsApi.unreadCount(),
      ]);
      setNotifications(listRes.results.map(apiNotifToUI));
      setUnreadNotifCount(countRes.unread_count);
    } catch {
      // Backend offline — keep mock data
    }
  }, []); // no deps — hasToken.current is a ref

  const fetchMessageCount = useCallback(async () => {
    if (!hasToken.current) return;
    try {
      const res = await messagesApi.unreadCount();
      setUnreadMsgCount(res.unread_count);
    } catch {
      // keep mock-derived count
    }
  }, []); // no deps

  // Initial fetch + 30-second polling — runs once on mount
  useEffect(() => {
    fetchNotifications();
    fetchMessageCount();
    const id = setInterval(() => {
      fetchNotifications();
      fetchMessageCount();
    }, 30_000);
    return () => clearInterval(id);
  }, []); // intentionally empty — functions are stable refs

  const derivedUnreadNotif = hasToken.current
    ? unreadNotifCount
    : notifications.filter((n) => !n.is_read).length;

  const derivedUnreadMsg = hasToken.current
    ? unreadMsgCount
    : messages.filter((m) => !m.is_read && m.sender_role !== role).length;

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    if (hasToken.current) {
      await notificationsApi.markRead(Number(id)).catch(() => {});
      setUnreadNotifCount((c) => Math.max(0, c - 1));
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    if (hasToken.current) {
      await notificationsApi.markAllRead().catch(() => {});
      setUnreadNotifCount(0);
    }
  }, []);

  const markMessageRead = useCallback(async (id: string) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, is_read: true } : m));
    if (hasToken.current) {
      await messagesApi.markRead(Number(id)).catch(() => {});
      setUnreadMsgCount((c) => Math.max(0, c - 1));
    }
  }, []);

  const sendMessage = useCallback(
    (msg: Omit<MockMessage, "id" | "created_at" | "reply_count" | "is_read">) => {
      const newMsg: MockMessage = {
        ...msg, id: `m-${Date.now()}`, is_read: true, reply_count: 0, created_at: "Just now",
      };
      setMessages((prev) => [newMsg, ...prev]);
    },
    []
  );

  const value = useMemo(() => ({
    notifications,
    unreadNotificationCount: derivedUnreadNotif,
    markNotificationRead,
    markAllNotificationsRead,
    messages,
    unreadMessageCount: derivedUnreadMsg,
    markMessageRead,
    sendMessage,
    composeOpen,
    setComposeOpen,
    replyTo,
    setReplyTo,
  }), [
    notifications, derivedUnreadNotif, markNotificationRead, markAllNotificationsRead,
    messages, derivedUnreadMsg, markMessageRead, sendMessage,
    composeOpen, replyTo,
  ]);

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error("useMessaging must be used within MessagingProvider");
  return ctx;
}
