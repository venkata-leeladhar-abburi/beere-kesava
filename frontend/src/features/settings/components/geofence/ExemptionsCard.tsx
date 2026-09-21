import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCheck } from "lucide-react";
import { toast } from "sonner";
import { F, T, SectionCard } from "../labelSettings/primitives";
import { FieldRow, Hint, PrimaryButton, QuietButton, StatusPill } from "./primitives";
import { geofenceApi } from "../../../../shared/api/geofence";
import { usersApi } from "../../../../shared/api/users";
import { LoadingState, ErrorState } from "../../../../shared/ui/state";
import { DatePicker } from "../../../../shared/ui/date";

/** Default expiry for a new exemption: a week out, at end of day. */
function defaultExpiry(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

/** The chosen day runs to its end, not to the instant it began. */
function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function ExemptionsCard() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(defaultExpiry);

  const { data: exemptions, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["geofence", "exemptions"],
    queryFn: () => geofenceApi.listExemptions(),
  });

  const { data: staff } = useQuery({
    queryKey: ["geofence", "exemptions", "staff"],
    queryFn: () => usersApi.list(),
  });

  // Admins are already unrestricted everywhere, so offering them an exemption
  // would be offering a no-op.
  const staffOptions = useMemo(
    () =>
      (staff?.items ?? [])
        .filter((user) => user.role !== "ADMIN" && user.role !== "SUPERADMIN")
        .map((user) => ({ id: user.id, label: `${user.firstName} ${user.lastName} · ${user.role}` })),
    [staff],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["geofence", "exemptions"] });

  const grant = useMutation({
    mutationFn: () =>
      geofenceApi.createExemption({
        userId,
        reason: reason.trim(),
        // End of the chosen day, so "until the 30th" includes the 30th rather
        // than lapsing at midnight as it begins.
        expiresAt: endOfDay(expiresAt!).toISOString(),
      }),
    onSuccess: () => {
      toast.success("Exemption granted");
      setUserId("");
      setReason("");
      setExpiresAt(defaultExpiry());
      void invalidate();
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not grant the exemption."),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => geofenceApi.revokeExemption(id),
    onSuccess: () => {
      toast.success("Exemption ended");
      void invalidate();
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not end the exemption."),
  });

  const canGrant = userId !== "" && reason.trim() !== "" && expiresAt !== null && !grant.isPending;

  return (
    <SectionCard
      icon={UserCheck}
      title="People allowed to work away from the premises"
      subtitle="Always for a set period. There is no permanent exemption by design."
    >
      {isLoading && <LoadingState label="Loading exemptions" />}
      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}

      {exemptions && exemptions.length === 0 && (
        <div style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe, padding: "12px 2px" }}>
          Nobody currently has an exemption.
        </div>
      )}

      {exemptions && exemptions.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {exemptions.map((exemption) => {
            const remaining = daysUntil(exemption.expiresAt);
            return (
              <div
                key={exemption.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 14,
                  flexWrap: "wrap",
                  padding: "12px 2px",
                  borderBottom: `1px solid ${T.borderDef}`,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14.5, color: T.luxuryBrown }}>
                    {exemption.user.firstName} {exemption.user.lastName}
                    <span style={{ fontFamily: F.ui, fontWeight: 500, color: T.taupe, fontSize: 13 }}>
                      {" "}· {exemption.user.role}
                    </span>
                  </div>
                  <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, marginTop: 3 }}>
                    {exemption.reason}
                    {exemption.grantedBy &&
                      ` — granted by ${exemption.grantedBy.firstName} ${exemption.grantedBy.lastName}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill tone={remaining <= 1 ? "warn" : "good"}>
                    {remaining <= 0
                      ? "Ends today"
                      : remaining === 1
                        ? "1 day left"
                        : `${remaining} days left`}
                  </StatusPill>
                  <QuietButton onClick={() => revoke.mutate(exemption.id)} disabled={revoke.isPending} danger>
                    End now
                  </QuietButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        style={{
          borderRadius: 14,
          border: `1px solid ${T.borderGold}`,
          background: T.silkCream,
          padding: 16,
        }}
      >
        <div
          style={{
            fontFamily: F.display,
            fontWeight: 700,
            fontSize: 14,
            color: T.luxuryBrown,
            marginBottom: 12,
          }}
        >
          Grant a new exemption
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FieldRow label="Who">
            <select
              aria-label="Person to exempt"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={controlStyle}
            >
              <option value="">Select a person…</option>
              {staffOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="Reason">
            <input
              aria-label="Reason for the exemption"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Travelling to Chennai for the exhibition"
              style={controlStyle}
            />
          </FieldRow>
          <FieldRow label="Until">
            <DatePicker value={expiresAt} onChange={setExpiresAt} min={new Date()} />
            <Hint>Access returns to normal at the end of this day.</Hint>
          </FieldRow>
        </div>
        <div style={{ marginTop: 14 }}>
          <PrimaryButton onClick={() => grant.mutate()} disabled={!canGrant}>
            {grant.isPending ? "Granting…" : "Grant exemption"}
          </PrimaryButton>
        </div>
      </div>
    </SectionCard>
  );
}

const controlStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${T.borderDef}`,
  background: "#FFFFFF",
  fontFamily: F.ui,
  fontSize: 14,
  color: T.luxuryBrown,
};
