import React, { useMemo, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { Scissors, Users, Package, IndianRupee } from 'lucide-react';
import { T, F, G, EASE } from './theme';
import { ACT } from './data';
import { auditLogApi } from '../../../../shared/api/audit-log';
import { Button } from '../../../../shared/ui/primitives';

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function MobileActivity({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px 0px" });

  const { data: actionsRes } = useQuery({
    queryKey: ['dashboard-audit-actions'],
    queryFn: () => auditLogApi.listActions({ pageSize: 5 }),
  });

  const liveActions = useMemo(() => {
    if (!actionsRes?.items || actionsRes.items.length === 0) return ACT;
    return actionsRes.items.slice(0, 4).map((a) => {
      const isWeaver = a.module?.toLowerCase().includes("weaver");
      const isMaterial = a.module?.toLowerCase().includes("material") || a.module?.toLowerCase().includes("yarn");
      const isPayment = a.module?.toLowerCase().includes("payment") || a.module?.toLowerCase().includes("invoice");
      return {
        id: a.id,
        bg: isWeaver ? G.gold : isMaterial ? G.button : isPayment ? G.gold : G.hero,
        glow: isWeaver ? "rgba(200,155,71,0.25)" : isMaterial ? "rgba(110,15,45,0.25)" : isPayment ? "rgba(30,102,64,0.25)" : "rgba(74,6,27,0.25)",
        icon: isWeaver ? <Users size={18} color="#FFF" /> : isMaterial ? <Package size={18} color="#FFF" /> : isPayment ? <IndianRupee size={18} color="#FFF" /> : <Scissors size={18} color="#FFF" />,
        text: `${a.user ? `${a.user.firstName} ${a.user.lastName}` : a.role} ${a.action.toLowerCase()} ${a.recordLabel || a.entityType || 'record'}`,
        time: timeAgo(a.createdAt),
      };
    });
  }, [actionsRes]);

  return (
    <div style={{ padding: "24px 16px 0" }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.65, ease: EASE }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 3, height: 18, borderRadius: 2, background: G.gold }} />
          <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 20, color: T.luxuryBrown, letterSpacing: "-0.1px" }}>Recent Activity</span>
        </div>
        <Button onClick={() => onNavigate("Notifications")} variant="link" className="!p-0 !h-auto !text-xs !font-semibold !text-[#6E0F2D] !tracking-[0.1px]">View All →</Button>
      </motion.div>
      <div style={{ background: G.card, borderRadius: 20, overflow: "hidden", boxShadow: "0 10px 32px rgba(74,6,27,0.16)", border: "1px solid rgba(200,155,71,0.12)" }}>
        {liveActions.map((a, i) => (
          // Live audit-log actions carry a real `id`; the static ACT fallback (no backend
          // data yet) doesn't, so the index is kept as a last-resort tiebreaker.
          <motion.div
            key={'id' in a && a.id ? a.id : `activity-${i}`}
            initial={{ opacity: 0, x: -16 }}
            animate={inView ? { opacity: 1, x: 0 } : undefined}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.07, ease: EASE }}
            style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "18px 18px", backgroundColor: "rgba(0,0,0,0)", borderBottom: i < liveActions.length - 1 ? "1px solid rgba(245,232,208,0.10)" : "none" }}
          >
            <motion.div
              whileHover={{ scale: 1.08 }}
              style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: a.bg, boxShadow: `0 4px 14px ${a.glow}`, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {a.icon}
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 14, color: "rgba(245,232,208,0.97)", lineHeight: 1.6, marginBottom: 6, letterSpacing: "0.05px" }}>{a.text}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: a.bg, boxShadow: `0 0 6px ${a.glow}` }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(245,232,208,0.78)", letterSpacing: "0.3px" }}>{a.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
