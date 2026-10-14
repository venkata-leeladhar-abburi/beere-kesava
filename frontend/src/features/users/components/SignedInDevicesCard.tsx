import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Smartphone } from "lucide-react";
import { Button } from "../../../shared/ui/primitives";
import { ConfirmDialog } from "../../../shared/ui/ConfirmDialog";
import { usersApi, type UserSession } from "../../../shared/api/users";
import { formatDateTime, formatRelativeTime } from "../../../lib/formatters";
import { T } from "./theme";
import { SectionCard } from "./UserBadges";

type Pending = { kind: "one"; session: UserSession } | { kind: "all" };

/**
 * Every device this person is signed in on, with a way to sign any of them
 * out. Sessions never time out on their own, so this is the control for a
 * lost or shared phone: the device is signed out on its very next request.
 */
export function SignedInDevicesCard({ userId, fullName }: { userId: string; fullName: string }) {
  const queryClient = useQueryClient();
  const queryKey = ["user-sessions", userId];
  const [pending, setPending] = useState<Pending | null>(null);

  const sessions = useQuery({ queryKey, queryFn: () => usersApi.listSessions(userId) });

  const revoke = useMutation({
    mutationFn: (p: Pending) =>
      p.kind === "all"
        ? usersApi.revokeAllSessions(userId)
        : usersApi.revokeSession(userId, p.session.id),
    onSuccess: () => {
      setPending(null);
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const list = sessions.data ?? [];

  return (
    <div style={{ marginTop: 20 }}>
      <SectionCard
        icon={Smartphone}
        title="Signed-in Devices"
        subtitle="Signing a device out takes effect on its next action. Sessions do not expire on their own."
      >
        {sessions.isPending ? (
          <div style={{ fontSize: 13, color: T.taupe }}>Loading devices…</div>
        ) : sessions.isError ? (
          <div style={{ fontSize: 13, color: T.crimson }}>
            Could not load devices.{" "}
            <Button variant="tertiary" onClick={() => void sessions.refetch()}>
              Try again
            </Button>
          </div>
        ) : list.length === 0 ? (
          <div style={{ fontSize: 13, color: T.taupe }}>
            {fullName} is not signed in on any device.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {list.map((s) => (
              <div
                key={s.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center"
                style={{
                  padding: "11px 13px",
                  borderRadius: 12,
                  border: `1px solid ${T.borderDef}`,
                  background: "#FFF",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.luxuryBrown }}>
                    {s.device ?? "Unknown device"}
                  </div>
                  <div style={{ fontSize: 12, color: T.taupe, marginTop: 2 }}>
                    Active {formatRelativeTime(s.lastSeenAt)} · signed in{" "}
                    {formatDateTime(s.createdAt)}
                  </div>
                </div>
                <Button variant="tertiary" onClick={() => setPending({ kind: "one", session: s })}>
                  <LogOut size={14} /> Sign out
                </Button>
              </div>
            ))}
            {list.length > 1 && (
              <div style={{ paddingTop: 6 }}>
                <Button variant="tertiary" onClick={() => setPending({ kind: "all" })}>
                  <LogOut size={14} /> Sign out of all {list.length} devices
                </Button>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {pending && (
        <ConfirmDialog
          title={pending.kind === "all" ? "Sign out everywhere?" : "Sign out this device?"}
          message={
            pending.kind === "all"
              ? `${fullName} will be signed out on every device and will need a new OTP to get back in.`
              : `${fullName} will be signed out on ${pending.session.device ?? "this device"} and will need a new OTP to get back in on it.`
          }
          confirmLabel="Sign out"
          loading={revoke.isPending}
          error={revoke.isError ? (revoke.error as Error).message : null}
          onConfirm={() => revoke.mutate(pending)}
          onCancel={() => {
            if (!revoke.isPending) {
              setPending(null);
              revoke.reset();
            }
          }}
        />
      )}
    </div>
  );
}
