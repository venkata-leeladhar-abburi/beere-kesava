import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlignLeft, Table2, ChevronDown, ChevronLeft, ChevronRight,
} from "lucide-react";
import { F, T, ROLE_COLORS } from "./tokens";
import { ACTION_ENTRIES } from "./data";
import { PaginationBtn } from "./shared";

export function ActionLogSection() {
  const [actionView, setActionView] = useState<"timeline"|"table">("timeline");

  return (
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
                  <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: "#fff" }}>
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
                        fontSize: 12,
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
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
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
                      fontSize: 12,
                      color: T.royalBurgundy,
                    }}>
                      {entry.module}
                    </span>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy }}>
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
                        fontSize: 12,
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
                      <td style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, padding: "11px 14px", whiteSpace: "nowrap", borderBottom: `1px solid ${T.borderDef}` }}>
                        {entry.time}
                      </td>
                      <td style={{ padding: "11px 14px", borderBottom: `1px solid ${T.borderDef}` }}>
                        <span style={{
                          background: ROLE_COLORS[entry.role]?.badge,
                          color: ROLE_COLORS[entry.role]?.text,
                          fontFamily: F.mono,
                          fontSize: 12,
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
                          fontSize: 12,
                          color: T.royalBurgundy,
                          whiteSpace: "nowrap",
                        }}>
                          {entry.module}
                        </span>
                      </td>
                      <td style={{ fontFamily: F.ui, fontSize: 12, color: T.luxuryBrown, padding: "11px 14px", maxWidth: 300, borderBottom: `1px solid ${T.borderDef}` }}>
                        {entry.action}
                      </td>
                      <td style={{ fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, padding: "11px 14px", whiteSpace: "nowrap", borderBottom: `1px solid ${T.borderDef}` }}>
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
                <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
                  Showing 1–12 of 2,840 entries · Rows per page: 20
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <PaginationBtn disabled><ChevronLeft size={13} /></PaginationBtn>
                  {[1, 2, 3].map(n => (
                    <PaginationBtn key={n} active={n === 1}>{n}</PaginationBtn>
                  ))}
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, padding: "0 4px" }}>...</span>
                  <PaginationBtn>60</PaginationBtn>
                  <PaginationBtn><ChevronRight size={13} /></PaginationBtn>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
