import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { Scissors, Users, Package, IndianRupee } from 'lucide-react';
import { T, F, G, EASE } from '../theme';
import { ACT } from '../data.tsx';
import { auditLogApi } from '../../../../../shared/api/audit-log';
import { Button } from '../../../../../shared/ui/primitives';

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function ActivityStrip({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px 0px" });

  const { data: actionsRes } = useQuery({
    queryKey: ['dashboard-audit-actions'],
    queryFn: () => auditLogApi.listActions({ pageSize: 5 }),
  });

  const liveActions = React.useMemo(() => {
    if (!actionsRes?.items || actionsRes.items.length === 0) return ACT;
    return actionsRes.items.slice(0, 4).map((a) => {
      const isWeaver = a.module?.toLowerCase().includes("weaver");
      const isMaterial = a.module?.toLowerCase().includes("material") || a.module?.toLowerCase().includes("yarn");
      const isPayment = a.module?.toLowerCase().includes("payment") || a.module?.toLowerCase().includes("invoice");
      return {
        bg: isWeaver ? G.gold : isMaterial ? G.button : isPayment ? G.gold : G.hero,
        glow: isWeaver ? "rgba(200,155,71,0.25)" : isMaterial ? "rgba(110,15,45,0.25)" : isPayment ? "rgba(30,102,64,0.25)" : "rgba(74,6,27,0.25)",
        icon: isWeaver ? <Users size={20} color="#FFF" /> : isMaterial ? <Package size={20} color="#FFF" /> : isPayment ? <IndianRupee size={20} color="#FFF" /> : <Scissors size={20} color="#FFF" />,
        text: `${a.user ? `${a.user.firstName} ${a.user.lastName}` : a.role} ${a.action.toLowerCase()} ${a.recordLabel || a.entityType || 'record'}`,
        time: timeAgo(a.createdAt),
      };
    });
  }, [actionsRes]);


  return (
    <section className="px-4 md:px-7 xl:px-12" style={{ paddingBottom: 60, background: T.silkCream }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.75, ease: EASE }}
        style={{ background: G.card, borderRadius: 28, padding: "34px 32px 38px", boxShadow: "0 20px 60px rgba(74,6,27,0.18)", border: "1px solid rgba(200,155,71,0.10)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: G.gold }} />
              <span style={{ fontFamily: F.display, fontWeight: 400, fontSize: 24, color: T.warmCream, letterSpacing: "-0.2px" }}>Recent Activity</span>
            </div>
            <span style={{ fontFamily: F.ui, fontWeight: 400, fontSize: 13, color: "rgba(245,232,208,0.75)", paddingLeft: 13, letterSpacing: "0.1px" }}>Live operational feed</span>
          </div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ borderRadius: 10 }}>
            <Button
              onClick={() => onNavigate("Notifications")}
              variant="tertiary"
              className="!py-2 !px-5 !rounded-[10px] !border !border-[rgba(200,155,71,0.28)] !bg-[rgba(200,155,71,0.07)] !text-[#C89B47] !text-[13px] !font-semibold !tracking-[0.2px] hover:!bg-[rgba(200,155,71,0.14)] hover:!text-[#C89B47]"
            >
              View All Activity →
            </Button>
          </motion.div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {liveActions.map((a, i) => (
            // No stable id on activity entries (static fallback or derived text/time); composite key avoids index-only key.
            <motion.div
              key={`${a.text}-${a.time}`}
              initial={{ opacity: 0, y: 36, scale: 0.88, filter: "blur(7px)", boxShadow: "0px 0px 0px rgba(0,0,0,0)", backgroundColor: "rgba(255,255,255,0.04)" }}
              animate={inView ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", boxShadow: "0px 0px 0px rgba(0,0,0,0)", backgroundColor: "rgba(255,255,255,0.04)" } : undefined}
              whileHover={{ y: -7, scale: 1.025, boxShadow: `0px 22px 56px ${a.glow}`, backgroundColor: "rgba(255,255,255,0.08)" }}
              transition={{
                type: "spring", stiffness: 260, damping: 22,
                delay: 0.1 + i * 0.1,
                opacity: { duration: 0.4 }, filter: { duration: 0.5 },
              }}
              style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.04)", boxShadow: "0px 0px 0px rgba(0,0,0,0)", border: "1px solid rgba(245,232,208,0.09)", borderRadius: 20, padding: "22px 20px 20px", display: "flex", flexDirection: "column", gap: 14, minHeight: 175, position: "relative", overflow: "hidden", cursor: "pointer" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: a.bg, opacity: 0.70 }} />
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.25 }}
                style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: a.bg, boxShadow: `0 4px 18px ${a.glow}`, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {a.icon}
              </motion.div>
              <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 14, color: "rgba(245,232,208,0.97)", lineHeight: 1.65, flex: 1, letterSpacing: "0.05px" }}>{a.text}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.bg, boxShadow: `0 0 8px ${a.glow}` }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(245,232,208,0.70)", letterSpacing: "0.3px" }}>{a.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

