import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Monitor, Smartphone, AlignLeft, Table2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { F, T } from "./tokens";
import { LOGIN_ENTRIES } from "./data";
import { PaginationBtn } from "./shared";
import { Button } from "../../../../shared/ui/primitives";

export function LoginHistorySection() {
  const [loginView, setLoginView] = useState<"timeline"|"table">("timeline");

  return (
    <div style={{ padding: "48px 56px 0" }}>
      {/* Section title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 4, alignSelf: "stretch", background: T.royalBurgundy, borderRadius: 2, minHeight: 24 }} />
        <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 18, color: T.luxuryBrown, flex: 1 }}>
          Login History — User Sessions
        </span>
        <Button variant="link" size="sm" className="text-[12px] text-[#C89B47] hover:text-[#C89B47]">
          Download Login Log →
        </Button>
      </div>
      <p style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, marginBottom: 24, marginTop: 0 }}>
        Every login, logout, and failed login attempt — with device, session duration, and status.
      </p>

      {/* View toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <Button
          variant={loginView === "timeline" ? "primary" : "secondary"}
          size="sm"
          iconLeft={AlignLeft}
          className="rounded-full"
          onClick={() => setLoginView("timeline")}
        >
          Timeline View
        </Button>
        <Button
          variant={loginView === "table" ? "primary" : "secondary"}
          size="sm"
          iconLeft={Table2}
          className="rounded-full"
          onClick={() => setLoginView("table")}
        >
          Table View
        </Button>
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
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: "#fff" }}>
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
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "2px 9px",
                          borderRadius: 999,
                        }}>
                          {entry.status === "login" ? "✓ Login" : entry.status === "logout" ? "→ Logout" : "✗ Failed Login"}
                        </span>
                        <span style={{ fontFamily: F.ui, fontWeight: 600, fontSize: 13, color: T.luxuryBrown }}>
                          {entry.user}
                        </span>
                        <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
                          {entry.role}
                        </span>
                      </div>
                      <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
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
                          <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{entry.duration}</span>
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
                  {LOGIN_ENTRIES.map((entry, i) => {
                    const sessionDisplay = entry.duration
                      ? entry.duration
                      : entry.status === "login"
                      ? <span style={{ color: T.antiqueGold, fontFamily: F.mono, fontSize: 12 }}>Ongoing</span>
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
                        <td style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, padding: "11px 14px", whiteSpace: "nowrap", borderBottom: `1px solid ${T.borderDef}` }}>
                          {entry.time}
                        </td>
                        <td style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, padding: "11px 14px", whiteSpace: "nowrap", borderBottom: `1px solid ${T.borderDef}` }}>
                          {entry.user}
                        </td>
                        <td style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, padding: "11px 14px", whiteSpace: "nowrap", borderBottom: `1px solid ${T.borderDef}` }}>
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
                            fontSize: 12,
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
                        <td style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, padding: "11px 14px", whiteSpace: "nowrap", borderBottom: `1px solid ${T.borderDef}` }}>
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
                            fontSize: 12,
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
                <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>
                  Showing 1–10 of 142 sessions · Rows per page: 20
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <PaginationBtn disabled><ChevronLeft size={13} /></PaginationBtn>
                  {[1, 2, 3].map(n => (
                    <PaginationBtn key={n} active={n === 1}>{n}</PaginationBtn>
                  ))}
                  <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, padding: "0 4px" }}>...</span>
                  <PaginationBtn>8</PaginationBtn>
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
