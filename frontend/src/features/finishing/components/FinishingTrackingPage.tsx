import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, ChevronDown, ChevronRight, Users, Package, Camera, Building2, UserRound,
} from "lucide-react";
import { useFinishing, FinishingAssignment, FinishingReturn, Quotation } from "./FinishingContext";
import { DateFilterBar, DateFilterState, DEFAULT_DATE_FILTER, matchesDateFilter } from "./DateFilterBar";

/**
 * Read-only view for admin / superadmin of what WorkerFinishing already tracks:
 * which sarees were sent to which finishing staff, and what came back and in
 * what condition. Data comes straight from FinishingContext — nothing new is
 * stored here, this just gives admin/superadmin the same visibility the
 * worker portal has.
 */

// ── Design tokens (match Reports / Outstanding Stock) ─────────────────────────
const T = {
  silkCream:     "#F7F2EA",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  luxuryBrown:   "#3B2314",
  warmCream:     "#F5E8D0",
  taupe:         "#8B7060",
  crimson:       "#C0392B",
  green:         "#1E6640",
  orange:        "#E67E22",
  borderDef:     "rgba(110,15,45,0.10)",
};
const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};
const G = { card: "linear-gradient(135deg, #5D1027 0%, #2C0913 100%)" };

function StatChip({ label, value, tone = "plain" }: { label: string; value: string; tone?: "plain" | "gold" | "green" | "red" }) {
  const c = tone === "gold" ? T.antiqueGold : tone === "green" ? "#6DCE9A" : tone === "red" ? "#F0857D" : "#FFFDF9";
  const bg = tone === "gold" ? "rgba(200,155,71,0.18)" : tone === "green" ? "rgba(30,102,64,0.20)" : tone === "red" ? "rgba(224,82,82,0.18)" : "rgba(255,253,249,0.10)";
  const bd = tone === "gold" ? "rgba(200,155,71,0.38)" : tone === "green" ? "rgba(30,102,64,0.35)" : tone === "red" ? "rgba(224,82,82,0.35)" : "rgba(255,253,249,0.15)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: bg, border: `1px solid ${bd}`, borderRadius: 99, padding: "9px 18px" }}>
      <span style={{ fontFamily: F.display, fontSize: 21, fontWeight: 700, color: c }}>{value}</span>
      <span style={{ fontFamily: F.ui, fontSize: 12.5, color: tone === "plain" ? "rgba(255,253,249,0.68)" : c }}>{label}</span>
    </div>
  );
}

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 11, color, background: bg, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>{label}</span>;
}

function Card({ children, pad = 22 }: { children: React.ReactNode; pad?: number }) {
  return <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, boxShadow: "0 4px 20px rgba(74,6,27,0.06)", padding: pad }}>{children}</div>;
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.luxuryBrown, margin: 0 }}>{title}</h3>
      {sub && <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, margin: "5px 0 0" }}>{sub}</p>}
    </div>
  );
}

const th: React.CSSProperties = { fontFamily: F.ui, fontSize: 10.5, fontWeight: 700, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.8px", textAlign: "left", padding: "10px 12px", borderBottom: `1.5px solid ${T.borderDef}`, whiteSpace: "nowrap" };
const td: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "11px 12px", borderBottom: `1px solid rgba(110,15,45,0.06)`, verticalAlign: "middle" };
const tdMono: React.CSSProperties = { ...td, fontFamily: F.mono, fontSize: 12.5, fontWeight: 600, color: T.royalBurgundy };

function ScrollTable({ children }: { children: React.ReactNode }) {
  return <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>{children}</table></div>;
}

function Empty({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center" }}>
      <Package size={40} color={T.taupe} style={{ opacity: 0.45, marginBottom: 12 }} />
      <div style={{ fontFamily: F.display, fontSize: 16, color: T.taupe }}>{msg}</div>
    </div>
  );
}

function parseDMY(s: string): number {
  const t = Date.parse(s);
  return isNaN(t) ? 0 : t;
}

// ── Per-saree row: assignment + its return (if any) ──────────────────────────
function AssignmentRow({ a, ret }: { a: FinishingAssignment; ret: FinishingReturn | undefined }) {
  return (
    <tr>
      <td style={tdMono}>{a.sareeId}</td>
      <td style={td}>
        {a.quotationRef ? <Pill label={a.quotationRef} color="#8B6018" bg="rgba(200,146,58,0.14)" /> : <span style={{ color: T.taupe, fontSize: 12 }}>—</span>}
      </td>
      <td style={td}>{a.sareeTypeCode ? `${a.sareeTypeCode} · ` : ""}{a.sareeType}</td>
      <td style={td}>{a.weaverName}</td>
      <td style={td}>{a.assignedDate}</td>
      <td style={td}>{a.assignedBy}</td>
      <td style={td}>
        {!ret ? (
          <Pill label="Awaiting Return" color={T.orange} bg="rgba(230,126,34,0.12)" />
        ) : (
          <div>
            <Pill
              label={ret.condition === "perfect" ? "Received · Perfect" : `Received · Damaged${ret.damageSeverity ? ` (${ret.damageSeverity})` : ""}`}
              color={ret.condition === "perfect" ? T.green : T.crimson}
              bg={ret.condition === "perfect" ? "rgba(30,102,64,0.09)" : "rgba(192,57,43,0.10)"}
            />
            <div style={{ fontFamily: F.ui, fontSize: 11, color: T.taupe, marginTop: 4 }}>{ret.receivedDate} · by {ret.receivedBy}</div>
            {ret.condition === "damaged" && ret.damageNotes && (
              <div style={{ fontFamily: F.ui, fontSize: 11, color: T.crimson, marginTop: 2 }}>{ret.damageType || "Damage"}: {ret.damageNotes}</div>
            )}
          </div>
        )}
      </td>
      <td style={td}>
        {ret?.damagePhotoUrl ? (
          <div style={{ width: 26, height: 26, borderRadius: 6, background: "linear-gradient(135deg,#F0E8D0,#C0392B)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Camera size={12} color="rgba(255,255,255,0.85)" />
          </div>
        ) : <span style={{ color: T.taupe, fontSize: 12 }}>—</span>}
      </td>
      <td style={td}>
        {ret ? <Pill label={ret.inventoryStatus} color={ret.inventoryStatus === "Dispatched" ? T.green : ret.inventoryStatus.startsWith("Damaged") ? T.crimson : T.royalBurgundy}
          bg={ret.inventoryStatus === "Dispatched" ? "rgba(30,102,64,0.09)" : ret.inventoryStatus.startsWith("Damaged") ? "rgba(192,57,43,0.10)" : "rgba(110,15,45,0.06)"} />
          : <span style={{ color: T.taupe, fontSize: 12 }}>—</span>}
      </td>
    </tr>
  );
}

// ── Quotations for Finishing (read-only mirror of the worker portal view) ────
function QuotationStatusBadge({ status }: { status: Quotation["status"] }) {
  const cfg: Record<Quotation["status"], { bg: string; color: string; label: string }> = {
    "raised":              { bg: "rgba(200,146,58,0.14)", color: "#8B6018", label: "Awaiting Finishing" },
    "in-finishing":        { bg: "rgba(248,140,0,0.12)",  color: "#B85C00", label: "With Finishing Staff" },
    "partially-received":  { bg: "rgba(30,102,64,0.10)",  color: T.green,   label: "Partially Received" },
    "received":            { bg: "rgba(30,102,64,0.12)",  color: T.green,   label: "Received — Ready to Dispatch" },
    "dispatched":          { bg: "rgba(107,26,42,0.10)",  color: T.royalBurgundy, label: "Dispatched" },
  };
  const s = cfg[status];
  return <Pill label={s.label} color={s.color} bg={s.bg} />;
}

interface StaffRow {
  name: string;
  assignments: FinishingAssignment[];
  returns: FinishingReturn[];
  perfect: number;
  damaged: number;
  pending: number;
  lastAssignmentDate: string;
  assignedByLabel: string;
}

function summarizeAssignedBy(list: FinishingAssignment[]): string {
  const names = [...new Set(list.map(a => a.assignedBy))];
  if (names.length === 0) return "—";
  if (names.length === 1) return names[0];
  return `${names.length} people`;
}

export function FinishingTrackingPage() {
  const { assignments, returns, quotations } = useFinishing();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "awaiting" | "perfect" | "damaged">("all");
  const [dateFilter, setDateFilter] = useState<DateFilterState>(DEFAULT_DATE_FILTER);
  const [open, setOpen] = useState<string | null>(null);
  const [openQuotation, setOpenQuotation] = useState<string | null>(null);

  const rows = useMemo<StaffRow[]>(() => {
    const byStaff = new Map<string, FinishingAssignment[]>();
    assignments.forEach(a => {
      const list = byStaff.get(a.finishingStaffName) ?? [];
      list.push(a);
      byStaff.set(a.finishingStaffName, list);
    });
    return [...byStaff.entries()].map(([name, staffAssignments]) => {
      const sareeIds = staffAssignments.map(a => a.sareeId);
      const staffReturns = returns.filter(r => sareeIds.includes(r.sareeId));
      const perfect = staffReturns.filter(r => r.condition === "perfect").length;
      const damaged = staffReturns.filter(r => r.condition === "damaged").length;
      const pending = staffAssignments.length - staffReturns.length;
      const lastAssignmentDate = staffAssignments.map(a => a.assignedDate).sort((a, b) => parseDMY(b) - parseDMY(a))[0] ?? "—";
      return { name, assignments: staffAssignments, returns: staffReturns, perfect, damaged, pending, lastAssignmentDate, assignedByLabel: summarizeAssignedBy(staffAssignments) };
    }).sort((a, b) => parseDMY(b.lastAssignmentDate) - parseDMY(a.lastAssignmentDate));
  }, [assignments, returns]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .map(r => ({
        ...r,
        visibleAssignments: r.assignments.filter(a => {
          const ret = returns.find(rt => rt.sareeId === a.sareeId);
          if (statusFilter === "awaiting" && ret) return false;
          if (statusFilter === "perfect" && ret?.condition !== "perfect") return false;
          if (statusFilter === "damaged" && ret?.condition !== "damaged") return false;
          if (!matchesDateFilter(a.assignedDate, dateFilter)) return false;
          if (!q) return true;
          return a.sareeId.toLowerCase().includes(q) || a.weaverName.toLowerCase().includes(q) || a.sareeType.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || a.assignedBy.toLowerCase().includes(q);
        }),
      }))
      .filter(r => r.visibleAssignments.length > 0);
  }, [rows, search, statusFilter, dateFilter, returns]);

  const totalAssigned = assignments.length;
  const totalAwaiting = assignments.filter(a => a.status === "awaiting-return").length;
  const totalPerfect = returns.filter(r => r.condition === "perfect").length;
  const totalDamaged = returns.filter(r => r.condition === "damaged").length;

  const filteredQuotations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotations
      .filter(qt => matchesDateFilter(qt.quotationDate, dateFilter))
      .filter(qt => {
        if (!q) return true;
        return qt.quotationNumber.toLowerCase().includes(q) || qt.customerName.toLowerCase().includes(q)
          || (qt.finishingStaffName || "").toLowerCase().includes(q) || qt.raisedBy.toLowerCase().includes(q)
          || qt.sarees.some(s => s.sareeId.toLowerCase().includes(q));
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [quotations, search, dateFilter]);

  return (
    <div style={{ background: T.silkCream, fontFamily: F.ui, minHeight: "100vh" }}>
      {/* HERO */}
      <section style={{ background: G.card, padding: "44px 40px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(135deg, rgba(200,155,71,0.04) 0px, rgba(200,155,71,0.04) 1px, transparent 1px, transparent 60px)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(200,155,71,0.80)", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 10 }}>
            PRODUCTION · FINISHING
          </div>
          <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 38, color: "#FFFDF9", margin: 0, lineHeight: 1.12 }}>
            Finishing Assignment &amp; Receiving
          </h1>
          <p style={{ fontFamily: F.ui, fontSize: 14.5, color: "rgba(255,253,249,0.65)", margin: "10px 0 0", lineHeight: 1.6, maxWidth: 720 }}>
            Every saree sent to finishing staff, who assigned it, and what came back — plus every bulk-order
            quotation routed through finishing. The same tracking Worker Staff sees, visible here for admin and superadmin.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "26px 0 32px" }}>
            <StatChip label="Total Assigned" value={String(totalAssigned)} />
            <StatChip label="Awaiting Return" value={String(totalAwaiting)} tone="gold" />
            <StatChip label="Received · Perfect" value={String(totalPerfect)} tone="green" />
            <StatChip label="Received · Damaged" value={String(totalDamaged)} tone="red" />
            <StatChip label="Quotations in Finishing" value={String(quotations.filter(q => q.status !== "dispatched").length)} tone="gold" />
          </div>
        </div>
      </section>

      <div style={{ padding: "22px 40px 48px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Filters */}
        <Card pad={16}>
          <div style={{ marginBottom: 14 }}>
            <DateFilterBar filter={dateFilter} onChange={setDateFilter} />
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: "1 1 260px" }}>
              <Search size={16} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: T.taupe }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search saree code, weaver, saree type, finishing staff…"
                style={{ width: "100%", height: 42, paddingLeft: 42, paddingRight: 14, fontFamily: F.ui, fontSize: 13.5, color: T.luxuryBrown, background: T.silkCream, border: `1.5px solid ${T.borderDef}`, borderRadius: 11, outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
              {[
                { key: "all", label: "All" },
                { key: "awaiting", label: "Awaiting Return" },
                { key: "perfect", label: "Received · Perfect" },
                { key: "damaged", label: "Received · Damaged" },
              ].map(f => (
                <button key={f.key} onClick={() => setStatusFilter(f.key as typeof statusFilter)}
                  style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, padding: "8px 14px", borderRadius: 99, cursor: "pointer", background: statusFilter === f.key ? T.royalBurgundy : "transparent", color: statusFilter === f.key ? "#FFFDF9" : T.taupe, border: statusFilter === f.key ? "none" : `1.5px solid rgba(110,15,45,0.18)` }}>
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto", background: T.warmCream, borderRadius: 10, padding: "8px 14px" }}>
              <Users size={15} color={T.taupe} />
              <span style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe, fontWeight: 600 }}>{filteredRows.length} finishing staff</span>
            </div>
          </div>
        </Card>

        {/* Quotations for Finishing */}
        <Card>
          <SectionTitle
            title="Quotations for Finishing"
            sub="Bulk-order quotations routed through finishing before dispatch — who raised them, who they're assigned to, and how many sarees have come back so far."
          />
          {filteredQuotations.length === 0 ? <Empty msg="No quotations match the current filters." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredQuotations.map(qt => {
                const isOpen = openQuotation === qt.id;
                const received = qt.sarees.filter(s => s.finishingStatus === "received").length;
                return (
                  <div key={qt.id} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden" }}>
                    <button onClick={() => setOpenQuotation(isOpen ? null : qt.id)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: isOpen ? "rgba(110,15,45,0.04)" : "#FFF", border: "none", cursor: "pointer", textAlign: "left" }}>
                      {isOpen ? <ChevronDown size={17} color={T.royalBurgundy} /> : <ChevronRight size={17} color={T.taupe} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: T.royalBurgundy }}>{qt.quotationNumber}</span>
                          <QuotationStatusBadge status={qt.status} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                          <Building2 size={12} color={T.taupe} /> {qt.customerName}{qt.customerCity ? ` · ${qt.customerCity}` : ""} · {qt.quotationDate}
                        </div>
                        <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe, marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}>
                          <UserRound size={12} color={T.taupe} /> Raised by <strong style={{ color: T.luxuryBrown }}>{qt.raisedBy}</strong>
                          {qt.finishingStaffName && <> · Assigned to <strong style={{ color: T.luxuryBrown }}>{qt.finishingStaffName}</strong></>}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 20, color: T.luxuryBrown, lineHeight: 1 }}>{received}/{qt.sarees.length}</div>
                        <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.7px", marginTop: 3 }}>Received</div>
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", background: "#FFFDF9" }}>
                          <div style={{ padding: "6px 18px 16px" }}>
                            <ScrollTable>
                              <thead>
                                <tr>
                                  <th style={th}>Saree Code</th>
                                  <th style={th}>Saree Type</th>
                                  <th style={th}>Weaver</th>
                                  <th style={th}>Finishing Status</th>
                                  <th style={th}>Finishing Staff</th>
                                </tr>
                              </thead>
                              <tbody>
                                {qt.sarees.map(s => (
                                  <tr key={s.sareeId}>
                                    <td style={tdMono}>{s.sareeId}</td>
                                    <td style={td}>{s.sareeTypeCode ? `${s.sareeTypeCode} · ` : ""}{s.sareeType}</td>
                                    <td style={td}>{s.weaverName}</td>
                                    <td style={td}>
                                      <Pill
                                        label={s.finishingStatus === "received" ? "Received" : s.finishingStatus === "in-finishing" ? "In Finishing" : "Pending"}
                                        color={s.finishingStatus === "received" ? T.green : s.finishingStatus === "in-finishing" ? T.orange : T.taupe}
                                        bg={s.finishingStatus === "received" ? "rgba(30,102,64,0.09)" : s.finishingStatus === "in-finishing" ? "rgba(230,126,34,0.12)" : "rgba(139,112,96,0.10)"}
                                      />
                                    </td>
                                    <td style={td}>{s.finishingStaffName || <span style={{ color: T.taupe, fontSize: 12 }}>—</span>}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </ScrollTable>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Staff-wise tracking */}
        <Card>
          <SectionTitle
            title="Assignment History by Finishing Staff"
            sub="Every finishing staff member, what has been assigned to them, and what they've returned so far."
          />
          {filteredRows.length === 0 ? <Empty msg="No finishing assignments match the current filters." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredRows.map(r => {
                const isOpen = open === r.name;
                return (
                  <div key={r.name} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden" }}>
                    <button onClick={() => setOpen(isOpen ? null : r.name)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: isOpen ? "rgba(110,15,45,0.04)" : "#FFF", border: "none", cursor: "pointer", textAlign: "left" }}>
                      {isOpen ? <ChevronDown size={17} color={T.royalBurgundy} /> : <ChevronRight size={17} color={T.taupe} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 700, color: T.luxuryBrown }}>{r.name}</div>
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Last assigned {r.lastAssignmentDate} · Assigned by {r.assignedByLabel}</div>
                      </div>
                      <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {[
                          { l: "Assigned", v: String(r.assignments.length), c: T.luxuryBrown },
                          { l: "Returned", v: String(r.returns.length), c: T.royalBurgundy },
                          { l: "Pending", v: String(r.pending), c: r.pending > 0 ? T.orange : T.green },
                          { l: "Perfect", v: String(r.perfect), c: T.green },
                          { l: "Damaged", v: String(r.damaged), c: r.damaged > 0 ? T.crimson : T.taupe },
                        ].map(k => (
                          <div key={k.l} style={{ textAlign: "right", minWidth: 58 }}>
                            <div style={{ fontFamily: F.ui, fontSize: 10.5, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.7px" }}>{k.l}</div>
                            <div style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: k.c }}>{k.v}</div>
                          </div>
                        ))}
                      </div>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", background: "#FFFDF9" }}>
                          <div style={{ padding: "6px 18px 16px" }}>
                            <ScrollTable>
                              <thead>
                                <tr>
                                  <th style={th}>Saree Code</th>
                                  <th style={th}>Quotation</th>
                                  <th style={th}>Saree Type</th>
                                  <th style={th}>Weaver</th>
                                  <th style={th}>Assigned On</th>
                                  <th style={th}>Assigned By</th>
                                  <th style={th}>Return Status</th>
                                  <th style={th}>Photo</th>
                                  <th style={th}>Inventory Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {r.visibleAssignments.map(a => (
                                  <AssignmentRow key={a.id} a={a} ret={r.returns.find(rt => rt.sareeId === a.sareeId)} />
                                ))}
                              </tbody>
                            </ScrollTable>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
