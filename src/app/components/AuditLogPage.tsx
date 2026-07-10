import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Download, RefreshCw, Lock, Monitor, Smartphone,
  ChevronDown, AlignLeft, Table2, ChevronLeft, ChevronRight,
  LogIn, LogOut, AlertCircle, Check, X,
} from "lucide-react";

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#8B7060",
  green:         "#1E6640",
  greenBg:       "rgba(30,102,64,0.09)",
  crimson:       "#C0392B",
  crimsonBg:     "rgba(192,57,43,0.08)",
  blue:          "#2C4A8B",
  borderDef:     "rgba(110,15,45,0.10)",
  borderGold:    "rgba(200,155,71,0.22)",
  cream:         "#F0E8D0",
};

const ROLE_COLORS: Record<string, { circle: string; badge: string; text: string; initial: string }> = {
  "SUPERADMIN":      { circle: "#C89B47", badge: "rgba(200,155,71,0.15)",  text: "#7A5E1C", initial: "SA" },
  "ADMIN":           { circle: "#6E0F2D", badge: "rgba(110,15,45,0.10)",   text: "#6E0F2D", initial: "AD" },
  "WORKER STAFF":    { circle: "#1E6640", badge: "rgba(30,102,64,0.10)",   text: "#1E6640", initial: "WS" },
  "FINISHING STAFF": { circle: "#2C4A8B", badge: "rgba(44,74,139,0.10)",   text: "#2C4A8B", initial: "FS" },
  "SHOP STAFF":      { circle: "#2C1810", badge: "rgba(44,24,16,0.10)",    text: "#2C1810", initial: "SS" },
};

const ACTION_ENTRIES = [
  { id: 1,  role: "WORKER STAFF",    user: "Ravi Kumar",      time: "Today · 11:42 AM", action: "Issued 4.5 kg Warp, Resham Red 800g, and Jari PLY-2G-Gold 6 Reels to weaver Padma Veni",  module: "MATERIALS",  record: "BATCH-086",    oldVal: null,          newVal: null },
  { id: 2,  role: "ADMIN",           user: "Admin (BK)",      time: "Today · 11:38 AM", action: "Approved warp request from weaver Suresh Murti — 4 kg Warp for BATCH-081",                module: "WEAVERS",    record: "BATCH-081",    oldVal: null,          newVal: null },
  { id: 3,  role: "SUPERADMIN",      user: "Superadmin",      time: "Today · 11:30 AM", action: "Changed making charge rate for Self Brocade SB-001",                                        module: "RATES",      record: "SB-001",       oldVal: "₹420/saree",  newVal: "₹450/saree" },
  { id: 4,  role: "SHOP STAFF",      user: "Shop Staff (SS)", time: "Today · 11:15 AM", action: "Recorded retail sale — saree PADMA-L1-001 sold to Smt. Annapurna Devi · ₹8,500",          module: "SALES",      record: "SALE-0231",    oldVal: null,          newVal: null },
  { id: 5,  role: "FINISHING STAFF", user: "Finishing (FS)",  time: "Today · 10:58 AM", action: "Completed quality check for BATCH-079 — 6 sarees passed, 0 rejected",                     module: "PRODUCTION", record: "BATCH-079",    oldVal: null,          newVal: null },
  { id: 6,  role: "WORKER STAFF",    user: "Worker (WS)",     time: "Today · 10:45 AM", action: "Received 50 kg Warp from Sri Venkateswara Textiles — GRN created",                         module: "MATERIALS",  record: "SRI-WARP-001", oldVal: null,          newVal: null },
  { id: 7,  role: "ADMIN",           user: "Admin (MK)",      time: "Today · 10:30 AM", action: "Created Purchase Order PO-2026-022 for Sri Venkateswara Textiles · ₹1,40,000",             module: "MATERIALS",  record: "PO-2026-022",  oldVal: null,          newVal: null },
  { id: 8,  role: "SUPERADMIN",      user: "Superadmin",      time: "Today · 10:15 AM", action: "Approved Purchase Order PO-2026-021 for Kanchipuram Silks · ₹3,75,000",                   module: "APPROVALS",  record: "PO-2026-021",  oldVal: null,          newVal: null },
  { id: 9,  role: "WORKER STAFF",    user: "Worker (WS)",     time: "Today · 9:55 AM",  action: "Recorded QC defect on saree RAVI-L2-008 — Thread break defect · Making charge zeroed",    module: "PRODUCTION", record: "RAVI-L2-008",  oldVal: null,          newVal: null },
  { id: 10, role: "ADMIN",           user: "Admin (RK)",      time: "Today · 9:40 AM",  action: "Added new bulk order — Lakshmi Silks · 80 sarees · Design BKB-045 · Due 28 May 2026",    module: "CUSTOMERS",  record: "ORD-2026-041", oldVal: null,          newVal: null },
  { id: 11, role: "SHOP STAFF",      user: "Shop Staff (SS)", time: "Today · 9:20 AM",  action: "Processed return — saree PADMA-L1-002 returned by Smt. Lakshmi Bai",                     module: "SALES",      record: "RET-0021",     oldVal: null,          newVal: null },
  { id: 12, role: "FINISHING STAFF", user: "Finishing (FS)",  time: "Today · 9:05 AM",  action: "Dispatched 6 sarees to Lakshmi Silks — INV-2026-041 · LR uploaded",                     module: "PRODUCTION", record: "INV-2026-041", oldVal: null,          newVal: null },
];

type LoginEvent = { id: number; status: "login"|"logout"|"failed"; user: string; role: string; time: string; device: string; duration: string | null; failReason?: string };
const LOGIN_ENTRIES: LoginEvent[] = [
  { id: 1,  status: "login",  user: "Superadmin",        role: "Superadmin",      time: "Today · 9:00 AM",      device: "Web Browser",     duration: null,                  failReason: undefined },
  { id: 2,  status: "login",  user: "Admin (BK)",        role: "Admin",           time: "Today · 9:05 AM",      device: "Web Browser",     duration: null,                  failReason: undefined },
  { id: 3,  status: "login",  user: "Worker Staff (WS)", role: "Worker Staff",    time: "Today · 8:45 AM",      device: "Mobile",          duration: null,                  failReason: undefined },
  { id: 4,  status: "logout", user: "Admin (RK)",        role: "Admin",           time: "Today · 8:40 AM",      device: "Web Browser",     duration: "3 hours 12 minutes",  failReason: undefined },
  { id: 5,  status: "login",  user: "Admin (RK)",        role: "Admin",           time: "Today · 8:38 AM",      device: "Web Browser",     duration: null,                  failReason: undefined },
  { id: 6,  status: "login",  user: "Finishing (FS)",    role: "Finishing Staff", time: "Today · 8:30 AM",      device: "Mobile",          duration: null,                  failReason: undefined },
  { id: 7,  status: "failed", user: "Unknown",           role: "—",               time: "Today · 8:25 AM",      device: "Mobile",          duration: null,                  failReason: "Incorrect OTP entered · Attempt 1 of 3" },
  { id: 8,  status: "login",  user: "Shop Staff (SS)",   role: "Shop Staff",      time: "Today · 8:20 AM",      device: "Mobile / Tablet", duration: null,                  failReason: undefined },
  { id: 9,  status: "logout", user: "Worker (WK2)",      role: "Worker Staff",    time: "Yesterday · 6:45 PM",  device: "Mobile",          duration: "8 hours 20 minutes",  failReason: undefined },
  { id: 10, status: "login",  user: "Admin (MK)",        role: "Admin",           time: "Yesterday · 9:10 AM",  device: "Web Browser",     duration: "9 hours 35 minutes",  failReason: undefined },
];

export function AuditLogPage() {
  const [actionView, setActionView] = useState<"timeline"|"table">("timeline");
  const [loginView,  setLoginView]  = useState<"timeline"|"table">("timeline");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [moduleFilter, setModuleFilter] = useState("All Modules");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const [periodFilter, setPeriodFilter] = useState("Today");

  return (
    <div style={{ background: T.silkCream, minHeight: "100vh", fontFamily: F.ui }}>

      {/* ── 1. PAGE HEADER ── */}
      <div style={{
        background: T.darkBurgundy,
        position: "relative",
        overflow: "hidden",
        minHeight: 180,
        display: "flex",
        alignItems: "stretch",
      }}>
        {/* Left col */}
        <div style={{ flex: 1, padding: "44px 56px 90px", zIndex: 10, position: "relative" }}>
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 28, height: 1, background: T.antiqueGold }} />
            <span style={{
              fontFamily: F.mono,
              fontSize: 9,
              color: `${T.antiqueGold}80`,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}>
              SINCE 1999 · SUPERADMIN · AUDIT LOG
            </span>
          </div>
          {/* H1 */}
          <h1 style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 48,
            color: "#fff",
            margin: "0 0 4px",
            lineHeight: 1.1,
          }}>
            Audit Log
          </h1>
          {/* Italic sub */}
          <div style={{
            fontFamily: F.display,
            fontWeight: 500,
            fontStyle: "italic",
            fontSize: 30,
            color: T.antiqueGold,
            marginBottom: 14,
            lineHeight: 1.2,
          }}>
            &amp; System Activity
          </div>
          {/* Description */}
          <p style={{
            fontFamily: F.ui,
            fontSize: 14,
            color: "rgba(255,255,255,0.60)",
            maxWidth: 520,
            margin: 0,
            lineHeight: 1.65,
          }}>
            A complete, immutable record of every action performed across the Beere Kesava &amp; Brothers Silks ERP system — materials, production, sales, approvals, and user sessions.
          </p>
        </div>

        {/* Right col — glass chips */}
        <div style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginRight: 56,
          alignItems: "flex-end",
          justifyContent: "center",
          zIndex: 10,
          position: "relative",
        }}>
          {/* Chip 1 */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            padding: "10px 18px",
            backdropFilter: "blur(8px)",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            fontFamily: F.ui,
            fontSize: 13,
            color: "#fff",
            whiteSpace: "nowrap",
          }}>
            2,840 Total Log Entries
          </div>
          {/* Chip 2 — live */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            padding: "10px 18px",
            backdropFilter: "blur(8px)",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            fontFamily: F.ui,
            fontSize: 13,
            color: "#fff",
            whiteSpace: "nowrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, flexShrink: 0 }} />
              Live — Updates in Real Time
            </div>
          </div>
          {/* Chip 3 */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            padding: "10px 18px",
            backdropFilter: "blur(8px)",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 12,
            fontFamily: F.ui,
            fontSize: 13,
            color: "#fff",
            whiteSpace: "nowrap",
          }}>
            All Time · From System Start
          </div>
        </div>

        {/* Decorative rings */}
        <div style={{
          position: "absolute",
          right: -120,
          bottom: -120,
          width: 400,
          height: 400,
          borderRadius: "50%",
          border: "1px solid rgba(200,155,71,0.12)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          right: -60,
          bottom: -60,
          width: 260,
          height: 260,
          borderRadius: "50%",
          border: "1px solid rgba(200,155,71,0.09)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute",
          right: 20,
          bottom: 20,
          width: 140,
          height: 140,
          borderRadius: "50%",
          border: "1px solid rgba(200,155,71,0.07)",
          pointerEvents: "none",
        }} />
      </div>

      {/* ── 2. STATS STRIP ── */}
      <div style={{ padding: "0 48px", marginTop: -80, position: "relative", zIndex: 20 }}>
        <div style={{
          background: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)",
          borderRadius: 24,
          minHeight: 130,
          display: "flex",
          alignItems: "stretch",
          boxShadow: "0 8px 40px rgba(44,9,19,0.40), 0 2px 8px rgba(44,9,19,0.20)",
          overflow: "hidden",
        }}>
          {/* Col 1 */}
          <StatCol
            icon="📋"
            label="TOTAL ACTIONS LOGGED"
            value="2,840"
            sub="From day one of the system"
            divider
          />
          {/* Col 2 */}
          <StatCol
            icon="⚡"
            label="ACTIONS TODAY"
            value="48"
            sub="↑ Live · Updates in real time"
            divider
          />
          {/* Col 3 — gold highlight */}
          <StatCol
            icon="👤"
            label="MOST ACTIVE USER TODAY"
            value="Admin (BK)"
            valueFontSize={22}
            valueColor={T.antiqueGold}
            sub="18 actions · Last active 12 mins ago"
            divider
            highlight
          />
          {/* Col 4 */}
          <StatCol
            icon="🔑"
            label="LOGIN SESSIONS TODAY"
            value="12"
            sub="Across all 5 roles"
            divider
          />
          {/* Col 5 */}
          <StatCol
            icon="🕐"
            label="LAST ACTION RECORDED"
            value="2 mins ago"
            valueFontSize={20}
            sub="Worker Staff · Material issued"
          />
        </div>
      </div>

      {/* Section wrapper — clears stats strip */}
      <div style={{ padding: "96px 56px 0" }}>

        {/* ── 3. LIVE UPDATE INDICATOR STRIP ── */}
        <div style={{
          background: "rgba(30,102,64,0.08)",
          border: "1px solid rgba(30,102,64,0.20)",
          borderRadius: 10,
          padding: "12px 20px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ type: "tween", duration: 1.5, repeat: Infinity }}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: T.green,
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: T.luxuryBrown }}>
              Live — New entries appear automatically as actions happen across the system.
            </span>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe }}>
              Last refreshed: just now
            </span>
            <button style={{
              border: `1px solid ${T.borderDef}`,
              borderRadius: 8,
              padding: "6px 12px",
              background: "transparent",
              fontFamily: F.ui,
              fontSize: 12,
              color: T.luxuryBrown,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <RefreshCw size={13} />
              Refresh Now
            </button>
          </div>
        </div>

        {/* ── 4. SEARCH AND FILTER BAR ── */}
        <div style={{
          background: "#fff",
          borderRadius: 14,
          border: `1px solid ${T.borderDef}`,
          boxShadow: "0 2px 12px rgba(44,24,16,0.06)",
          padding: "18px 22px",
          marginBottom: 24,
        }}>
          {/* Title row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.luxuryBrown }}>
              Search &amp; Filter Audit Log
            </span>
            <button style={{
              border: `1px solid ${T.antiqueGold}`,
              borderRadius: 8,
              padding: "7px 14px",
              background: "transparent",
              color: T.antiqueGold,
              fontFamily: F.ui,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <Download size={14} />
              Export
            </button>
          </div>

          {/* Filter row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 12,
            marginBottom: 14,
          }}>
            {/* Search */}
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <Search size={14} color={T.taupe} />
              </div>
              <input
                type="text"
                placeholder="Search actions, users, records..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
                  paddingLeft: 36,
                  paddingRight: 12,
                  background: "#FFF8F0",
                  border: `1px solid ${T.borderDef}`,
                  borderRadius: 10,
                  fontFamily: F.ui,
                  fontSize: 13,
                  color: T.luxuryBrown,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            {/* Role */}
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={{
                height: 40,
                borderRadius: 10,
                background: "#FFF8F0",
                border: `1px solid ${T.borderDef}`,
                fontFamily: F.ui,
                fontSize: 13,
                color: T.luxuryBrown,
                padding: "0 12px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option>All Roles</option>
              <option>SUPERADMIN</option>
              <option>ADMIN</option>
              <option>WORKER STAFF</option>
              <option>FINISHING STAFF</option>
              <option>SHOP STAFF</option>
            </select>
            {/* Module */}
            <select
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              style={{
                height: 40,
                borderRadius: 10,
                background: "#FFF8F0",
                border: `1px solid ${T.borderDef}`,
                fontFamily: F.ui,
                fontSize: 13,
                color: T.luxuryBrown,
                padding: "0 12px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option>All Modules</option>
              <option>MATERIALS</option>
              <option>WEAVERS</option>
              <option>RATES</option>
              <option>SALES</option>
              <option>PRODUCTION</option>
              <option>APPROVALS</option>
              <option>CUSTOMERS</option>
            </select>
            {/* Action */}
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              style={{
                height: 40,
                borderRadius: 10,
                background: "#FFF8F0",
                border: `1px solid ${T.borderDef}`,
                fontFamily: F.ui,
                fontSize: 13,
                color: T.luxuryBrown,
                padding: "0 12px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option>All Actions</option>
              <option>Create</option>
              <option>Update</option>
              <option>Approve</option>
              <option>Issue</option>
              <option>Dispatch</option>
              <option>Sale</option>
            </select>
          </div>

          {/* Date + period row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {/* Period pills */}
            <div style={{ display: "flex", gap: 6 }}>
              {["Today", "This Week", "This Month", "Last 3 Months", "All Time"].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriodFilter(p)}
                  style={{
                    borderRadius: 999,
                    padding: "5px 14px",
                    fontFamily: F.ui,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    border: periodFilter === p ? "none" : `1px solid ${T.borderDef}`,
                    background: periodFilter === p ? T.royalBurgundy : "transparent",
                    color: periodFilter === p ? "#fff" : T.luxuryBrown,
                    transition: "all 0.15s",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            {/* Apply / Clear */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button style={{
                borderRadius: 999,
                padding: "8px 18px",
                background: T.royalBurgundy,
                color: "#fff",
                border: "none",
                fontFamily: F.ui,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                <Search size={13} />
                Apply Filters
              </button>
              <button style={{
                background: "none",
                border: "none",
                fontFamily: F.ui,
                fontSize: 12,
                color: T.taupe,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}>
                <X size={13} />
                Clear
              </button>
            </div>
          </div>

          {/* Results label */}
          <div style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, marginTop: 10 }}>
            Showing 48 entries for today · 2,840 total in system
          </div>
        </div>
      </div>

      {/* ── 5 + 6. ACTION LOG SECTION ── */}
      <div style={{ padding: "48px 56px 0" }}>
        {/* Section title bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 4, alignSelf: "stretch", background: T.royalBurgundy, borderRadius: 2, minHeight: 24 }} />
          <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 18, color: T.luxuryBrown, flex: 1 }}>
            Action Log — All System Activity
          </span>
          <button style={{
            background: "none",
            border: "none",
            fontFamily: F.ui,
            fontWeight: 500,
            fontSize: 12,
            color: T.antiqueGold,
            cursor: "pointer",
          }}>
            Download Action Log →
          </button>
        </div>
        <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 24, marginTop: 0 }}>
          Every create, update, approve, issue, and dispatch action — recorded with user, timestamp, and changed values.
        </p>

        {/* View toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setActionView("timeline")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              padding: "7px 16px",
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              border: actionView === "timeline" ? "none" : `1px solid ${T.royalBurgundy}`,
              background: actionView === "timeline" ? T.royalBurgundy : "transparent",
              color: actionView === "timeline" ? "#fff" : T.royalBurgundy,
              transition: "all 0.15s",
            }}
          >
            <AlignLeft size={14} />
            Timeline View
          </button>
          <button
            onClick={() => setActionView("table")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              padding: "7px 16px",
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              border: actionView === "table" ? "none" : `1px solid ${T.royalBurgundy}`,
              background: actionView === "table" ? T.royalBurgundy : "transparent",
              color: actionView === "table" ? "#fff" : T.royalBurgundy,
              transition: "all 0.15s",
            }}
          >
            <Table2 size={14} />
            Table View
          </button>
        </div>

        <AnimatePresence mode="wait">
          {actionView === "timeline" ? (
            <motion.div
              key="action-timeline"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ position: "relative" }}
            >
              {/* Vertical line */}
              <div style={{
                position: "absolute",
                left: 13,
                top: 0,
                bottom: 0,
                width: 2,
                background: "rgba(110,15,45,0.18)",
                borderRadius: 1,
              }} />

              {ACTION_ENTRIES.map(entry => (
                <div key={entry.id} style={{ display: "flex", gap: 20, marginBottom: 14, position: "relative" }}>
                  {/* Circle */}
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: ROLE_COLORS[entry.role]?.circle ?? T.taupe,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    zIndex: 1,
                  }}>
                    <span style={{ fontFamily: F.mono, fontSize: 9, fontWeight: 700, color: "#fff" }}>
                      {ROLE_COLORS[entry.role]?.initial ?? "??"}
                    </span>
                  </div>

                  {/* Card */}
                  <div style={{
                    flex: 1,
                    background: "#fff",
                    borderRadius: 12,
                    border: `1px solid ${T.borderDef}`,
                    boxShadow: "0 1px 8px rgba(44,24,16,0.06)",
                    padding: "14px 18px",
                  }}>
                    {/* Row 1 */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          background: ROLE_COLORS[entry.role]?.badge,
                          color: ROLE_COLORS[entry.role]?.text,
                          fontFamily: F.mono,
                          fontSize: 9,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 999,
                          letterSpacing: "0.5px",
                        }}>
                          {entry.role}
                        </span>
                        <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>
                          {entry.user}
                        </span>
                      </div>
                      <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe }}>
                        {entry.time}
                      </span>
                    </div>

                    {/* Row 2 */}
                    <div style={{ fontFamily: F.ui, fontWeight: 500, fontSize: 13, color: T.luxuryBrown, marginBottom: entry.oldVal ? 8 : 10, lineHeight: 1.5 }}>
                      {entry.action}
                    </div>

                    {/* Row 3 — change values */}
                    {entry.oldVal && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Changed from:</span>
                        <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.crimson }}>{entry.oldVal}</span>
                        <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 14, color: T.antiqueGold }}>→</span>
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Changed to:</span>
                        <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color: T.green }}>{entry.newVal}</span>
                      </div>
                    )}

                    {/* Row 4 */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{
                        background: T.cream,
                        border: `1px solid ${T.borderDef}`,
                        borderRadius: 6,
                        padding: "2px 8px",
                        fontFamily: F.mono,
                        fontSize: 8,
                        color: T.royalBurgundy,
                      }}>
                        {entry.module}
                      </span>
                      <span style={{ fontFamily: F.mono, fontSize: 10, color: T.royalBurgundy }}>
                        {entry.record}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Load More */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
                <button style={{
                  border: `1px solid ${T.royalBurgundy}`,
                  borderRadius: 999,
                  padding: "9px 22px",
                  background: "transparent",
                  color: T.royalBurgundy,
                  fontFamily: F.ui,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}>
                  <ChevronDown size={14} />
                  Load More Entries
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="action-table"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{
                background: "#fff",
                borderRadius: 16,
                border: `1px solid ${T.borderDef}`,
                boxShadow: "0 2px 12px rgba(44,24,16,0.06)",
                overflowX: "auto",
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: T.silkCream }}>
                      {["Timestamp", "Role", "User", "Module", "Action", "Record", "Old Value", "New Value"].map(h => (
                        <th key={h} style={{
                          fontFamily: F.mono,
                          fontSize: 9,
                          textTransform: "uppercase",
                          color: T.taupe,
                          padding: "12px 14px",
                          textAlign: "left",
                          fontWeight: 600,
                          letterSpacing: "0.5px",
                          whiteSpace: "nowrap",
                          borderBottom: `1px solid ${T.borderDef}`,
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ACTION_ENTRIES.map((entry, i) => (
                      <tr
                        key={entry.id}
                        style={{
                          background: i % 2 === 0 ? "#fff" : T.warmIvory,
                          transition: "background 0.12s",
                          cursor: "default",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = T.cream)}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : T.warmIvory)}
                      >
                        <td style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, padding: "11px 14px", whiteSpace: "nowrap", borderBottom: `1px solid ${T.borderDef}` }}>
                          {entry.time}
                        </td>
                        <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderDef}` }}>
                          <span style={{
                            background: ROLE_COLORS[entry.role]?.badge,
                            color: ROLE_COLORS[entry.role]?.text,
                            fontFamily: F.mono,
                            fontSize: 8,
                            fontWeight: 600,
                            padding: "2px 7px",
                            borderRadius: 999,
                            whiteSpace: "nowrap",
                          }}>
                            {entry.role}
                          </span>
                        </td>
                        <td style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, padding: "11px 14px", whiteSpace: "nowrap", borderBottom: `1px solid ${T.borderDef}` }}>
                          {entry.user}
                        </td>
                        <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderDef}` }}>
                          <span style={{
                            background: T.cream,
                            border: `1px solid ${T.borderDef}`,
                            borderRadius: 6,
                            padding: "2px 7px",
                            fontFamily: F.mono,
                            fontSize: 8,
                            color: T.royalBurgundy,
                            whiteSpace: "nowrap",
                          }}>
                            {entry.module}
                          </span>
                        </td>
                        <td style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, padding: "11px 14px", maxWidth: 300, borderBottom: `1px solid ${T.borderDef}` }}>
                          {entry.action}
                        </td>
                        <td style={{ fontFamily: F.mono, fontSize: 10, color: T.royalBurgundy, padding: "11px 14px", whiteSpace: "nowrap", borderBottom: `1px solid ${T.borderDef}` }}>
                          {entry.record}
                        </td>
                        <td style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: entry.oldVal ? T.crimson : T.taupe, padding: "11px 14px", borderBottom: `1px solid ${T.borderDef}` }}>
                          {entry.oldVal ?? "—"}
                        </td>
                        <td style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: entry.newVal ? T.green : T.taupe, padding: "11px 14px", borderBottom: `1px solid ${T.borderDef}` }}>
                          {entry.newVal ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 18px",
                  borderTop: `1px solid ${T.borderDef}`,
                }}>
                  <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>
                    Showing 1–12 of 2,840 entries · Rows per page: 20
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <PaginationBtn disabled><ChevronLeft size={13} /></PaginationBtn>
                    {[1, 2, 3].map(n => (
                      <PaginationBtn key={n} active={n === 1}>{n}</PaginationBtn>
                    ))}
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, padding: "0 4px" }}>...</span>
                    <PaginationBtn>60</PaginationBtn>
                    <PaginationBtn><ChevronRight size={13} /></PaginationBtn>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 7. LOGIN HISTORY SECTION ── */}
      <div style={{ padding: "48px 56px 0" }}>
        {/* Section title */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 4, alignSelf: "stretch", background: T.royalBurgundy, borderRadius: 2, minHeight: 24 }} />
          <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 18, color: T.luxuryBrown, flex: 1 }}>
            Login History — User Sessions
          </span>
          <button style={{
            background: "none",
            border: "none",
            fontFamily: F.ui,
            fontWeight: 500,
            fontSize: 12,
            color: T.antiqueGold,
            cursor: "pointer",
          }}>
            Download Login Log →
          </button>
        </div>
        <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 24, marginTop: 0 }}>
          Every login, logout, and failed login attempt — with device, session duration, and status.
        </p>

        {/* View toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setLoginView("timeline")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              padding: "7px 16px",
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              border: loginView === "timeline" ? "none" : `1px solid ${T.royalBurgundy}`,
              background: loginView === "timeline" ? T.royalBurgundy : "transparent",
              color: loginView === "timeline" ? "#fff" : T.royalBurgundy,
              transition: "all 0.15s",
            }}
          >
            <AlignLeft size={14} />
            Timeline View
          </button>
          <button
            onClick={() => setLoginView("table")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              padding: "7px 16px",
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 12,
              cursor: "pointer",
              border: loginView === "table" ? "none" : `1px solid ${T.royalBurgundy}`,
              background: loginView === "table" ? T.royalBurgundy : "transparent",
              color: loginView === "table" ? "#fff" : T.royalBurgundy,
              transition: "all 0.15s",
            }}
          >
            <Table2 size={14} />
            Table View
          </button>
        </div>

        <AnimatePresence mode="wait">
          {loginView === "timeline" ? (
            <motion.div
              key="login-timeline"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ position: "relative" }}
            >
              {/* Vertical line */}
              <div style={{
                position: "absolute",
                left: 13,
                top: 0,
                bottom: 0,
                width: 2,
                background: "rgba(110,15,45,0.18)",
                borderRadius: 1,
              }} />

              {LOGIN_ENTRIES.map(entry => {
                const circleColor = entry.status === "login" ? T.green : entry.status === "logout" ? T.taupe : T.crimson;
                const circleInitial = entry.status === "login" ? "IN" : entry.status === "logout" ? "OUT" : "!";
                return (
                  <div key={entry.id} style={{ display: "flex", gap: 20, marginBottom: 14, position: "relative" }}>
                    {/* Circle */}
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: circleColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      zIndex: 1,
                    }}>
                      <span style={{ fontFamily: F.mono, fontSize: 8, fontWeight: 700, color: "#fff" }}>
                        {circleInitial}
                      </span>
                    </div>

                    {/* Card */}
                    <div style={{
                      flex: 1,
                      background: "#fff",
                      borderRadius: 12,
                      border: `1px solid ${T.borderDef}`,
                      boxShadow: "0 1px 8px rgba(44,24,16,0.06)",
                      padding: "14px 18px",
                    }}>
                      {/* Row 1 */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {/* Status badge */}
                          <span style={{
                            background: entry.status === "login"
                              ? "rgba(30,102,64,0.10)"
                              : entry.status === "logout"
                              ? "rgba(139,112,96,0.10)"
                              : "rgba(192,57,43,0.08)",
                            color: entry.status === "login" ? T.green : entry.status === "logout" ? T.taupe : T.crimson,
                            fontFamily: F.ui,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 9px",
                            borderRadius: 999,
                          }}>
                            {entry.status === "login" ? "✓ Login" : entry.status === "logout" ? "→ Logout" : "✗ Failed Login"}
                          </span>
                          <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>
                            {entry.user}
                          </span>
                          <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe }}>
                            {entry.role}
                          </span>
                        </div>
                        <span style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe }}>
                          {entry.time}
                        </span>
                      </div>

                      {/* Row 2 */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: entry.failReason ? 8 : 0 }}>
                        {entry.device.toLowerCase().includes("mobile") ? <Smartphone size={13} /> : <Monitor size={13} />}
                        <span>{entry.device}</span>
                        {entry.duration && (
                          <>
                            <span>·</span>
                            <span>Session:</span>
                            <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>{entry.duration}</span>
                          </>
                        )}
                      </div>

                      {/* Row 3 — fail reason */}
                      {entry.failReason && (
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson }}>
                          {entry.failReason}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="login-table"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div style={{
                background: "#fff",
                borderRadius: 16,
                border: `1px solid ${T.borderDef}`,
                boxShadow: "0 2px 12px rgba(44,24,16,0.06)",
                overflowX: "auto",
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: T.silkCream }}>
                      {["Timestamp", "User", "Role", "Event", "Device", "Session Duration", "Status"].map(h => (
                        <th key={h} style={{
                          fontFamily: F.mono,
                          fontSize: 9,
                          textTransform: "uppercase",
                          color: T.taupe,
                          padding: "12px 14px",
                          textAlign: "left",
                          fontWeight: 600,
                          letterSpacing: "0.5px",
                          whiteSpace: "nowrap",
                          borderBottom: `1px solid ${T.borderDef}`,
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {LOGIN_ENTRIES.map((entry, i) => {
                      const sessionDisplay = entry.duration
                        ? entry.duration
                        : entry.status === "login"
                        ? <span style={{ color: T.antiqueGold, fontFamily: F.mono, fontSize: 11 }}>Ongoing</span>
                        : "—";

                      return (
                        <tr
                          key={entry.id}
                          style={{
                            background: i % 2 === 0 ? "#fff" : T.warmIvory,
                            transition: "background 0.12s",
                            cursor: "default",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = T.cream)}
                          onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#fff" : T.warmIvory)}
                        >
                          <td style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, padding: "11px 14px", whiteSpace: "nowrap", borderBottom: `1px solid ${T.borderDef}` }}>
                            {entry.time}
                          </td>
                          <td style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, padding: "11px 14px", whiteSpace: "nowrap", borderBottom: `1px solid ${T.borderDef}` }}>
                            {entry.user}
                          </td>
                          <td style={{ fontFamily: F.mono, fontSize: 10, color: T.taupe, padding: "11px 14px", whiteSpace: "nowrap", borderBottom: `1px solid ${T.borderDef}` }}>
                            {entry.role}
                          </td>
                          <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderDef}` }}>
                            <span style={{
                              background: entry.status === "login"
                                ? "rgba(30,102,64,0.10)"
                                : entry.status === "logout"
                                ? "rgba(139,112,96,0.10)"
                                : "rgba(192,57,43,0.08)",
                              color: entry.status === "login" ? T.green : entry.status === "logout" ? T.taupe : T.crimson,
                              fontFamily: F.ui,
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "2px 9px",
                              borderRadius: 999,
                              whiteSpace: "nowrap",
                            }}>
                              {entry.status === "login" ? "✓ Login" : entry.status === "logout" ? "→ Logout" : "✗ Failed Login"}
                            </span>
                          </td>
                          <td style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, padding: "11px 14px", whiteSpace: "nowrap", borderBottom: `1px solid ${T.borderDef}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {entry.device.toLowerCase().includes("mobile") ? <Smartphone size={12} color={T.taupe} /> : <Monitor size={12} color={T.taupe} />}
                              {entry.device}
                            </div>
                          </td>
                          <td style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, padding: "11px 14px", whiteSpace: "nowrap", borderBottom: `1px solid ${T.borderDef}` }}>
                            {sessionDisplay}
                          </td>
                          <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderDef}` }}>
                            <span style={{
                              background: entry.status === "login"
                                ? "rgba(30,102,64,0.10)"
                                : entry.status === "logout"
                                ? "rgba(139,112,96,0.10)"
                                : "rgba(192,57,43,0.08)",
                              color: entry.status === "login" ? T.green : entry.status === "logout" ? T.taupe : T.crimson,
                              fontFamily: F.ui,
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "2px 9px",
                              borderRadius: 999,
                              whiteSpace: "nowrap",
                            }}>
                              {entry.status === "login" ? "Active" : entry.status === "logout" ? "Ended" : "Failed"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 18px",
                  borderTop: `1px solid ${T.borderDef}`,
                }}>
                  <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe }}>
                    Showing 1–10 of 142 sessions · Rows per page: 20
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <PaginationBtn disabled><ChevronLeft size={13} /></PaginationBtn>
                    {[1, 2, 3].map(n => (
                      <PaginationBtn key={n} active={n === 1}>{n}</PaginationBtn>
                    ))}
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, padding: "0 4px" }}>...</span>
                    <PaginationBtn>8</PaginationBtn>
                    <PaginationBtn><ChevronRight size={13} /></PaginationBtn>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 8. IMMUTABILITY NOTICE ── */}
      <div style={{ padding: "48px 56px" }}>
        <div style={{
          background: "rgba(44,24,16,0.04)",
          border: "1px solid rgba(44,24,16,0.10)",
          borderRadius: 12,
          padding: "18px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <Lock size={20} color={T.royalBurgundy} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown, marginBottom: 6 }}>
                🔒 This audit log is permanent and immutable.
              </div>
              <p style={{
                fontFamily: F.ui,
                fontWeight: 400,
                fontSize: 12,
                color: T.taupe,
                lineHeight: 1.65,
                maxWidth: 600,
                margin: 0,
              }}>
                No one — including the Superadmin — can edit, delete, or modify any entry in this log. Every action recorded here is final and permanent. This log is your legal and operational record.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0, marginLeft: 24 }}>
            <button style={{
              border: `1px solid ${T.royalBurgundy}`,
              borderRadius: 8,
              padding: "9px 18px",
              background: "transparent",
              color: T.royalBurgundy,
              fontFamily: F.ui,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <Download size={14} />
              Export Full Log
            </button>
            <span style={{ fontFamily: F.mono, fontSize: 9, color: T.taupe }}>
              PDF · Excel
            </span>
          </div>
        </div>
      </div>

      {/* ── 9. FOOTER ── */}
      <div style={{
        padding: "32px 56px",
        background: T.luxuryBrown,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: F.display,
          fontWeight: 400,
          fontSize: 14,
          color: T.warmCream,
          marginBottom: 4,
        }}>
          Beere Kesava &amp; Brothers Silks · Est. 1999
        </div>
        <div style={{
          fontFamily: F.ui,
          fontSize: 11,
          color: T.taupe,
        }}>
          Superadmin Portal · Audit Log
        </div>
      </div>
    </div>
  );
}

/* ── Helper components ── */

function StatCol({
  icon,
  label,
  value,
  valueFontSize = 32,
  valueColor = "#fff",
  sub,
  divider = false,
  highlight = false,
}: {
  icon: string;
  label: string;
  value: string;
  valueFontSize?: number;
  valueColor?: string;
  sub: string;
  divider?: boolean;
  highlight?: boolean;
}) {
  return (
    <div style={{
      flex: 1,
      display: "flex",
      alignItems: "stretch",
      position: "relative",
    }}>
      {divider && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "16px",
          bottom: "16px",
          width: 1,
          background: "rgba(200,155,71,0.18)",
        }} />
      )}
      <div style={{
        flex: 1,
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}>
        {/* Icon box */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: highlight ? "rgba(200,155,71,0.18)" : "rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          marginBottom: 4,
        }}>
          {icon}
        </div>
        {/* Label */}
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          textTransform: "uppercase" as const,
          color: "rgba(255,255,255,0.50)",
          letterSpacing: "0.8px",
          fontWeight: 600,
        }}>
          {label}
        </div>
        {/* Value */}
        <div style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          fontSize: valueFontSize,
          color: valueColor,
          lineHeight: 1.1,
        }}>
          {value}
        </div>
        {/* Sub */}
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          color: "rgba(255,255,255,0.45)",
          lineHeight: 1.4,
        }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

function PaginationBtn({
  children,
  active = false,
  disabled = false,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      style={{
        minWidth: 30,
        height: 30,
        borderRadius: 6,
        border: active ? "none" : `1px solid rgba(110,15,45,0.15)`,
        background: active ? "#6E0F2D" : "transparent",
        color: active ? "#fff" : disabled ? "rgba(139,112,96,0.4)" : "#6E0F2D",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
        fontWeight: 600,
        cursor: disabled ? "default" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 6px",
      }}
    >
      {children}
    </button>
  );
}
