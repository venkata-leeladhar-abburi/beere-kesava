import React from "react";
import { motion } from "motion/react";
import { Bell, AlertTriangle, CheckCircle2, Inbox, Zap } from "lucide-react";
import { UnifiedNotif, Priority, T, F } from "./notifTypes";
import { LuxuryStatsCard } from "../../../shared/ui/LuxuryStatsCard";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface NotificationStatStripProps {
  notifications: UnifiedNotif[];
  unread: number;
  countByPriority: (p: Priority) => number;
}

export function NotificationStatStrip({ notifications, unread, countByPriority }: NotificationStatStripProps) {
  const criticalCount = countByPriority("critical");
  const statItems = [
    { label: "TOTAL", value: String(notifications.length), sub: "All notifications", icon: <Bell size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
    { label: "UNREAD", value: String(unread), sub: "Requires attention", icon: <Inbox size={20} color="rgba(245,232,208,0.90)" />, highlight: unread > 0 },
    { label: "CRITICAL", value: String(criticalCount), sub: "Urgent items", icon: <AlertTriangle size={20} color="#FCA5A5" />, highlight: false, crimson: criticalCount > 0 },
    { label: "TODAY", value: String(notifications.filter(n => n.time.includes("now") || n.time.includes("ago") || n.time.includes("AM") || n.time.includes("PM")).length), sub: "Recent activity", icon: <Zap size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
    { label: "RESOLVED", value: String(notifications.filter(n => n.read).length), sub: "Completed items", icon: <CheckCircle2 size={20} color="#6EE7B7" />, highlight: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
      className="px-4 md:px-7 xl:px-12 -mt-8 md:-mt-12 xl:-mt-[72px]"
      style={{ position: "relative", zIndex: 20 }}
    >
      <LuxuryStatsCard stats={statItems} />
    </motion.div>
  );
}
