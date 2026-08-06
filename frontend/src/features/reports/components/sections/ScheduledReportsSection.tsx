import React, { useState } from "react";
import { motion } from "motion/react";
import { Users, Scissors, BarChart3, BellRing, UsersRound, Plus, Pencil, Pause, Play, X } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp, SectionHeader } from "../common/primitives";
import { Button, IconButton, Select, SelectItem, Input, CheckboxField } from "../../../../shared/ui/primitives";

// MOCK: no backend module for scheduled/automated report delivery exists
// (no /reports/schedules endpoint, no cron/queue job for WhatsApp delivery).
// This whole section — cards, toggle state, and the "Add New Schedule" form
// — is local UI state with nothing persisted or actually scheduled server-side.
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "../../../../shared/api/reports";

export function ScheduledReportsSection() {
  const [showForm, setShowForm] = useState(false);

  const { data: schedRes } = useQuery({
    queryKey: ["reports-schedules-list"],
    queryFn: () => reportsApi.listSchedules(),
  });
  const schedules = schedRes?.items ?? [];

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
            <Button variant="secondary" size="sm" iconLeft={Plus} onClick={() => setShowForm(!showForm)}>
              Add New Schedule →
            </Button>
          }
        />
        <p style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, margin: "4px 0 22px 13px" }}>
          These reports are automatically generated and sent to admin on WhatsApp at the scheduled time. No manual action needed.
        </p>

        {/* Schedule cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginBottom: 20, alignItems: "stretch" }}>
          {schedules.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", padding: 32, textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe, background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}` }}>
              No automated report schedules configured yet. Click "Add New Schedule" to create one.
            </div>
          ) : (
            schedules.map((s, i) => (
              <div key={s.id} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.07)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Top color bar */}
                <div style={{ height: 5, background: s.active ? T.green : T.taupe }} />

                {/* Card content */}
                <div style={{ padding: "20px 22px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Header: icon + title */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.12)" }}>
                      {scheduleIcons[i % scheduleIcons.length]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.3, marginBottom: 7 }}>{s.reportName}</div>
                      <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 99, background: "rgba(200,155,71,0.13)", color: T.antiqueGold, fontFamily: F.mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.4px" }}>{s.frequency}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
                      <span style={{ fontWeight: 700, color: T.luxuryBrown }}>Send to: </span>{s.recipientEmail}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                      <span style={{ padding: "3px 11px", borderRadius: 6, background: "rgba(110,15,45,0.07)", color: T.royalBurgundy, fontFamily: F.mono, fontSize: 12, fontWeight: 700 }}>{s.format}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.active ? T.green : T.taupe }} />
                      <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700, color: s.active ? T.green : T.taupe }}>{s.active ? "Active" : "Paused"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Schedule form (collapsible) */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ background: "#FFFFFF", borderRadius: 14, border: `1px solid ${T.borderDef}`, padding: "24px 28px", marginBottom: 20, boxShadow: "0 4px 16px rgba(74,6,27,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontFamily: F.display, fontSize: 18, color: T.luxuryBrown }}>Add New Schedule</div>
              <IconButton variant="ghost" size="sm" icon={X} label="Close" onClick={() => setShowForm(false)} />
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
                    <Select size="sm" defaultValue={f.opts[0]}>
                      {f.opts.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </Select>
                  ) : f.type === "time" ? (
                    <Input type="time" size="sm" defaultValue="09:00" />
                  ) : (
                    <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
                      {["PDF","Excel"].map(fmt => (
                        <CheckboxField key={fmt} label={fmt} defaultChecked />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, borderTop: `1px solid ${T.borderDef}`, paddingTop: 16 }}>
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" size="sm">💾 Save Schedule</Button>
            </div>
          </motion.div>
        )}
      </FadeUp>
    </div>
  );
}

