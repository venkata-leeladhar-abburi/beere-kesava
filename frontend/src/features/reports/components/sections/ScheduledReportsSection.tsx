import React, { useState } from "react";
import { motion } from "motion/react";
import { Users, Scissors, BarChart3, BellRing, UsersRound, Plus, Pencil, Pause, Play, X } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp, SectionHeader } from "../common/primitives";

const SCHEDULES = [
  { title: "Monthly Weaver Payment Report", freq: "Every Month",  sendOn: "1st of every month · 9:00 AM",  to: "All Admin WhatsApp", format: ["PDF", "Excel"], lastSent: "01 May 2026 · 9:02 AM", active: true  },
  { title: "Weekly Production Summary",     freq: "Every Monday", sendOn: "Every Monday · 8:00 AM",       to: "All Admin WhatsApp", format: ["PDF"],          lastSent: "19 May 2026 · 8:01 AM", active: true  },
  { title: "Monthly Profit & Loss Report",  freq: "Every Month",  sendOn: "1st of every month · 10:00 AM", to: "All Admin WhatsApp", format: ["PDF"],          lastSent: "01 May 2026 · 10:02 AM",active: true  },
  { title: "Daily Overdue Alerts",          freq: "Every Day",    sendOn: "Every day · 8:30 AM",          to: "All Admin WhatsApp", format: ["PDF"],          lastSent: "Today · 8:30 AM",       active: true  },
  { title: "Monthly Customer Dues Report",  freq: "Every Month",  sendOn: "2nd of every month · 9:00 AM", to: "All Admin WhatsApp", format: ["PDF", "Excel"], lastSent: "02 May 2026 · 9:03 AM", active: true  },
];

export function ScheduledReportsSection() {
  const [showForm, setShowForm] = useState(false);
  const [scheduleStates, setScheduleStates] = useState(SCHEDULES.map(s => s.active));

  const scheduleIcons: React.ReactNode[] = [
    <Users key="users" size={26} color={T.antiqueGold} />,
    <Scissors key="scissors" size={26} color={T.antiqueGold} />,
    <BarChart3 key="bar-chart" size={26} color={T.antiqueGold} />,
    <BellRing key="bell-ring" size={26} color={T.antiqueGold} />,
    <UsersRound key="users-round" size={26} color={T.antiqueGold} />,
  ];

  return (
    <div style={{ padding: "36px 40px 0" }}>
      <FadeUp>
        <SectionHeader
          title="Scheduled Reports — Automatic Delivery"
          action={
            <button onClick={() => setShowForm(!showForm)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "transparent", border: `1px solid ${T.borderGold}`, borderRadius: 8, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.antiqueGold, cursor: "pointer" }}>
              <Plus size={14} />Add New Schedule →
            </button>
          }
        />
        <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: "4px 0 22px 13px" }}>
          These reports are automatically generated and sent to admin on WhatsApp at the scheduled time. No manual action needed.
        </p>

        {/* Schedule cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginBottom: 20, alignItems: "stretch" }}>
          {SCHEDULES.map((s, i) => (
            <div key={s.title} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.07)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* Top color bar */}
              <div style={{ height: 5, background: scheduleStates[i] ? T.green : T.taupe }} />

              {/* Card content */}
              <div style={{ padding: "20px 22px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Header: icon + title */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.12)" }}>
                    {scheduleIcons[i]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.3, marginBottom: 7 }}>{s.title}</div>
                    <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 99, background: "rgba(200,155,71,0.13)", color: T.antiqueGold, fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.4px" }}>{s.freq}</span>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
                    <span style={{ fontWeight: 700, color: T.luxuryBrown }}>Send on: </span>{s.sendOn}
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
                    <span style={{ fontWeight: 700, color: T.luxuryBrown }}>Send to: </span>{s.to}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                    {s.format.map(f => (
                      <span key={f} style={{ padding: "3px 11px", borderRadius: 6, background: "rgba(110,15,45,0.07)", color: T.royalBurgundy, fontFamily: F.mono, fontSize: 12, fontWeight: 700 }}>{f}</span>
                    ))}
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                    <span style={{ fontWeight: 700, color: T.luxuryBrown }}>Last sent: </span>{s.lastSent}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: scheduleStates[i] ? T.green : T.taupe }} />
                    <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: scheduleStates[i] ? T.green : T.taupe }}>{scheduleStates[i] ? "Active" : "Paused"}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ padding: "0 22px 20px", display: "flex", gap: 8 }}>
                <button style={{ flex: 1, height: 42, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1px solid ${T.borderDef}`, borderRadius: 9, background: "#fff", fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>
                  <Pencil size={14} />Edit
                </button>
                <button onClick={() => setScheduleStates(prev => prev.map((v, j) => j === i ? !v : v))}
                  style={{ flex: 1, height: 42, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: `1px solid ${scheduleStates[i] ? "rgba(200,155,71,0.35)" : T.borderDef}`, borderRadius: 9, background: scheduleStates[i] ? "rgba(200,155,71,0.08)" : "#fff", fontFamily: F.ui, fontSize: 13.5, fontWeight: 600, color: scheduleStates[i] ? T.antiqueGold : T.taupe, cursor: "pointer" }}>
                  {scheduleStates[i] ? <><Pause size={14} />Pause</> : <><Play size={14} />Resume</>}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Schedule form (collapsible) */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "24px 28px", marginBottom: 20, boxShadow: "0 4px 16px rgba(74,6,27,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown }}>Add New Schedule</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={18} color={T.taupe} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
              {[
                { label: "Select Report Type", type: "select", opts: ["Raw Material Report","Saree Production Report","Weaver Payment Report","Retail Sales Report","Wholesale Sales Report","Profit & Loss Report","Customer Report","Overdue & Alerts Report"] },
                { label: "Frequency",          type: "select", opts: ["Daily","Weekly","Monthly","Quarterly"] },
                { label: "Send On",            type: "select", opts: ["1st of month","2nd of month","Every Monday","Every week-start","Every day"] },
                { label: "Send Time",          type: "time" },
                { label: "Format",             type: "checks" },
                { label: "Period to Include",  type: "select", opts: ["Last 7 days","Last 30 days","This month","This quarter"] },
              ].map((f: any) => (
                <div key={f.label}>
                  <label style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>{f.label}</label>
                  {f.type === "select" ? (
                    <select style={{ width: "100%", height: 36, padding: "0 10px", border: `1px solid ${T.borderDef}`, borderRadius: 7, fontFamily: F.ui, fontSize: 12.5, color: T.luxuryBrown, background: T.warmIvory, outline: "none" }}>
                      {f.opts.map((o: string) => <option key={o}>{o}</option>)}
                    </select>
                  ) : f.type === "time" ? (
                    <input type="time" defaultValue="09:00" style={{ width: "100%", height: 36, padding: "0 10px", border: `1px solid ${T.borderDef}`, borderRadius: 7, fontFamily: F.mono, fontSize: 12.5, color: T.luxuryBrown, background: T.warmIvory, outline: "none" }} />
                  ) : (
                    <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                      {["PDF","Excel"].map(fmt => (
                        <label key={fmt} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, cursor: "pointer" }}>
                          <input type="checkbox" defaultChecked style={{ accentColor: T.royalBurgundy }} />{fmt}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, borderTop: `1px solid ${T.borderDef}`, paddingTop: 16 }}>
              <button onClick={() => setShowForm(false)} style={{ padding: "8px 18px", border: `1px solid ${T.borderDef}`, borderRadius: 8, background: "#fff", fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: T.taupe, cursor: "pointer" }}>Cancel</button>
              <button style={{ padding: "8px 20px", background: T.royalBurgundy, border: "none", borderRadius: 8, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: "#FFFDF9", cursor: "pointer" }}>💾 Save Schedule</button>
            </div>
          </motion.div>
        )}
      </FadeUp>
    </div>
  );
}

