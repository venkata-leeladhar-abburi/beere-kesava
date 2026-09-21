import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { F, T, SectionCard, Toggle } from "../labelSettings/primitives";
import { StatusPill } from "./primitives";
import { geofenceApi, type GeofenceMode, type GeofenceRolePolicy } from "../../../../shared/api/geofence";
import { LoadingState, ErrorState } from "../../../../shared/ui/state";

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Superadmin",
  ADMIN: "Admin",
  WORKER: "Worker Staff",
  WEAVER: "Weavers",
  SHOP: "Shop Staff",
  ACCOUNTANT: "Accountants",
};

function ModeChoice({
  mode,
  onChange,
  disabled,
}: {
  mode: GeofenceMode;
  onChange: (next: GeofenceMode) => void;
  disabled?: boolean;
}) {
  const options: { value: GeofenceMode; label: string }[] = [
    { value: "OBSERVE", label: "Recording only" },
    { value: "ENFORCE", label: "Blocking" },
  ];

  return (
    <div style={{ display: "inline-flex", borderRadius: 10, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
      {options.map((option) => {
        const selected = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            style={{
              padding: "7px 13px",
              border: "none",
              background: selected ? T.royalBurgundy : "#FFFFFF",
              color: selected ? "#FFFDF9" : T.taupe,
              fontFamily: F.ui,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function PolicyRow({ policy }: { policy: GeofenceRolePolicy }) {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (payload: { enforced: boolean; mode: GeofenceMode }) =>
      geofenceApi.setPolicy(policy.role, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["geofence", "policies"] });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not change this role."),
  });

  const label = ROLE_LABELS[policy.role] ?? policy.role;

  // ADMIN and SUPERADMIN are shown, greyed, with the reason spelled out —
  // rather than hidden. Their absence would read as an oversight, and this is
  // the property the whole recovery story rests on.
  if (policy.lockedUnrestricted) {
    return (
      <div style={rowStyle}>
        <div style={{ minWidth: 0 }}>
          <div style={nameStyle}>{label}</div>
          <div className="max-w-[520px]" style={subStyle}>
            Never location-checked. This is what keeps a way back in if the radius is ever set wrong.
          </div>
        </div>
        <StatusPill tone="muted">Always allowed anywhere</StatusPill>
      </div>
    );
  }

  const changeMode = (next: GeofenceMode) => {
    if (next === policy.mode) return;
    if (next === "ENFORCE") {
      const ok = window.confirm(
        `Start blocking ${label}?\n\n` +
          `From now on they will be refused sign-in unless they are at the premises. ` +
          `Check the recorded sign-ins below first — anyone whose phone reads badly indoors will be turned away.`,
      );
      if (!ok) return;
    }
    save.mutate({ enforced: policy.enforced, mode: next });
    toast.success(
      next === "ENFORCE" ? `${label} will now be blocked when away` : `${label} set back to recording only`,
    );
  };

  return (
    <div style={rowStyle}>
      <div style={{ minWidth: 0 }}>
        <div style={nameStyle}>{label}</div>
        <div className="max-w-[520px]" style={subStyle}>
          {!policy.enforced
            ? "Not location-checked at all."
            : policy.mode === "OBSERVE"
              ? "Sign-ins are recorded with their distance, but nobody is turned away."
              : "Refused unless they are at one of the sites above."}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap justify-end">
        {policy.enforced && (
          <ModeChoice mode={policy.mode} onChange={changeMode} disabled={save.isPending} />
        )}
        <div className="flex items-center gap-2">
          <Toggle
            value={policy.enforced}
            onChange={() => save.mutate({ enforced: !policy.enforced, mode: policy.mode })}
            disabled={save.isPending}
          />
          <span style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, minWidth: 56 }}>
            {policy.enforced ? "Checked" : "Off"}
          </span>
        </div>
      </div>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  padding: "14px 2px",
  borderBottom: `1px solid ${T.borderDef}`,
};

const nameStyle: React.CSSProperties = {
  fontFamily: F.display,
  fontWeight: 700,
  fontSize: 15,
  color: T.luxuryBrown,
};

const subStyle: React.CSSProperties = {
  fontFamily: F.ui,
  fontSize: 12.5,
  color: T.taupe,
  marginTop: 3,
  lineHeight: 1.45,
};

export function RolePoliciesCard() {
  const { data: policies, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["geofence", "policies"],
    queryFn: () => geofenceApi.listPolicies(),
  });

  return (
    <SectionCard
      icon={ShieldCheck}
      title="Who has to be at the premises"
      subtitle="Recording only shows you what would happen. Blocking actually turns people away."
    >
      {isLoading && <LoadingState label="Loading roles" />}
      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}
      <div>
        {policies?.map((policy) => (
          <PolicyRow key={policy.role} policy={policy} />
        ))}
      </div>
    </SectionCard>
  );
}
