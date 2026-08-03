import React, { useState, useMemo } from "react";
import { Users, ChevronDown, Camera } from "lucide-react";
import { C, F, card } from "../tokens";
import { useFinishing, FinishingAssignment } from "../../../../finishing/contexts/FinishingContext";
import { SectionHeader } from "./shared";

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

  const TH: React.CSSProperties = { fontFamily: F.u, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase" as const, letterSpacing: "0.05em", textAlign: "left" as const, padding: "9px 10px", whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { fontFamily: F.u, fontSize: 12.5, color: C.text, padding: "10px 10px", verticalAlign: "middle" as const };

  return (
    <div style={{ ...card, padding: 16, marginBottom: 16 }}>
      <SectionHeader
        icon={<Users size={18} color={C.burg} />}
        title="Assignment History & Tracking"
        count={rows.length}
        accent="rgba(107,26,42,0.09)"
      />

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
              <div key={r.name} style={{ border: `1px solid rgba(107,26,42,0.10)`, borderRadius: 12, overflow: "hidden", background: "#FFF" }}>
                <div onClick={() => setExpanded(isOpen ? null : r.name)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setExpanded(isOpen ? null : r.name))?.(); } }} style={{ padding: "12px 14px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 700, color: C.text }}>{r.name}</span>
                    <ChevronDown size={14} color={C.muted} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                  </div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>Assigned</div>
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 15, color: C.text }}>{r.assignedSareeIds.length}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>Returned</div>
                      <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 15, color: C.text }}>{r.returnedSareeIds.length}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>Pending</div>
                      <span style={{ fontFamily: F.d, fontWeight: 700, fontSize: 15, color: pending > 0 ? "#B85C00" : C.text, background: pending > 0 ? "rgba(184,92,0,0.10)" : "transparent", borderRadius: 999, padding: pending > 0 ? "1px 8px" : 0 }}>{pending}</span>
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <div style={{ borderTop: `1px solid rgba(107,26,42,0.08)`, background: "rgba(107,26,42,0.02)", padding: "10px 14px 14px", display: "flex", flexDirection: "column" as const, gap: 8 }}>
                    {assignments.filter(a => a.finishingStaffName === r.name).map(a => {
                      const ret = returns.find(rt => rt.sareeId === a.sareeId);
                      return (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, borderBottom: `1px solid rgba(107,26,42,0.06)`, paddingBottom: 8 }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontFamily: F.m, fontSize: 11.5, color: C.burg, fontWeight: 600 }}>{a.sareeId}</span>
                              {a.quotationRef && (
                                <span style={{ fontFamily: F.u, fontSize: 9.5, fontWeight: 700, color: "#8B6018", background: "rgba(200,146,58,0.14)", borderRadius: 999, padding: "1px 6px" }}>{a.quotationRef}</span>
                              )}
                            </div>
                            <div style={{ fontFamily: F.m, fontSize: 10, color: C.muted, marginTop: 2 }}>{a.assignedDate}{ret?.receivedDate ? ` → ${ret.receivedDate}` : ""}</div>
                          </div>
                          {!ret ? (
                            <span style={{ fontFamily: F.u, fontSize: 11, color: "#B85C00", fontWeight: 600, flexShrink: 0 }}>Awaiting Return</span>
                          ) : ret.condition === "perfect" ? (
                            <span style={{ fontFamily: F.u, fontSize: 11, color: C.green, fontWeight: 600, flexShrink: 0 }}>Perfect ✓</span>
                          ) : (
                            <span style={{ fontFamily: F.u, fontSize: 11, color: C.crim, fontWeight: 600, flexShrink: 0 }}>Damaged ⚠</span>
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
        <div style={{ border: `1px solid rgba(107,26,42,0.10)`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead>
                <tr style={{ background: "rgba(107,26,42,0.03)" }}>
                  <th style={TH}>Finishing Staff</th>
                  <th style={TH}>Assigned</th>
                  <th style={TH}>Returned</th>
                  <th style={TH}>Pending Return</th>
                  <th style={TH}>Perfect</th>
                  <th style={TH}>Damaged</th>
                  <th style={TH}>Last Assignment</th>
                  <th style={TH}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const pending = r.assignedSareeIds.length - r.returnedSareeIds.length;
                  return (
                    <React.Fragment key={r.name}>
                      <tr style={{ borderTop: i > 0 ? `1px solid rgba(107,26,42,0.07)` : "none", background: "#FFF" }}>
                        <td style={{ ...TD, fontWeight: 600 }}>{r.name}</td>
                        <td style={TD}>{r.assignedSareeIds.length}</td>
                        <td style={TD}>{r.returnedSareeIds.length}</td>
                        <td style={{ ...TD, color: pending > 0 ? "#B85C00" : C.text, fontWeight: pending > 0 ? 700 : 400 }}>{pending}</td>
                        <td style={{ ...TD, color: C.green, fontWeight: 600 }}>{r.perfect}</td>
                        <td style={{ ...TD, color: r.damaged > 0 ? C.crim : C.text, fontWeight: r.damaged > 0 ? 700 : 400 }}>{r.damaged}</td>
                        <td style={{ ...TD, fontFamily: F.m, fontSize: 11 }}>{r.lastAssignmentDate}</td>
                        <td style={TD}>
                          <button onClick={() => setExpanded(expanded === r.name ? null : r.name)}
                            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.burg, display: "flex", alignItems: "center", gap: 3, whiteSpace: "nowrap" as const }}>
                            View Details <ChevronDown size={12} style={{ transform: expanded === r.name ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                          </button>
                        </td>
                      </tr>
                      {expanded === r.name && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0, background: "rgba(107,26,42,0.02)" }}>
                            <div style={{ padding: "10px 14px 14px" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                  <tr>
                                    <th style={TH}>Saree ID</th>
                                    <th style={TH}>Quotation</th>
                                    <th style={TH}>Assigned Date</th>
                                    <th style={TH}>Returned Date</th>
                                    <th style={TH}>Condition</th>
                                    <th style={TH}>Photo</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {assignments.filter(a => a.finishingStaffName === r.name).map((a, ai) => {
                                    const ret = returns.find(rt => rt.sareeId === a.sareeId);
                                    return (
                                      <tr key={a.id} style={{ borderTop: ai > 0 ? `1px solid rgba(107,26,42,0.06)` : "none" }}>
                                        <td style={{ ...TD, fontFamily: F.m, fontSize: 11.5, color: C.burg, fontWeight: 600 }}>{a.sareeId}</td>
                                        <td style={TD}>
                                          {a.quotationRef ? (
                                            <span style={{ fontFamily: F.u, fontSize: 10.5, fontWeight: 700, color: "#8B6018", background: "rgba(200,146,58,0.14)", borderRadius: 999, padding: "2px 8px" }}>{a.quotationRef}</span>
                                          ) : <span style={{ color: C.muted, fontSize: 11 }}>—</span>}
                                        </td>
                                        <td style={{ ...TD, fontFamily: F.m, fontSize: 11 }}>{a.assignedDate}</td>
                                        <td style={{ ...TD, fontFamily: F.m, fontSize: 11 }}>{ret?.receivedDate ?? "—"}</td>
                                        <td style={TD}>
                                          {!ret ? (
                                            <span style={{ fontFamily: F.u, fontSize: 11, color: "#B85C00", fontWeight: 600 }}>Awaiting Return</span>
                                          ) : ret.condition === "perfect" ? (
                                            <span style={{ fontFamily: F.u, fontSize: 11, color: C.green, fontWeight: 600 }}>Perfect ✓</span>
                                          ) : (
                                            <span style={{ fontFamily: F.u, fontSize: 11, color: C.crim, fontWeight: 600 }}>Damaged ⚠</span>
                                          )}
                                        </td>
                                        <td style={TD}>
                                          {ret?.damagePhotoUrl ? (
                                            <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#F0E8D0,#C0392B)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                              <Camera size={12} color="rgba(255,255,255,0.85)" />
                                            </div>
                                          ) : (
                                            <span style={{ color: C.muted, fontSize: 11 }}>—</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
