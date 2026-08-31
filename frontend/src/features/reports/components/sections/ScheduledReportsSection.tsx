import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Users,
  Scissors,
  BarChart3,
  BellRing,
  UsersRound,
  Plus,
  Pause,
  Play,
  Trash2,
  X,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  Clock,
  MessageCircle,
} from "lucide-react";
import { T, F } from "../theme";
import { FadeUp, SectionCard } from "../common/primitives";
import { Button, IconButton, Select, SelectItem, Input } from "../../../../shared/ui/primitives";

// Wired to real backend: GET/POST /reports/schedules, PATCH/DELETE /reports/schedules/:id,
// GET /reports/schedules/preview.
//
// Delivery is WhatsApp-only. Each schedule carries its own recipient number —
// prefilled with the signed-in admin's mobile and editable — and
// ReportSchedulerService pushes the generated .xlsx to exactly that number
// through AiSensy's `bk_report_share_` template at the schedule's chosen IST
// time. Every date shown here comes from the backend's own occurrence maths
// (report-schedule-timing.ts), never recomputed in the browser, so what the
// admin reads is what the scheduler will do.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reportsApi, type ReportFrequency, type ScheduledReportItem } from "../../../../shared/api/reports";
import { useAuth } from "../../../../contexts/AuthContext";
import { useConfirm } from "../../../../shared/ui/overlay";
import { patchEnvelopeItems, prependToEnvelope, removeFromEnvelopeWhere } from "../../../../lib/cacheUpdates";

const REPORT_TYPES = [
  "Raw Material Report",
  "Saree Production Report",
  "Weaver Payment Report",
  "Retail Sales Report",
  "Wholesale Sales Report",
  "Profit & Loss Report",
  "Customer Report",
  "Overdue & Alerts Report",
];

const FREQUENCY_OPTIONS: { value: ReportFrequency; label: string; hint: string }[] = [
  { value: "DAILY", label: "Daily", hint: "Every day" },
  { value: "WEEKLY", label: "Weekly", hint: "Same weekday, every week" },
  { value: "MONTHLY", label: "Monthly", hint: "Same date, every month" },
  { value: "QUARTERLY", label: "Quarterly", hint: "Same date, every 3 months" },
];

const FREQUENCY_LABEL: Record<ReportFrequency, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
};

/** Everything the loom office runs on is IST — pin it rather than trusting the browser's zone. */
const IST = "Asia/Kolkata";

/** "Mon, 07 Sep 2026" */
function formatRunDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** "09:00 AM" */
function formatRunTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    timeZone: IST,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** "in 3 days" / "tomorrow" / "today" — the bit an admin actually scans for. */
function relativeToNow(iso: string): string {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 30) return `in ${days} days`;
  const months = Math.round(days / 30);
  return months === 1 ? "in about a month" : `in about ${months} months`;
}

/** 9876543210 → "98765 43210". Display only; the API always gets bare digits. */
function prettyPhone(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : (value ?? "—");
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "").slice(-10);
}

function isValidPhone(value: string): boolean {
  return /^[6-9]\d{9}$/.test(digitsOnly(value));
}

/** "09:00" → "09:00 AM", for the summary line under the form. */
function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const suffix = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}

const SCHEDULES_KEY = ["reports-schedules-list"] as const;

export function ScheduledReportsSection() {
  const [showForm, setShowForm] = useState(false);
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [frequency, setFrequency] = useState<ReportFrequency>("DAILY");
  const [deliveryTime, setDeliveryTime] = useState("09:00");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const confirm = useConfirm();

  const myNumber = digitsOnly(user?.mobile ?? "");

  // The signed-in admin's own number is the default recipient — they are who
  // these reports are for. Re-applied each time the form opens so a cancelled
  // edit never leaves a stale number behind, but never while it is open, which
  // would fight the admin mid-typing.
  useEffect(() => {
    if (showForm) {
      setRecipientPhone(myNumber);
      setPhoneTouched(false);
    }
  }, [showForm, myNumber]);

  const { data: schedRes, isLoading, isError } = useQuery({
    queryKey: SCHEDULES_KEY,
    queryFn: () => reportsApi.listSchedules(),
  });
  const schedules = schedRes?.items ?? [];

  // Live "you'll receive it on…" dates for the schedule being composed.
  const { data: previewRes, isFetching: previewLoading } = useQuery({
    queryKey: ["reports-schedule-preview", frequency, deliveryTime],
    queryFn: () => reportsApi.previewSchedule(frequency, deliveryTime, 5),
    enabled: showForm,
    staleTime: 60_000,
  });
  const previewRuns = previewRes?.runs ?? [];

  const phoneValid = isValidPhone(recipientPhone);
  const showPhoneError = phoneTouched && recipientPhone.length > 0 && !phoneValid;
  const usingOwnNumber = myNumber.length === 10 && digitsOnly(recipientPhone) === myNumber;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: SCHEDULES_KEY });

  const createMutation = useMutation({
    mutationFn: () =>
      reportsApi.createSchedule({
        reportName: reportType,
        frequency,
        recipientPhone: digitsOnly(recipientPhone),
        deliveryTime,
        actorId: user?.id,
      }),
    onSuccess: (created) => {
      // GET /reports/schedules returns exactly what POST does, so the new
      // schedule can be listed straight from the response.
      // Guarded because the code below treats the response as possibly absent
      // (`created?.nextRunAt`) — seeding an undefined row would be worse than
      // waiting for the refetch.
      if (created) prependToEnvelope<ScheduledReportItem>(queryClient, SCHEDULES_KEY, [created]);
      invalidate();
      setShowForm(false);
      const next = created?.nextRunAt;
      toast.success(
        next
          ? `Schedule created — first delivery ${formatRunDate(next)} at ${formatRunTime(next)}`
          : "Report schedule created",
      );
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to create report schedule");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (vars: { id: string; active: boolean }) =>
      reportsApi.updateSchedule(vars.id, { active: vars.active, actorId: user?.id }),
    onSuccess: (updated) => {
      if (updated) {
        patchEnvelopeItems<ScheduledReportItem>(queryClient, SCHEDULES_KEY, r => r.id === updated.id, updated);
      }
      invalidate();
      toast.success(
        updated?.active
          ? updated.nextRunAt
            ? `Resumed — next delivery ${formatRunDate(updated.nextRunAt)}`
            : "Schedule resumed"
          : "Schedule paused — no reports will be sent until you resume it",
      );
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to update report schedule");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportsApi.deleteSchedule(id),
    onSuccess: (_result, id) => {
      removeFromEnvelopeWhere<ScheduledReportItem>(queryClient, SCHEDULES_KEY, r => r.id === id);
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

  const frequencyHint = useMemo(
    () => FREQUENCY_OPTIONS.find((o) => o.value === frequency)?.hint ?? "",
    [frequency],
  );

  return (
    <div id="rep-scheduled" className="px-4 md:px-7 xl:px-10" style={{ paddingTop: 36, paddingBottom: 16 }}>
      <FadeUp>
      <SectionCard
        icon={CalendarClock}
        title="Scheduled Reports — Automatic Delivery"
        subtitle="Each report is generated on its own and sent as a WhatsApp spreadsheet to the number you choose, at the day and time you set. No manual action needed."
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
              <ScheduleCard
                key={s.id}
                schedule={s}
                icon={scheduleIcons[i % scheduleIcons.length]}
                myNumber={myNumber}
                expanded={expandedId === s.id}
                onToggleExpand={() => setExpandedId(expandedId === s.id ? null : s.id)}
                onToggleActive={() => toggleMutation.mutate({ id: s.id, active: !s.active })}
                toggleDisabled={toggleMutation.isPending}
                deleteDisabled={deleteMutation.isPending}
                onDelete={async () => {
                  const confirmed = await confirm({
                    title: `Delete scheduled report "${s.reportName}"?`,
                    description: "This stops future deliveries of this report. You can set up a new schedule again later.",
                    confirmLabel: "Delete",
                  });
                  if (confirmed) deleteMutation.mutate(s.id);
                }}
              />
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4" style={{ gap: 18 }}>
              <div>
                <FieldLabel>Select Report Type</FieldLabel>
                <Select size="sm" value={reportType} onValueChange={setReportType}>
                  {REPORT_TYPES.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </Select>
              </div>

              <div>
                <FieldLabel>Frequency</FieldLabel>
                <Select size="sm" value={frequency} onValueChange={(v: string) => setFrequency(v as ReportFrequency)}>
                  {FREQUENCY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </Select>
                <FieldHint>{frequencyHint}</FieldHint>
              </div>

              <div>
                <FieldLabel>Delivery Time (IST)</FieldLabel>
                <Input
                  size="sm"
                  type="time"
                  value={deliveryTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeliveryTime(e.target.value || "09:00")}
                />
                <FieldHint>The report lands within 15 minutes of this time.</FieldHint>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                  <FieldLabel>Recipient WhatsApp Number</FieldLabel>
                  {!usingOwnNumber && myNumber.length === 10 && (
                    <button
                      type="button"
                      onClick={() => { setRecipientPhone(myNumber); setPhoneTouched(false); }}
                      style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, color: T.antiqueGold, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 6 }}
                    >
                      Use my number
                    </button>
                  )}
                </div>
                <Input
                  size="sm"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  addonLeft="+91"
                  placeholder="98765 43210"
                  invalid={showPhoneError}
                  value={recipientPhone}
                  onBlur={() => setPhoneTouched(true)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setRecipientPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setPhoneTouched(true);
                  }}
                />
                {showPhoneError ? (
                  <FieldHint tone="error">Enter a valid 10-digit mobile number.</FieldHint>
                ) : usingOwnNumber ? (
                  <FieldHint>Your own number — change it to send to someone else.</FieldHint>
                ) : (
                  <FieldHint>This number receives the spreadsheet on WhatsApp.</FieldHint>
                )}
              </div>
            </div>

            {/* Live delivery preview — the dates this schedule will actually fire on */}
            <div style={{ marginTop: 20, background: "rgba(200,155,71,0.07)", border: `1px solid rgba(200,155,71,0.28)`, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <CalendarDays size={16} color={T.antiqueGold} />
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: T.luxuryBrown }}>
                  Upcoming deliveries
                </span>
                <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                  · {FREQUENCY_LABEL[frequency]} at {formatClock(deliveryTime)}
                </span>
              </div>

              {previewLoading && previewRuns.length === 0 ? (
                <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>Working out the dates…</div>
              ) : previewRuns.length === 0 ? (
                <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                  Dates will appear once a frequency and time are selected.
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {previewRuns.map((run, idx) => (
                    <span
                      key={run}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "6px 12px", borderRadius: 99,
                        background: idx === 0 ? T.royalBurgundy : "#FFFFFF",
                        color: idx === 0 ? "#FFFDF9" : T.luxuryBrown,
                        border: `1px solid ${idx === 0 ? T.royalBurgundy : T.borderDef}`,
                        fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700,
                      }}
                    >
                      {formatRunDate(run)}
                      <span style={{ opacity: 0.7, fontWeight: 600 }}>· {formatRunTime(run)}</span>
                      {idx === 0 && <span style={{ opacity: 0.85, fontWeight: 600 }}>({relativeToNow(run)})</span>}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12, fontFamily: F.ui, fontSize: 12.5, color: T.taupe }}>
                <MessageCircle size={14} color={T.green} />
                <span>
                  Sent on WhatsApp to{" "}
                  <strong style={{ color: T.luxuryBrown }}>
                    +91 {prettyPhone(recipientPhone)}
                  </strong>
                  {usingOwnNumber ? " (you)" : ""}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, borderTop: `1px solid ${T.borderDef}`, paddingTop: 16 }}>
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
                disabled={createMutation.isPending || !phoneValid}
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.luxuryBrown, display: "block", marginBottom: 6 }}>
      {children}
    </span>
  );
}

function FieldHint({ children, tone }: { children: React.ReactNode; tone?: "error" }) {
  return (
    <span style={{ display: "block", marginTop: 6, fontFamily: F.ui, fontSize: 11.5, color: tone === "error" ? T.royalBurgundy : T.taupe }}>
      {children}
    </span>
  );
}

function ScheduleCard({
  schedule: s,
  icon,
  myNumber,
  expanded,
  onToggleExpand,
  onToggleActive,
  toggleDisabled,
  onDelete,
  deleteDisabled,
}: {
  schedule: ScheduledReportItem;
  icon: React.ReactNode;
  myNumber: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleActive: () => void;
  toggleDisabled: boolean;
  onDelete: () => void;
  deleteDisabled: boolean;
}) {
  const upcoming = s.upcomingRuns ?? [];
  const nextRun = upcoming[0] ?? s.nextRunAt ?? null;
  // Pre-WhatsApp rows carry only an email; show whatever the row actually has
  // rather than an empty "Send to:".
  const destination = s.recipientPhone
    ? `+91 ${prettyPhone(s.recipientPhone)}${digitsOnly(s.recipientPhone) === myNumber ? " (you)" : ""}`
    : (s.recipientEmail ?? "—");

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, boxShadow: "0 2px 14px rgba(74,6,27,0.07)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Top color bar — Royal Burgundy Brown */}
      <div style={{ height: 5, background: s.active ? T.royalBurgundy : T.taupe }} />

      <div style={{ padding: "20px 22px", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Header: icon + title */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 52, height: 52, minWidth: 52, borderRadius: 14, background: "rgba(200,155,71,0.10)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(200,155,71,0.12)" }}>
            {icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 700, color: T.luxuryBrown, lineHeight: 1.3, marginBottom: 7 }}>{s.reportName}</div>
            <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 99, background: "rgba(200,155,71,0.13)", color: T.antiqueGold, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "0.4px" }}>
              {FREQUENCY_LABEL[s.frequency] ?? s.frequency}
              {" · "}
              {formatClock(`${String(s.deliveryHour).padStart(2, "0")}:${String(s.deliveryMinute).padStart(2, "0")}`)}
            </span>
          </div>
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
            <MessageCircle size={14} color={T.green} />
            <span><span style={{ fontWeight: 700, color: T.luxuryBrown }}>Send to: </span>{destination}</span>
          </div>

          {/* Next delivery — the single most useful line on the card */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
            <Clock size={14} color={T.antiqueGold} />
            {s.active && nextRun ? (
              <span>
                <span style={{ fontWeight: 700, color: T.luxuryBrown }}>Next: </span>
                {formatRunDate(nextRun)}, {formatRunTime(nextRun)}{" "}
                <span style={{ color: T.antiqueGold, fontWeight: 700 }}>({relativeToNow(nextRun)})</span>
              </span>
            ) : (
              <span><span style={{ fontWeight: 700, color: T.luxuryBrown }}>Next: </span>paused — no deliveries scheduled</span>
            )}
          </div>

          {s.lastRunAt && (
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
              Last sent {formatRunDate(s.lastRunAt)}, {formatRunTime(s.lastRunAt)}
            </div>
          )}

          {/* Collapsed by default: three cards side by side stay scannable, and
              the full date list is one click away for whoever needs it. */}
          {upcoming.length > 1 && (
            <div>
              <button
                type="button"
                onClick={onToggleExpand}
                aria-expanded={expanded}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: T.royalBurgundy }}
              >
                <CalendarDays size={14} />
                {expanded ? "Hide upcoming dates" : `See next ${upcoming.length} delivery dates`}
                <ChevronDown size={14} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>

              {expanded && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  style={{ overflow: "hidden", listStyle: "none", margin: "10px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {upcoming.map((run, idx) => (
                    <li
                      key={run}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 10px", borderRadius: 8, background: idx === 0 ? "rgba(110,15,45,0.06)" : "rgba(0,0,0,0.02)", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700, color: T.luxuryBrown }}
                    >
                      <span>{formatRunDate(run)}</span>
                      <span style={{ color: T.taupe, fontWeight: 600 }}>{formatRunTime(run)}</span>
                    </li>
                  ))}
                </motion.ul>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const, alignItems: "center" }}>
            <span style={{ padding: "3px 11px", borderRadius: 6, background: "rgba(110,15,45,0.07)", color: T.royalBurgundy, fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{s.format}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.active ? T.green : T.taupe }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: s.active ? T.green : T.taupe }}>{s.active ? "Active" : "Paused"}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 8, borderTop: `1px solid ${T.borderDef}` }}>
          <IconButton
            variant="ghost"
            size="sm"
            icon={s.active ? Pause : Play}
            label={s.active ? "Pause" : "Resume"}
            disabled={toggleDisabled}
            onClick={onToggleActive}
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={Trash2}
            label="Delete"
            disabled={deleteDisabled}
            onClick={onDelete}
          />
        </div>
      </div>
    </div>
  );
}
