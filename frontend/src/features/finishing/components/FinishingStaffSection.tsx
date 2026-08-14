import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronRight, Package, Camera, Users } from "lucide-react";
import { FinishingAssignment, FinishingReturn } from "../contexts/FinishingContext";
import { Button } from "../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";
import { SectionCard } from "./common/primitives";

const T = {
  royalBurgundy: "#6E0F2D",
  luxuryBrown:   "#3B2314",
  taupe:         "#69635E",
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

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 12, color, background: bg, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>{label}</span>;
}

const td: React.CSSProperties = { fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, padding: "11px 12px", borderBottom: `1px solid rgba(110,15,45,0.06)`, verticalAlign: "middle" };
const tdMono: React.CSSProperties = { ...td, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: T.royalBurgundy };

function buildAssignmentColumns(returns: FinishingReturn[]): ColumnDef<FinishingAssignment>[] {
  const findRet = (a: FinishingAssignment) => returns.find(rt => rt.sareeId === a.sareeId);
  return [
    { id: "sareeCode", header: "Saree Code", accessor: a => a.sareeId, priority: 1, cell: (_v, a) => <span style={tdMono}>{a.sareeId}</span> },
    {
      id: "quotation", header: "Quotation", accessor: a => a.quotationRef,
      cell: (_v, a) => a.quotationRef ? <Pill label={a.quotationRef} color="#8B6018" bg="rgba(200,146,58,0.14)" /> : <span style={{ color: T.taupe, fontSize: 12 }}>—</span>,
    },
    { id: "sareeType", header: "Saree Type", accessor: a => a.sareeType, cell: (_v, a) => <span style={td}>{a.sareeTypeCode ? `${a.sareeTypeCode} · ` : ""}{a.sareeType}</span> },
    { id: "weaver", header: "Weaver", accessor: a => a.weaverName, cell: (_v, a) => <span style={td}>{a.weaverName}</span> },
    { id: "assignedOn", header: "Assigned On", accessor: a => a.assignedDate, cell: (_v, a) => <span style={td}>{a.assignedDate}</span> },
    { id: "assignedBy", header: "Assigned By", accessor: a => a.assignedBy, priority: 3, cell: (_v, a) => <span style={td}>{a.assignedBy}</span> },
    {
      id: "returnStatus", header: "Return Status", accessor: a => findRet(a)?.condition,
      cell: (_v, a) => {
        const ret = findRet(a);
        return !ret ? (
          <Pill label="Awaiting Return" color={T.orange} bg="rgba(230,126,34,0.12)" />
        ) : (
          <div>
            <Pill
              label={ret.condition === "perfect" ? "Received · Perfect" : `Received · Damaged${ret.damageSeverity ? ` (${ret.damageSeverity})` : ""}`}
              color={ret.condition === "perfect" ? T.green : T.crimson}
              bg={ret.condition === "perfect" ? "rgba(30,102,64,0.09)" : "rgba(192,57,43,0.10)"}
            />
            <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 4 }}>{ret.receivedDate} · by {ret.receivedBy}</div>
            {ret.condition === "damaged" && ret.damageNotes && (
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.crimson, marginTop: 2 }}>{ret.damageType || "Damage"}: {ret.damageNotes}</div>
            )}
          </div>
        );
      },
    },
    {
      id: "photo", header: "Photo", accessor: a => findRet(a)?.damagePhotoUrl, priority: 3,
      cell: (_v, a) => {
        const ret = findRet(a);
        return ret?.damagePhotoUrl ? (
          <div style={{ width: 26, height: 26, borderRadius: 6, background: "linear-gradient(135deg,#F0E8D0,#C0392B)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Camera size={12} color="rgba(255,255,255,0.85)" />
          </div>
        ) : <span style={{ color: T.taupe, fontSize: 12 }}>—</span>;
      },
    },
    {
      id: "inventoryStatus", header: "Inventory Status", accessor: a => findRet(a)?.inventoryStatus, priority: 3,
      cell: (_v, a) => {
        const ret = findRet(a);
        return ret ? (
          <Pill label={ret.inventoryStatus} color={ret.inventoryStatus === "Dispatched" ? T.green : ret.inventoryStatus.startsWith("Damaged") ? T.crimson : T.royalBurgundy}
            bg={ret.inventoryStatus === "Dispatched" ? "rgba(30,102,64,0.09)" : ret.inventoryStatus.startsWith("Damaged") ? "rgba(192,57,43,0.10)" : "rgba(110,15,45,0.06)"} />
        ) : <span style={{ color: T.taupe, fontSize: 12 }}>—</span>;
      },
    },
  ];
}

export interface StaffRow {
  name: string;
  assignments: FinishingAssignment[];
  returns: FinishingReturn[];
  perfect: number;
  damaged: number;
  pending: number;
  lastAssignmentDate: string;
  assignedByLabel: string;
  visibleAssignments?: FinishingAssignment[];
}

interface FinishingStaffSectionProps {
  filteredRows: (StaffRow & { visibleAssignments: FinishingAssignment[] })[];
  open: string | null;
  setOpen: (name: string | null) => void;
  returns: FinishingReturn[];
}

export function FinishingStaffSection({
  filteredRows,
  open,
  setOpen,
  returns,
}: FinishingStaffSectionProps) {
  return (
    <SectionCard
      icon={Users}
      title="Assignment History by Finishing Staff"
      subtitle="Every finishing staff member, what has been assigned to them, and what they've returned so far."
    >
      {filteredRows.length === 0 ? (
        <div style={{ padding: "48px 24px", textAlign: "center" }}>
          <Package size={40} color={T.taupe} style={{ opacity: 0.45, marginBottom: 12 }} />
          <div style={{ fontFamily: F.display, fontSize: 16, color: T.taupe }}>No finishing assignments match the current filters.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredRows.map(r => {
            const isOpen = open === r.name;
            return (
              <div key={r.name} style={{ border: `1px solid ${T.borderDef}`, borderRadius: 14, overflow: "hidden" }}>
                <Button variant="ghost" onClick={() => setOpen(isOpen ? null : r.name)}
                  className={`w-full h-auto justify-start text-left gap-3.5 py-3.5 px-[18px] rounded-none ${isOpen ? "bg-[rgba(110,15,45,0.04)]" : "bg-white"}`}>
                  {isOpen ? <ChevronDown size={17} color={T.royalBurgundy} /> : <ChevronRight size={17} color={T.taupe} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{r.name}</div>
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
                        <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase", letterSpacing: "0.7px" }}>{k.l}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: k.c }}>{k.v}</div>
                      </div>
                    ))}
                  </div>
                </Button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", background: "#FFFDF9" }}>
                      <div style={{ padding: "6px 18px 16px" }}>
                        <div className="min-w-[680px]" style={{ overflowX: "auto" }}>
                          <DataTable
                            responsive
                            columns={buildAssignmentColumns(returns)}
                            data={r.visibleAssignments}
                            getRowId={a => a.id}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
