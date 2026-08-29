import React, { useState } from "react";
import { motion } from "motion/react";
import { Users, Scissors, BarChart3, BellRing, UsersRound, Plus, Pause, Play, Trash2, X, CalendarClock } from "lucide-react";
import { T, F } from "../theme";
import { FadeUp, SectionCard } from "../common/primitives";
import { Button, IconButton, Select, SelectItem, Input } from "../../../../shared/ui/primitives";

// Wired to real backend: GET/POST /reports/schedules, PATCH/DELETE /reports/schedules/:id.
// ReportSchedulerService polls these rows every 15 minutes, generates the due
// ones as .xlsx and delivers them on WhatsApp through `bk_report_share_` to
// ADMIN_WHATSAPP_NUMBERS. Recipients are that env list, not this form's email
// field — the schedule row has no phone column of its own.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reportsApi } from "../../../../shared/api/reports";
import { useAuth } from "../../../../contexts/AuthContext";
import { useConfirm } from "../../../../shared/ui/overlay";

export function ScheduledReportsSection() {
  const [showForm, setShowForm] = useState(false);
  const [reportType, setReportType] = useState("Raw Material Report");
  const [frequency, setFrequency] = useState<"Daily" | "Weekly" | "Monthly" | "Quarterly">("Daily");
  const [recipientEmail, setRecipientEmail] = useState("");
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const confirm = useConfirm();

  const { data: schedRes, isLoading, isError } = useQuery({
    queryKey: ["reports-schedules-list"],
    queryFn: () => reportsApi.listSchedules(),
  });
  const schedules = schedRes?.items ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["reports-schedules-list"] });

  const createMutation = useMutation({
    mutationFn: () =>
      reportsApi.createSchedule({
        reportName: reportType,
        frequency: (frequency.toUpperCase() as "DAILY" | "WEEKLY" | "MONTHLY") || "DAILY",
        recipientEmail: recipientEmail || "admin@example.com",
        actorId: user?.id,
      }),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setRecipientEmail("");
      toast.success("Report schedule created");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to create report schedule");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (vars: { id: string; active: boolean }) =>
      reportsApi.updateSchedule(vars.id, { active: vars.active, actorId: user?.id }),
    onSuccess: invalidate,
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update report schedule");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportsApi.deleteSchedule(id),
    onSuccess: () => {
      invalidate();
      toast.success("Report schedule deleted");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete report schedule");
    },
  });

  const scheduleIcons: React.ReactNode[] = [
    <Users key="users" size={26} color={T.antiqueGold} />,
    <Scissors key="scissors" size={26} color={T.antiqueGold} />,
    <BarChart3 key="bar-chart" size={26} color={T.antiqueGold} />,
    <BellRing key="bell-ring" size={26} color={T.antiqueGold} />,
    <UsersRound key="users-round" size={26} color={T.antiqueGold} />,
  ];

  return (
    <div className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 36 }}>
      <FadeUp>
      <SectionCard
        icon={CalendarClock}
        title="Scheduled Reports — Automatic Delivery"
        subtitle="These reports are generated automatically and sent to the admin team on WhatsApp as a spreadsheet at the scheduled time. No manual action needed."
        actions={
          <Button
            variant="ghost"
            size="sm"
            iconLeft={Plus}
            onClick={() => setShowForm(!showForm)}
            className="bg-[rgba(255,255,255,0.14)] hover:bg-[rgba(255,255,255,0.25)] active:bg-[rgba(255,255,255,0.35)] text-[#FFFDF9] hover:text-[#FFFDF9] border border-[rgba(255,255,255,0.25)] rounded-[10px] font-bold shadow-sm transition-all"
          >
            Add New Schedule
          </Button>
        }
      >
        {/* Schedule cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 18, marginBottom: 20, alignItems: "stretch" }}>
          {isLoading ? (
            <div style={{ gridColumn: "1 / -1", padding: 32, textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe, background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}` }}>
              Loading scheduled reports…
            </div>
          ) : isError ? (
            <div style={{ gridColumn: "1 / -1", padding: 32, textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.royalBurgundy, background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}` }}>
              Failed to load scheduled reports.
            </div>
          ) : schedules.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", padding: 32, textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe, background: "#FFF", borderRadius: 16, border: `1px solid ${T.borderDef}` }}>
              No automated report schedules configured yet. Click "Add New Schedule" to create one.
            </div>
          ) : (
            schedules.map((s, i) => (
              <div key={s.id} style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.07)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Top color bar — Royal Burgundy Brown */}
                <div style={{ height: 5, background: T.royalBurgundy }} />

                {/* Card content */}
                <div style={{ padding: "20px 22px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Header: icon + title */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.12)" }}>
                      {scheduleIcons[i % scheduleIcons.length]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.3, marginBottom: 7 }}>{s.reportName}</div>
                      <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 99, background: "rgba(200,155,71,0.13)", color: T.antiqueGold, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "0.4px" }}>{s.frequency}</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
                      <span style={{ fontWeight: 700, color: T.luxuryBrown }}>Send to: </span>{s.recipientEmail}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                      <span style={{ padding: "3px 11px", borderRadius: 6, background: "rgba(110,15,45,0.07)", color: T.royalBurgundy, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{s.format}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.active ? T.green : T.taupe }} />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: s.active ? T.green : T.taupe }}>{s.active ? "Active" : "Paused"}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 8, borderTop: `1px solid ${T.borderDef}` }}>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={s.active ? Pause : Play}
                      label={s.active ? "Pause" : "Resume"}
                      disabled={toggleMutation.isPending}
                      onClick={() => toggleMutation.mutate({ id: s.id, active: !s.active })}
                    />
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      label="Delete"
                      disabled={deleteMutation.isPending}
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: `Delete scheduled report "${s.reportName}"?`,
                          description: "This stops future deliveries of this report. You can set up a new schedule again later.",
                          confirmLabel: "Delete",
                        });
                        if (confirmed) deleteMutation.mutate(s.id);
                      }}
                    />
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
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 18 }}>
              <div>
                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Select Report Type</span>
                <Select size="sm" value={reportType} onValueChange={setReportType}>
                  {["Raw Material Report","Saree Production Report","Weaver Payment Report","Retail Sales Report","Wholesale Sales Report","Profit & Loss Report","Customer Report","Overdue & Alerts Report"].map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </Select>
              </div>
              <div>
                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Frequency</span>
                <Select size="sm" value={frequency} onValueChange={(v: string) => setFrequency(v as "Daily" | "Weekly" | "Monthly" | "Quarterly")}>
                  {["Daily","Weekly","Monthly","Quarterly"].map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </Select>
              </div>
              <div>
                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>Recipient Email</span>
                <Input
                  size="sm"
                  type="email"
                  placeholder="admin@example.com"
                  value={recipientEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipientEmail(e.target.value)}
                />
              </div>
            </div>
            {createMutation.isError && (
              <div style={{ marginTop: 12, fontFamily: F.ui, fontSize: 13, color: T.royalBurgundy }}>
                Failed to save schedule. Please try again.
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, borderTop: `1px solid ${T.borderDef}`, paddingTop: 16 }}>
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                disabled={createMutation.isPending || !recipientEmail}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending ? "Saving…" : "💾 Save Schedule"}
              </Button>
            </div>
          </motion.div>
        )}
      </SectionCard>
      </FadeUp>
    </div>
  );
}

