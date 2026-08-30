/**
 * Shop Staff → notifications model.
 * ═══════════════════════════════════════════════════════════════════════════
 * One source of truth for the shop's notification feed, shared by the bell
 * dropdowns (desktop top nav + mobile header) and the full Notifications page.
 *
 * The feed is a merge of three streams:
 *   • the backend `/notifications` rows scoped to the caller,
 *   • recent returns, and
 *   • recent sales,
 * so the shop sees store activity even before a row is pushed for it.
 */
import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, RotateCcw, Settings2, ShoppingBag, TriangleAlert, type LucideIcon } from "lucide-react";
import { formatMoney, rupees } from "@/lib/domain/money";
import { notificationsApi } from "../../../../shared/api/notifications";
import { salesApi } from "../../../../shared/api/sales";

export type NotifCategory = "return" | "sale" | "inventory" | "alert" | "system";

export interface ShopNotification {
  id: string;
  type: string;
  category: NotifCategory;
  title: string;
  desc: string;
  /** Relative label ("12m ago") for compact surfaces. */
  time: string;
  /** ISO timestamp — used for sorting and the date filter. */
  createdAt: string;
  unread: boolean;
  /** Present only for rows that really exist in the backend feed. */
  backendId?: string;
}

/**
 * Category icon + accent, shared by the bell dropdowns and the Notifications
 * page so one notification looks the same wherever it is rendered. These are
 * the design-system lucide icons the rest of the portal uses — the feed used
 * to render raw emoji, which matched nothing else in the app.
 */
export const CATEGORY_ICON: Record<NotifCategory, LucideIcon> = {
  return: RotateCcw,
  sale: ShoppingBag,
  inventory: Package,
  alert: TriangleAlert,
  system: Settings2,
};

export const CATEGORY_ACCENT: Record<NotifCategory, string> = {
  return: "#C0392B",
  sale: "#0F766E",
  inventory: "#C89B47",
  alert: "#C0392B",
  system: "#6E0F2D",
};

export const CATEGORY_TONE: Record<NotifCategory, "danger" | "success" | "warning" | "brand"> = {
  return: "danger",
  sale: "success",
  inventory: "warning",
  alert: "danger",
  system: "brand",
};

export function notifCategory(type: string): NotifCategory {
  const t = type.toLowerCase();
  if (t.includes("return")) return "return";
  if (t.includes("sale")) return "sale";
  if (t.includes("inventory") || t.includes("stock")) return "inventory";
  if (t.includes("alert") || t.includes("low") || t.includes("urgent")) return "alert";
  return "system";
}

export const CATEGORY_LABELS: Record<NotifCategory, string> = {
  return: "Returns",
  sale: "Sales",
  inventory: "Inventory",
  alert: "Alerts",
  system: "System",
};

export function formatRelativeTime(iso: string): string {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1 || isNaN(diffMin)) return "Now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.round(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.round(diffHrs / 24)}d ago`;
}

/** Turns `{"sareeId":"BK-1"}` into a readable sentence instead of raw JSON. */
function describePayload(payload: Record<string, unknown> | null): string {
  if (!payload || typeof payload !== "object") return "Store activity alert";
  const parts = Object.entries(payload)
    .filter(([, v]) => v !== null && v !== undefined && typeof v !== "object")
    .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase()).trim()}: ${String(v)}`);
  return parts.length > 0 ? parts.join(" · ") : "Store activity alert";
}

function titleCase(type: string): string {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export function useShopNotifications(limit = 50) {
  const qc = useQueryClient();

  const notifQ = useQuery({
    // No `role` filter — the server scopes this to the caller's own feed.
    // Sending role: "SHOP" excluded every personally-addressed notification,
    // whose rows carry role = null.
    queryKey: ["shop-notifications", limit],
    queryFn: () => notificationsApi.list({ pageSize: limit }),
  });

  const returnsQ = useQuery({
    queryKey: ["shop-notifications-returns", limit],
    queryFn: () => salesApi.listReturns(limit),
  });

  const salesQ = useQuery({
    queryKey: ["shop-notifications-sales", limit],
    queryFn: () => salesApi.list(limit),
  });

  const [locallyRead, setLocallyRead] = React.useState<Set<string>>(() => new Set());

  const notifications: ShopNotification[] = React.useMemo(() => {
    const backend: ShopNotification[] = (notifQ.data?.items ?? []).map(n => ({
      id: `notif-${n.id}`,
      backendId: n.id,
      type: n.type,
      category: notifCategory(n.type),
      title: titleCase(n.type),
      desc: describePayload(n.payload),
      time: formatRelativeTime(n.createdAt),
      createdAt: n.createdAt,
      unread: !n.readAt,
    }));

    const returns: ShopNotification[] = (returnsQ.data?.items ?? []).map(r => ({
      id: `return-${r.returnRef}`,
      type: "return",
      category: "return" as const,
      title: `Return: ${r.sareeId}`,
      desc: `Reason: ${r.reason || "Customer return"}${r.refundAmount ? ` · Refund: ${formatMoney(rupees(Number(r.refundAmount)))}` : ""}`,
      time: formatRelativeTime(r.returnDate),
      createdAt: r.returnDate,
      unread: true,
    }));

    const sales: ShopNotification[] = (salesQ.data?.items ?? []).map(s => ({
      id: `sale-${s.saleRef}`,
      type: "sale",
      category: "sale" as const,
      title: `Sale Recorded: ${s.sareeId}`,
      desc: `${s.channel === "WHOLESALE" ? "Wholesale" : "Retail"} sale · ${s.customer?.name || "Walk-in Customer"}`,
      time: formatRelativeTime(s.saleDate),
      createdAt: s.saleDate,
      unread: false,
    }));

    return [...backend, ...returns, ...sales]
      .map(n => (locallyRead.has(n.id) ? { ...n, unread: false } : n))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifQ.data, returnsQ.data, salesQ.data, locallyRead]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markRead = React.useCallback(async (n: ShopNotification) => {
    if (!n.unread) return;
    setLocallyRead(prev => new Set(prev).add(n.id));
    if (n.backendId) {
      try { await notificationsApi.markRead(n.backendId); } catch { /* optimistic — keep the local read state */ }
      qc.invalidateQueries({ queryKey: ["shop-notifications", limit] });
    }
  }, [qc, limit]);

  const markAllRead = React.useCallback(async () => {
    setLocallyRead(new Set(notifications.map(n => n.id)));
    for (const n of notifQ.data?.items ?? []) {
      if (!n.readAt) {
        try { await notificationsApi.markRead(n.id); } catch { /* ignore single failure */ }
      }
    }
    qc.invalidateQueries({ queryKey: ["shop-notifications", limit] });
  }, [notifications, notifQ.data, qc, limit]);

  return {
    notifications,
    unreadCount,
    loading: notifQ.isLoading || returnsQ.isLoading || salesQ.isLoading,
    error: notifQ.isError,
    refetch: () => { notifQ.refetch(); returnsQ.refetch(); salesQ.refetch(); },
    markRead,
    markAllRead,
  };
}
