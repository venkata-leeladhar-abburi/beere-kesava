import React from "react";
import { motion } from "motion/react";
import { Bell, AlertTriangle, CheckCircle2, Inbox, Zap } from "lucide-react";
import { UnifiedNotif, Priority, T, F } from "./notifTypes";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface NotificationStatStripProps {
  notifications: UnifiedNotif[];
  unread: number;
  countByPriority: (p: Priority) => number;
}

export function NotificationStatStrip({ notifications, unread, countByPriority }: NotificationStatStripProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
      style={{ padding: "0 48px", marginTop: -72, position: "relative", zIndex: 20 }}
    >
      <div style={{ background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)", borderRadius: 28, display: "flex", alignItems: "stretch", boxShadow: "0 30px 80px rgba(0,0,0,0.32), 0 0 0 1px rgba(200,155,71,0.16)", overflow: "hidden", minHeight: 140 }}>
        {[
          { label: "TOTAL",    val: notifications.length,                           Icon: Bell,          hi: false, col: undefined, sub: "All notifications" },
          { label: "UNREAD",   val: unread,                                         Icon: Inbox,         hi: unread > 0, col: undefined, sub: "Requires attention" },
          { label: "CRITICAL", val: countByPriority("critical"),                    Icon: AlertTriangle, hi: false, col: "#FCA5A5", sub: "Urgent items" },
          { label: "TODAY",    val: notifications.filter(n => n.time.includes("now") || n.time.includes("ago") || n.time.includes("AM") || n.time.includes("PM")).length, Icon: Zap, hi: false, col: undefined, sub: "Recent activity" },
          { label: "RESOLVED", val: notifications.filter(n => n.read).length,       Icon: CheckCircle2,  hi: false, col: "#6EE7B7", sub: "Completed items" },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.09, ease: EASE }}
            whileHover={{ backgroundColor: m.hi ? "rgba(200,155,71,0.26)" : "rgba(245,232,208,0.04)" }}
            style={{
              flex: 1, padding: "28px 22px",
              backgroundImage: m.hi ? "linear-gradient(135deg, rgba(200,155,71,0.20) 0%, rgba(200,155,71,0.07) 100%)" : "none",
              borderRight: i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none",
              display: "flex", alignItems: "center", gap: 14, position: "relative", cursor: "default",
            }}
          >
              {m.hi && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(135deg,#C89B47,#E7C983)" }} />}
              <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.16)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.38)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <m.Icon size={20} color={m.col || (m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.90)")} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, letterSpacing: "2px", textTransform: "uppercase" as const, marginBottom: 8, color: m.hi ? "rgba(200,155,71,1)" : "rgba(245,232,208,0.90)" }}>
                  {m.label}
                </div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, fontSize: 48, color: m.hi ? T.goldLight : (m.col || "#FFFDF9"), lineHeight: 1.1, marginBottom: 8, fontVariantNumeric: "tabular-nums" as const }}>
                  {m.val}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 12, color: m.hi ? "rgba(231,201,131,0.95)" : "rgba(245,232,208,0.85)", letterSpacing: "0.1px" }}>
                    {m.sub}
                  </span>
                </div>
              </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
