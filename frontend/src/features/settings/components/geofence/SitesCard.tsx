import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Crosshair, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { F, T, SectionCard, Toggle } from "../labelSettings/primitives";
import { SiteMap } from "./SiteMap";
import { FieldRow, Hint, PrimaryButton, QuietButton } from "./primitives";
import { geofenceApi, type GeofenceSite } from "../../../../shared/api/geofence";
import { getCurrentFix } from "../../../../shared/lib/geolocation";
import { LoadingState, ErrorState } from "../../../../shared/ui/state";

interface Draft {
  label: string;
  latitude: string;
  longitude: string;
  radiusMeters: string;
  maxAccuracyMeters: string;
  sourceNote: string;
}

const toDraft = (site: GeofenceSite): Draft => ({
  label: site.label,
  latitude: String(site.latitude),
  longitude: String(site.longitude),
  radiusMeters: String(site.radiusMeters),
  maxAccuracyMeters: String(site.maxAccuracyMeters),
  sourceNote: site.sourceNote ?? "",
});

/** Parsed only when the whole draft is valid — a half-typed coordinate must
 *  never reach the map, which would jump around mid-keystroke. */
function parseDraft(draft: Draft) {
  const latitude = Number(draft.latitude);
  const longitude = Number(draft.longitude);
  const radiusMeters = Number(draft.radiusMeters);
  const maxAccuracyMeters = Number(draft.maxAccuracyMeters);
  const valid =
    draft.label.trim() !== "" &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    Number.isInteger(radiusMeters) &&
    radiusMeters >= 25 &&
    radiusMeters <= 5000 &&
    Number.isInteger(maxAccuracyMeters) &&
    maxAccuracyMeters >= 10 &&
    maxAccuracyMeters <= 1000;
  return { valid, latitude, longitude, radiusMeters, maxAccuracyMeters };
}

function SiteEditor({ site }: { site: GeofenceSite }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(() => toDraft(site));
  const [locating, setLocating] = useState(false);

  // Re-hydrate after a save refetches, or when the server value changes under
  // us — without this the form would keep showing a stale radius.
  useEffect(() => setDraft(toDraft(site)), [site]);

  const parsed = parseDraft(draft);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["geofence", "sites"] });

  const save = useMutation({
    mutationFn: () =>
      geofenceApi.updateSite(site.id, {
        label: draft.label.trim(),
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        radiusMeters: parsed.radiusMeters,
        maxAccuracyMeters: parsed.maxAccuracyMeters,
        sourceNote: draft.sourceNote.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Site saved");
      void invalidate();
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not save the site."),
  });

  const toggleActive = useMutation({
    mutationFn: () => geofenceApi.updateSite(site.id, { active: !site.active }),
    onSuccess: () => void invalidate(),
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not change the site."),
  });

  const remove = useMutation({
    mutationFn: () => geofenceApi.deleteSite(site.id),
    onSuccess: () => {
      toast.success("Site removed");
      void invalidate();
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not remove the site."),
  });

  /** Re-centres on wherever this device is. The fastest correct fix for a bad
   *  pin: stand in the middle of the premises and press it. */
  const moveToMyLocation = async () => {
    setLocating(true);
    const fix = await getCurrentFix();
    setLocating(false);
    if (!fix) {
      toast.error("Could not read this device's location. Allow location access and try again.");
      return;
    }
    setDraft((d) => ({
      ...d,
      latitude: fix.latitude.toFixed(6),
      longitude: fix.longitude.toFixed(6),
      sourceNote: `Set from a device standing at the site on ${new Date().toLocaleDateString("en-IN")} (fix accurate to ±${Math.round(fix.accuracyMeters)} m).`,
    }));
    toast.success(`Pin moved here (±${Math.round(fix.accuracyMeters)} m). Review, then save.`);
  };

  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(site));

  return (
    <div
      style={{
        border: `1px solid ${T.borderDef}`,
        borderRadius: 16,
        padding: 18,
        background: site.active ? T.warmIvory : "rgba(110,15,45,0.03)",
      }}
    >
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="lg:w-[360px] shrink-0">
          {parsed.valid ? (
            <SiteMap
              latitude={parsed.latitude}
              longitude={parsed.longitude}
              radiusMeters={parsed.radiusMeters}
            />
          ) : (
            <div
              style={{
                height: 260,
                borderRadius: 14,
                border: `1px dashed ${T.borderGold}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.ui,
                fontSize: 13,
                color: T.taupe,
                textAlign: "center",
                padding: 16,
              }}
            >
              Enter a valid coordinate and radius to see it on the map.
            </div>
          )}
          <div style={{ marginTop: 10 }}>
            <QuietButton onClick={() => void moveToMyLocation()} disabled={locating} icon={Crosshair}>
              {locating ? "Reading location…" : "Move pin to my location"}
            </QuietButton>
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <FieldRow label="Name">
            <input
              value={draft.label}
              aria-label="Site name"
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              style={inputStyle}
            />
          </FieldRow>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldRow label="Latitude">
              <input
                value={draft.latitude}
              aria-label="Latitude"
                onChange={(e) => setDraft({ ...draft, latitude: e.target.value })}
                inputMode="decimal"
                style={{ ...inputStyle, fontVariantNumeric: "tabular-nums" }}
              />
            </FieldRow>
            <FieldRow label="Longitude">
              <input
                value={draft.longitude}
              aria-label="Longitude"
                onChange={(e) => setDraft({ ...draft, longitude: e.target.value })}
                inputMode="decimal"
                style={{ ...inputStyle, fontVariantNumeric: "tabular-nums" }}
              />
            </FieldRow>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldRow label="Radius (metres)">
              <input
                value={draft.radiusMeters}
              aria-label="Radius in metres"
                onChange={(e) => setDraft({ ...draft, radiusMeters: e.target.value })}
                inputMode="numeric"
                style={inputStyle}
              />
              <Hint>How far from the pin still counts as being at work. 25–5000.</Hint>
            </FieldRow>
            <FieldRow label="Accuracy limit (metres)">
              <input
                value={draft.maxAccuracyMeters}
              aria-label="Accuracy limit in metres"
                onChange={(e) => setDraft({ ...draft, maxAccuracyMeters: e.target.value })}
                inputMode="numeric"
                style={inputStyle}
              />
              <Hint>
                A phone that can only place itself to worse than this is asked to try again, rather
                than believed.
              </Hint>
            </FieldRow>
          </div>

          <FieldRow label="Note">
            <input
              value={draft.sourceNote}
              aria-label="Note about where this pin came from"
              onChange={(e) => setDraft({ ...draft, sourceNote: e.target.value })}
              placeholder="Where this pin came from"
              style={inputStyle}
            />
          </FieldRow>

          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <div className="flex items-center gap-2.5">
              <Toggle value={site.active} onChange={() => toggleActive.mutate()} />
              <span style={{ fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown }}>
                {site.active ? "In use" : "Not in use"}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <QuietButton
                onClick={() => {
                  if (window.confirm(`Remove "${site.label}"? Staff will no longer be able to sign in from there.`)) {
                    remove.mutate();
                  }
                }}
                icon={Trash2}
                danger
              >
                Remove
              </QuietButton>
              <PrimaryButton
                onClick={() => save.mutate()}
                disabled={!parsed.valid || !dirty || save.isPending}
              >
                {save.isPending ? "Saving…" : "Save changes"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${T.borderDef}`,
  background: "#FFFFFF",
  fontFamily: F.ui,
  fontSize: 14,
  color: T.luxuryBrown,
};

export function SitesCard() {
  const queryClient = useQueryClient();
  const { data: sites, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["geofence", "sites"],
    queryFn: () => geofenceApi.listSites(),
  });

  const [adding, setAdding] = useState(false);

  const create = useMutation({
    mutationFn: async () => {
      const fix = await getCurrentFix();
      if (!fix) throw new Error("Could not read this device's location. Allow location access and try again.");
      return geofenceApi.createSite({
        label: "New site",
        latitude: fix.latitude,
        longitude: fix.longitude,
        radiusMeters: 100,
        sourceNote: `Added from a device at this location on ${new Date().toLocaleDateString("en-IN")} (±${Math.round(fix.accuracyMeters)} m).`,
      });
    },
    onSuccess: () => {
      toast.success("Site added at your current location. Give it a name and save.");
      void queryClient.invalidateQueries({ queryKey: ["geofence", "sites"] });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Could not add the site."),
    onSettled: () => setAdding(false),
  });

  return (
    <SectionCard
      icon={MapPin}
      title="Places staff can sign in from"
      subtitle="The pin, and how far around it still counts as being at work."
      actions={
        <PrimaryButton
          onClick={() => {
            setAdding(true);
            create.mutate();
          }}
          disabled={adding || create.isPending}
          onDark
        >
          {create.isPending ? "Reading location…" : "Add my location"}
        </PrimaryButton>
      }
    >
      {isLoading && <LoadingState label="Loading sites" />}
      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}
      {sites && sites.length === 0 && (
        <div
          style={{
            fontFamily: F.ui,
            fontSize: 14,
            color: T.luxuryBrown,
            padding: "18px 2px",
            lineHeight: 1.6,
          }}
        >
          No site is configured yet, so the location check is not being applied to anyone — everyone
          can sign in from anywhere. Stand at the premises and press <strong>Add my location</strong>.
        </div>
      )}
      <div className="flex flex-col gap-4">
        {sites?.map((site) => (
          <SiteEditor key={site.id} site={site} />
        ))}
      </div>
    </SectionCard>
  );
}
