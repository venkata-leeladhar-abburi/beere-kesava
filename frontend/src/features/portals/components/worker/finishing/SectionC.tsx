import { useState, useMemo, type CSSProperties } from "react";
import { Users, ChevronDown, Camera } from "lucide-react";
import { C, F } from "../tokens";
import { useFinishing, FinishingAssignment } from "@/features/finishing";
import { SectionCard } from "../primitives";
import { Button } from "../../../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../../../shared/ui/data";

// ── Section C — Assignment History & Tracking ─────────────────────────────────

interface StaffTrackingRow {
  name: string;
  assignedSareeIds: string[];
  returnedSareeIds: string[];
  perfect: number;
  damaged: number;
  lastAssignmentDate: string;
}

function parseDMYDate(s: string): number {
  const t = Date.parse(s);
  return isNaN(t) ? 0 : t;
}

export function SectionC({ isMobile }: { isMobile?: boolean }) {
  const { assignments, returns } = useFinishing();
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo<StaffTrackingRow[]>(() => {
    const byStaff = new Map<string, FinishingAssignment[]>();
    assignments.forEach(a => {
      const list = byStaff.get(a.finishingStaffName) ?? [];
      list.push(a);
      byStaff.set(a.finishingStaffName, list);
    });

    return Array.from(byStaff.entries()).map(([name, staffAssignments]) => {
      const assignedSareeIds = staffAssignments.map(a => a.sareeId);
      const staffReturns = returns.filter(r => assignedSareeIds.includes(r.sareeId));
      const returnedSareeIds = staffReturns.map(r => r.sareeId);
      const perfect = staffReturns.filter(r => r.condition === "perfect").length;
      const damaged = staffReturns.filter(r => r.condition === "damaged").length;
      const lastAssignmentDate = staffAssignments
        .map(a => a.assignedDate)
        .sort((a, b) => parseDMYDate(b) - parseDMYDate(a))[0] ?? "—";

      return { name, assignedSareeIds, returnedSareeIds, perfect, damaged, lastAssignmentDate };
    }).sort((a, b) => parseDMYDate(b.lastAssignmentDate) - parseDMYDate(a.lastAssignmentDate));
  }, [assignments, returns]);

  const TD: CSSProperties = { fontFamily: F.u, fontSize: 12, color: C.text, padding: "10px 10px", verticalAlign: "middle" as const };

  const staffColumns: ColumnDef<StaffTrackingRow>[] = [
    { id: "name", header: "Finishing Staff", accessor: r => r.name, cell: (_v, r) => <span style={{ ...TD, fontWeight: 600, padding: 0 }}>{r.name}</span> },
    { id: "assigned", header: "Assigned", accessor: r => r.assignedSareeIds.length },
    { id: "returned", header: "Returned", accessor: r => r.returnedSareeIds.length },
    {
      id: "pending", header: "Pending Return", accessor: r => r.assignedSareeIds.length - r.returnedSareeIds.length,
      cell: (_v, r) => {
        const pending = r.assignedSareeIds.length - r.returnedSareeIds.length;
        return <span style={{ color: pending > 0 ? "#B85C00" : C.text, fontWeight: pending > 0 ? 700 : 400 }}>{pending}</span>;
      },
    },
    { id: "perfect", header: "Perfect", accessor: r => r.perfect, cell: v => <span style={{ color: C.green, fontWeight: 600 }}>{v as number}</span> },
    {
      id: "damaged", header: "Damaged", accessor: r => r.damaged,
      cell: (v, r) => <span style={{ color: r.damaged > 0 ? C.crim : C.text, fontWeight: r.damaged > 0 ? 700 : 400 }}>{v as number}</span>,
    },
    { id: "last", header: "Last Assignment", accessor: r => r.lastAssignmentDate, cell: v => <span style={{ fontFamily: F.m, fontSize: 12 }}>{v as string}</span> },
    {
      id: "expand", header: "", align: "end", accessor: () => null,
      cell: (_v, r) => (
        <Button variant="link" onClick={() => setExpanded(expanded === r.name ? null : r.name)}
          className="p-0 text-xs font-semibold text-[#6E0F2D] whitespace-nowrap">
          View Details <ChevronDown size={12} style={{ transform: expanded === r.name ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        </Button>
      ),
    },
  ];

  const assignmentColumns: ColumnDef<FinishingAssignment>[] = [
    { id: "sareeId", header: "Saree ID", accessor: a => a.sareeId, cell: v => <span style={{ fontFamily: F.m, fontSize: 12, color: C.burg, fontWeight: 600 }}>{v as string}</span> },
    {
      id: "quotation", header: "Quotation", accessor: a => a.quotationRef,
      cell: v => v ? (
        <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "#8B6018", background: "rgba(200,146,58,0.14)", borderRadius: 999, padding: "2px 8px" }}>{v as string}</span>
      ) : <span style={{ color: C.muted, fontSize: 12 }}>—</span>,
    },
    { id: "assignedDate", header: "Assigned Date", accessor: a => a.assignedDate, cell: v => <span style={{ fontFamily: F.m, fontSize: 12 }}>{v as string}</span> },
    {
      id: "returnedDate", header: "Returned Date", accessor: a => returns.find(rt => rt.sareeId === a.sareeId)?.receivedDate,
      cell: v => <span style={{ fontFamily: F.m, fontSize: 12 }}>{(v as string) ?? "—"}</span>,
    },
    {
      id: "condition", header: "Condition", accessor: a => returns.find(rt => rt.sareeId === a.sareeId)?.condition,
      cell: (_v, a) => {
        const ret = returns.find(rt => rt.sareeId === a.sareeId);
        return !ret ? (
          <span style={{ fontFamily: F.u, fontSize: 12, color: "#B85C00", fontWeight: 600 }}>Awaiting Return</span>
        ) : ret.condition === "perfect" ? (
          <span style={{ fontFamily: F.u, fontSize: 12, color: C.green, fontWeight: 600 }}>Perfect ✓</span>
        ) : (
          <span style={{ fontFamily: F.u, fontSize: 12, color: C.crim, fontWeight: 600 }}>Damaged ⚠</span>
        );
      },
    },
    {
      id: "photo", header: "Photo", accessor: a => returns.find(rt => rt.sareeId === a.sareeId)?.damagePhotoUrl,
      cell: v => v ? (
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#F0E8D0,#C0392B)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Camera size={12} color="rgba(255,255,255,0.85)" />
        </div>
      ) : (
        <span style={{ color: C.muted, fontSize: 12 }}>—</span>
      ),
    },
  ];

  return (
    <SectionCard
      icon={Users}
      title="Assignment History & Tracking"
      subtitle="Every finishing staff member, what they hold and what they have returned."
      actions={
        <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFFDF9", background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.20)", padding: "5px 12px", borderRadius: 999 }}>
          {rows.length} staff
        </span>
      }
    >

      {rows.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center", fontFamily: F.u, fontSize: 13, color: C.muted }}>
          No finishing staff assignments yet.
        </div>
      ) : isMobile ? (
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
          {rows.map(r => {
            const pending = r.assignedSareeIds.length - r.returnedSareeIds.length;
            const isOpen = expanded === r.name;
            return (
              <div key={r.name} style={{ border: `1px solid rgba(110,15,45,0.10)`, borderRadius: 12, overflow: "hidden", background: "#FFF" }}>
                <div onClick={() => setExpanded(isOpen ? null : r.name)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setExpanded(isOpen ? null : r.name))?.(); } }} style={{ padding: "12px 14px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 700, color: C.text }}>{r.name}</span>
                    <ChevronDown size={14} color={C.muted} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                  </div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Assigned</div>
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: C.text }}>{r.assignedSareeIds.length}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Returned</div>
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: C.text }}>{r.returnedSareeIds.length}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Pending</div>
                      <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 14, color: pending > 0 ? "#B85C00" : C.text, background: pending > 0 ? "rgba(184,92,0,0.10)" : "transparent", borderRadius: 999, padding: pending > 0 ? "1px 8px" : 0 }}>{pending}</span>
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ borderTop: `1px solid rgba(110,15,45,0.08)`, background: "rgba(110,15,45,0.02)", padding: "10px 14px 14px", display: "flex", flexDirection: "column" as const, gap: 8 }}>
                    {assignments.filter(a => a.finishingStaffName === r.name).map(a => {
                      const ret = returns.find(rt => rt.sareeId === a.sareeId);
                      return (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, borderBottom: `1px solid rgba(110,15,45,0.06)`, paddingBottom: 8 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontFamily: F.m, fontSize: 12, color: C.burg, fontWeight: 600 }}>{a.sareeId}</span>
                              {a.quotationRef && (
                                <span style={{ fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "#8B6018", background: "rgba(200,146,58,0.14)", borderRadius: 999, padding: "1px 6px" }}>{a.quotationRef}</span>
                              )}
                            </div>
                            <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, marginTop: 2 }}>{a.assignedDate}{ret?.receivedDate ? ` → ${ret.receivedDate}` : ""}</div>
                          </div>
                          {!ret ? (
                            <span style={{ fontFamily: F.u, fontSize: 12, color: "#B85C00", fontWeight: 600, flexShrink: 0 }}>Awaiting Return</span>
                          ) : ret.condition === "perfect" ? (
                            <span style={{ fontFamily: F.u, fontSize: 12, color: C.green, fontWeight: 600, flexShrink: 0 }}>Perfect ✓</span>
                          ) : (
                            <span style={{ fontFamily: F.u, fontSize: 12, color: C.crim, fontWeight: 600, flexShrink: 0 }}>Damaged ⚠</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ border: `1px solid rgba(110,15,45,0.10)`, borderRadius: 10, overflow: "hidden" }}>
          <DataTable
            columns={staffColumns}
            data={rows}
            getRowId={r => r.name}
            expandedIds={expanded ? new Set([expanded]) : undefined}
            renderExpandedRow={r => (
              <div style={{ padding: "10px 14px 14px", background: "rgba(110,15,45,0.02)" }}>
                <DataTable
                  columns={assignmentColumns}
                  data={assignments.filter(a => a.finishingStaffName === r.name)}
                  getRowId={a => a.id}
                />
              </div>
            )}
          />
        </div>
      )}
    </SectionCard>
  );
}
