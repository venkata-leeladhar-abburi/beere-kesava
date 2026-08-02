
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { createPortal } from "react-dom";
import { useResponsive } from "../../../../app/components/useResponsive";
import { useBatches, SareeRow } from "../../../production/contexts/BatchContext";
import { useDesignLibrary, DesignEntry } from "../../../../app/components/DesignLibraryContext";
import { DesignCodeCard } from "../../../../app/components/DesignLibraryPage";
import { useMaterialIssue, MaterialIssueRecord, JARI_REEL_GRAMS } from "../../../materials/contexts/MaterialIssueContext";
import { useWeaverPayments } from "../../../../app/components/WeaverPaymentsContext";
import { useAuth } from "../../../../contexts/AuthContext";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  Bell, ClipboardList, CheckSquare, Palette, ArrowUpRight,
  Wallet, Shield, Send, ChevronRight, X, ChevronLeft,
  Package, Check, Eye, LogOut, Search, RotateCcw,
  AlertCircle, Clock, Flower2, Layers, Info, Pencil,
  Scissors, LayoutGrid, CreditCard, ClipboardCheck,
  TrendingUp, ArrowRight, Sparkles, UserRound,
  CheckCircle2, History, ListChecks,
  AlertTriangle, Inbox, Zap,
} from "lucide-react";
import { imgBKLogo } from "../../../../app/constants/weaverImages";

// ─── Design Tokens ─────────────────────────────────────────────────────────
import {
  C, F, SAREE_TYPE_RATES, DesignDetailCard, SareeTypeDetailCard, SectionTitle, Card, ProgressBar, StatusBadge, SignatureCanvas, MaterialHistoryCard, HeroHeader, DesignCodeTileGrid, MobileBatchCard, CompletedBatchCard, BATCH_QUICK_FILTERS, BatchQuickFilterPills, CURRENT_WEAVER_ID, CURRENT_MONTH_LABEL, GROSS_CHARGES, TOTAL_DEDUCTIONS, NET_AMOUNT, PAST_MONTHS, WN_T, WN_G, WN_EASE, WN_NUM, WN_DATA, WN_PRIORITY, WN_CATEGORY, WN_FILTERS, WNFadeUp, BATCH_LIST, BATCH_STATUS_CFG, BatchCard, FadeUpBatch, BG_IMAGE, FABRIC_BG, WNFilter, WeaverNotif, WNPriority
} from './theme';


export function NotificationsPage() {
  const { isMobile, isTablet } = useResponsive();
  const [filter, setFilter]     = useState<WNFilter>("all");
  const [selected, setSelected] = useState<WeaverNotif | null>(null);
  const [readIds, setReadIds]   = useState<Set<number>>(new Set(WN_DATA.filter(n => n.read).map(n => n.id)));

  const markRead    = (id: number) => setReadIds(prev => new Set([...prev, id]));
  const markAllRead = () => setReadIds(new Set(WN_DATA.map(n => n.id)));

  const filtered = filter === "all" ? WN_DATA : WN_DATA.filter(n => n.priority === filter);
  const unread   = WN_DATA.filter(n => !readIds.has(n.id)).length;

  const grouped: Record<string, WeaverNotif[]> = {};
  filtered.forEach(n => { if (!grouped[n.date]) grouped[n.date] = []; grouped[n.date].push(n); });

  const countByPriority = (p: WNPriority) => WN_DATA.filter(n => n.priority === p).length;

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: WN_T.silkCream, fontFamily: F.u }}>

      {/* ── HERO ── */}
      <section style={{ background: WN_G.card, padding: isMobile ? "24px 20px 0" : isTablet ? "36px 28px 0" : "56px 56px 0", position: "relative", overflow: "hidden", minHeight: 220 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(200,155,71,0.025) 60px, rgba(200,155,71,0.025) 61px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(200,155,71,0.012) 80px, rgba(200,155,71,0.012) 81px)", pointerEvents: "none" }} />
        <div className="gold-bar-shimmer" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }} />

        <div style={{ position: "relative", zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: WN_EASE }}
            style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 20, height: 1, background: WN_T.antiqueGold, opacity: 0.6 }} />
            <span style={{ fontFamily: F.m, fontWeight: 600, fontSize: 9.5, color: "rgba(200,155,71,0.80)", letterSpacing: "3px", textTransform: "uppercase" as const }}>
              Ravi Kumar · WVR-014 · Notifications
            </span>
          </motion.div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 20 }}>
            <div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: WN_EASE }}
                style={{ fontFamily: F.d, fontWeight: 400, fontSize: "clamp(32px, 3.5vw, 52px)", color: WN_T.warmCream, margin: 0, lineHeight: 1.1, letterSpacing: "-0.5px" }}>
                Notifications
                {unread > 0 && (
                  <span style={{ marginLeft: 16, display: "inline-flex", alignItems: "center", justifyContent: "center", background: WN_T.antiqueGold, color: WN_T.deepWine, fontFamily: F.m, fontWeight: 700, fontSize: 14, borderRadius: 999, padding: "4px 14px", verticalAlign: "middle", position: "relative", top: -4 }}>
                    {unread} new
                  </span>
                )}
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.25 }}
                style={{ fontFamily: F.u, fontWeight: 400, fontSize: 14, color: "rgba(245,232,208,0.72)", margin: "10px 0 0" }}>
                All updates about your batches, materials, warp requests, and payments.
              </motion.p>
            </div>
            {unread > 0 && (
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
                onClick={markAllRead}
                whileHover={{ scale: 1.04, backgroundColor: "rgba(200,155,71,0.18)" }}
                whileTap={{ scale: 0.97 }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 12, border: "1px solid rgba(200,155,71,0.30)", background: "rgba(200,155,71,0.09)", color: WN_T.antiqueGold, fontFamily: F.u, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                <Check size={15} /> Mark all read
              </motion.button>
            )}
          </div>

          {/* Metrics row */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.35, ease: WN_EASE }}
            style={{ display: "flex", flexWrap: isMobile ? "wrap" as const : "nowrap" as const, gap: 0, marginTop: isMobile ? 20 : 40, borderTop: "1px solid rgba(245,232,208,0.08)" }}>
            {[
              { label: "Total",    val: WN_DATA.length,                                       Icon: Bell,          hi: false },
              { label: "Unread",   val: unread,                                               Icon: Inbox,         hi: unread > 0 },
              { label: "Critical", val: countByPriority("critical"),                          Icon: AlertTriangle, hi: false, col: "#FCA5A5" },
              { label: "Today",    val: WN_DATA.filter(n => n.date === "Today").length,       Icon: Zap,           hi: false },
              { label: "Resolved", val: readIds.size,                                         Icon: CheckCircle2,  hi: false, col: "#6EE7B7" },
            ].map((m, i) => (
              <div key={m.label} style={{ width: isMobile ? "calc(50% - 1px)" : undefined, flex: isMobile ? undefined : 1, padding: isMobile ? "14px 12px" : "20px 22px", borderRight: isMobile ? (i % 2 === 0 ? "1px solid rgba(245,232,208,0.07)" : "none") : (i < 4 ? "1px solid rgba(245,232,208,0.07)" : "none"), borderTop: isMobile && i >= 2 ? "1px solid rgba(245,232,208,0.07)" : "none", display: "flex", alignItems: "center", gap: isMobile ? 10 : 14, boxSizing: "border-box" as const }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: m.hi ? "rgba(200,155,71,0.18)" : "rgba(245,232,208,0.07)", border: `1px solid ${m.hi ? "rgba(200,155,71,0.35)" : "rgba(245,232,208,0.09)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <m.Icon size={18} color={m.hi ? WN_T.antiqueGold : (m.col || "rgba(245,232,208,0.70)")} />
                </div>
                <div>
                  <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 9, letterSpacing: "2px", textTransform: "uppercase" as const, color: m.hi ? "rgba(200,155,71,0.90)" : "rgba(245,232,208,0.55)", marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 34, color: m.hi ? WN_T.goldLight : (m.col || WN_T.warmCream), lineHeight: 1, ...WN_NUM }}>{m.val}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FILTER BAR ── */}
      <div style={{ background: WN_T.warmIvory, borderBottom: `1px solid ${WN_T.borderDef}`, padding: isMobile ? "0 12px" : isTablet ? "0 28px" : "0 56px", position: "sticky" as const, top: 64, zIndex: 50, boxShadow: "0 4px 24px rgba(74,6,27,0.05)" }}>
        <div className="wp-filter-scroll" style={{ display: "flex", alignItems: "center", gap: 0, height: 58, overflowX: isMobile ? "auto" : "visible", scrollbarWidth: "none" } as React.CSSProperties}>
          {WN_FILTERS.map(f => {
            const isActive = filter === f.key;
            const count = f.key === "all" ? WN_DATA.length : WN_DATA.filter(n => n.priority === f.key).length;
            const cfg = f.key !== "all" ? WN_PRIORITY[f.key] : null;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ height: "100%", padding: isMobile ? "0 14px" : "0 22px", border: "none", background: "rgba(0,0,0,0)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, position: "relative" as const, borderBottom: isActive ? `2px solid ${WN_T.royalBurgundy}` : "2px solid transparent", flexShrink: 0, whiteSpace: "nowrap" as const }}>
                {cfg && <cfg.Icon size={14} color={isActive ? WN_T.royalBurgundy : cfg.color} />}
                <span style={{ fontFamily: F.u, fontWeight: isActive ? 600 : 400, fontSize: 13.5, color: isActive ? WN_T.royalBurgundy : WN_T.taupe, whiteSpace: "nowrap" as const }}>{f.label}</span>
                <span style={{ fontFamily: F.m, fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: isActive ? "rgba(110,15,45,0.08)" : "rgba(139,112,96,0.08)", color: isActive ? WN_T.royalBurgundy : WN_T.taupe }}>{count}</span>
              </button>
            );
          })}
          {!isMobile && (
            <div style={{ marginLeft: "auto", flexShrink: 0 }}>
              <span style={{ fontFamily: F.u, fontSize: 12, color: WN_T.taupe }}>{filtered.length} notification{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{
        padding: isMobile ? "20px 16px 48px" : isTablet ? "28px 28px 60px" : "40px 56px 80px",
        display: "flex", flexDirection: isMobile || isTablet ? "column" as const : "row" as const,
        gap: isMobile ? 16 : 28, alignItems: "flex-start",
      }}>

        {/* Left — list */}
        <div style={{ flex: (!isMobile && !isTablet && selected) ? "0 0 520px" : 1, minWidth: 0, width: "100%" }}>
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} style={{ marginBottom: 40 }}>
              <WNFadeUp>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 3, height: 18, borderRadius: 2, background: WN_G.gold, flexShrink: 0 }} />
                  <span style={{ fontFamily: F.d, fontWeight: 400, fontSize: 22, color: WN_T.luxuryBrown, letterSpacing: "-0.2px" }}>{date}</span>
                  <div style={{ flex: 1, height: 1, background: WN_T.borderDef, marginLeft: 4 }} />
                  <span style={{ fontFamily: F.m, fontSize: 10, color: WN_T.taupe }}>{items.length} item{items.length !== 1 ? "s" : ""}</span>
                </div>
              </WNFadeUp>

              <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
                {items.map((n, i) => {
                  const pcfg   = WN_PRIORITY[n.priority];
                  const catCfg = WN_CATEGORY[n.category];
                  const isRead     = readIds.has(n.id);
                  const isSelected = selected?.id === n.id;
                  const PIcon = pcfg.Icon;
                  const CIcon = catCfg.Icon;
                  return (
                    <WNFadeUp key={n.id} delay={i * 0.05}>
                      <motion.div
                        onClick={() => { setSelected(isSelected ? null : n); markRead(n.id); }}
                        whileHover={{ y: -3, boxShadow: isSelected ? "0 12px 40px rgba(110,15,45,0.14)" : "0 8px 32px rgba(110,15,45,0.10)" }}
                        transition={{ type: "spring", stiffness: 300, damping: 24 }}
                        style={{ background: isSelected ? "#FFFDF9" : WN_T.warmIvory, borderRadius: 20, border: isSelected ? `1.5px solid ${WN_T.royalBurgundy}` : `1px solid ${isRead ? WN_T.borderDef : pcfg.border}`, boxShadow: isSelected ? "0 12px 40px rgba(110,15,45,0.12)" : "0 2px 14px rgba(110,15,45,0.05)", cursor: "pointer", overflow: "hidden", position: "relative" as const }}>
                        {/* Priority top bar */}
                        <div style={{ height: 3, background: `linear-gradient(90deg, ${pcfg.color}, ${pcfg.color}88)`, opacity: isRead ? 0.4 : 1 }} />

                        <div style={{ padding: "22px 24px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
                            {/* Icon block */}
                            <div style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, background: pcfg.bg, border: `1px solid ${pcfg.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <PIcon size={22} color={pcfg.color} />
                            </div>

                            {/* Main content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" as const }}>
                                {!isRead && <div style={{ width: 8, height: 8, borderRadius: "50%", background: pcfg.color, flexShrink: 0 }} />}
                                <span style={{ fontFamily: F.d, fontWeight: 400, fontSize: 17, color: WN_T.luxuryBrown, lineHeight: 1.3, flex: 1, opacity: isRead ? 0.8 : 1 }}>{n.title}</span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.m, fontSize: 10, fontWeight: 600, color: pcfg.color, background: pcfg.bg, border: `1px solid ${pcfg.border}`, borderRadius: 999, padding: "3px 10px", flexShrink: 0 }}>
                                  <PIcon size={10} /> {pcfg.label}
                                </span>
                              </div>
                              <p style={{ fontFamily: F.u, fontWeight: 400, fontSize: 13.5, color: WN_T.taupe, lineHeight: 1.75, margin: "0 0 14px", display: selected ? "block" : "-webkit-box" as any, WebkitLineClamp: selected ? undefined : 2, WebkitBoxOrient: "vertical" as any, overflow: selected ? "visible" : "hidden" }}>
                                {n.body}
                              </p>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: F.m, fontSize: 10, fontWeight: 500, color: catCfg.color, background: `${catCfg.color}14`, border: `1px solid ${catCfg.color}2A`, borderRadius: 999, padding: "3px 10px" }}>
                                  <CIcon size={10} /> {catCfg.label}
                                </span>
                                <span style={{ fontFamily: F.m, fontSize: 11, color: WN_T.taupe }}>{n.date} · {n.time}</span>
                                {n.action && (
                                  <motion.button
                                    onClick={e => { e.stopPropagation(); markRead(n.id); }}
                                    whileHover={{ scale: 1.05, backgroundColor: WN_T.royalBurgundy, color: "#FFFDF9" }}
                                    whileTap={{ scale: 0.97 }}
                                    style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 16px", borderRadius: 10, border: `1.5px solid ${WN_T.royalBurgundy}`, background: "rgba(0,0,0,0)", color: WN_T.royalBurgundy, fontFamily: F.u, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" as const }}>
                                    {n.action} <ArrowRight size={12} />
                                  </motion.button>
                                )}
                              </div>
                            </div>

                            {/* Read/unread toggle */}
                            <motion.button
                              onClick={e => { e.stopPropagation(); isRead ? setReadIds(prev => { const s = new Set(prev); s.delete(n.id); return s; }) : markRead(n.id); }}
                              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.93 }}
                              title={isRead ? "Mark unread" : "Mark read"}
                              style={{ width: 30, height: 30, borderRadius: "50%", border: `1.5px solid ${isRead ? WN_T.borderDef : pcfg.color}`, background: isRead ? "rgba(0,0,0,0)" : pcfg.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 2 }}>
                              <Check size={13} color={isRead ? WN_T.taupe : pcfg.color} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    </WNFadeUp>
                  );
                })}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center" as const, padding: "80px 40px" }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: "rgba(110,15,45,0.06)", border: `1px solid ${WN_T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <Inbox size={28} color={WN_T.taupe} />
              </div>
              <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 22, color: WN_T.luxuryBrown, marginBottom: 8 }}>No notifications</div>
              <div style={{ fontFamily: F.u, fontSize: 14, color: WN_T.taupe }}>No notifications match the current filter.</div>
            </div>
          )}
        </div>

        {/* Right — detail panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 32, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 32, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              style={(isMobile || isTablet)
                ? { width: "100%" }
                : { flex: "0 0 380px", position: "sticky" as const, top: 122 }}>
              {(() => {
                const pcfg   = WN_PRIORITY[selected.priority];
                const catCfg = WN_CATEGORY[selected.category];
                const PIcon = pcfg.Icon;
                const CIcon = catCfg.Icon;
                return (
                  <div style={{ background: WN_T.warmIvory, borderRadius: 24, border: `1px solid ${WN_T.borderDef}`, boxShadow: "0 16px 56px rgba(110,15,45,0.10)", overflow: "hidden" }}>
                    <div style={{ height: 4, background: `linear-gradient(90deg, ${pcfg.color}, ${pcfg.color}55)` }} />
                    <div style={{ padding: "20px 24px", borderBottom: `1px solid ${WN_T.borderDef}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.m, fontSize: 11, fontWeight: 600, color: pcfg.color, background: pcfg.bg, border: `1px solid ${pcfg.border}`, borderRadius: 999, padding: "4px 12px" }}>
                        <PIcon size={12} /> {pcfg.label}
                      </span>
                      <motion.button onClick={() => setSelected(null)} whileHover={{ scale: 1.1, backgroundColor: "rgba(110,15,45,0.06)" }} whileTap={{ scale: 0.93 }}
                        style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${WN_T.borderDef}`, background: "rgba(0,0,0,0)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <X size={14} color={WN_T.taupe} />
                      </motion.button>
                    </div>
                    <div style={{ padding: "24px 24px 28px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 18, background: catCfg.color + "14", border: `1px solid ${catCfg.color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <CIcon size={24} color={catCfg.color} />
                        </div>
                        <div>
                          <div style={{ fontFamily: F.m, fontSize: 9.5, fontWeight: 600, letterSpacing: "2px", color: catCfg.color, textTransform: "uppercase" as const, marginBottom: 4 }}>{catCfg.label}</div>
                          <div style={{ fontFamily: F.u, fontSize: 11, color: WN_T.taupe }}>{selected.date} · {selected.time}</div>
                        </div>
                      </div>
                      <div style={{ fontFamily: F.d, fontWeight: 400, fontSize: 20, color: WN_T.luxuryBrown, lineHeight: 1.35, marginBottom: 16, letterSpacing: "-0.2px" }}>{selected.title}</div>
                      <div style={{ background: WN_T.silkCream, borderRadius: 14, border: `1px solid ${WN_T.borderDef}`, padding: "18px 20px", marginBottom: 20 }}>
                        <p style={{ fontFamily: F.u, fontWeight: 400, fontSize: 14, color: WN_T.luxuryBrown, lineHeight: 1.85, margin: 0 }}>{selected.body}</p>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
                        {[
                          { label: "Priority", value: pcfg.label,     color: pcfg.color },
                          { label: "Category", value: catCfg.label,   color: catCfg.color },
                          { label: "Date",     value: selected.date,  color: WN_T.luxuryBrown },
                          { label: "Time",     value: selected.time,  color: WN_T.luxuryBrown },
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ background: WN_T.warmIvory, border: `1px solid ${WN_T.borderDef}`, borderRadius: 12, padding: "12px 14px" }}>
                            <div style={{ fontFamily: F.m, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: WN_T.taupe, marginBottom: 5 }}>{label}</div>
                            <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      {selected.action && (
                        <motion.button
                          whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(110,15,45,0.28)" }}
                          whileTap={{ scale: 0.98 }}
                          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px", borderRadius: 14, border: "none", background: WN_G.button, color: "#FFFDF9", fontFamily: F.u, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(110,15,45,0.22)", marginBottom: 10 }}>
                          {selected.action} <ArrowRight size={15} />
                        </motion.button>
                      )}
                      <motion.button onClick={() => markRead(selected.id)}
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(110,15,45,0.06)" }}
                        whileTap={{ scale: 0.98 }}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "12px", borderRadius: 14, border: `1px solid ${WN_T.borderDef}`, background: "rgba(0,0,0,0)", color: WN_T.taupe, fontFamily: F.u, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                        <Check size={14} /> Mark as read
                      </motion.button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── MOBILE SHELL ──────────────────────────────────────────────────────────
type Tab5 = "batches" | "confirm" | "warp" | "payments";

