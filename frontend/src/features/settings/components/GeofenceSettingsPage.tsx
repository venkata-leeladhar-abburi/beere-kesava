import { F, T } from "./labelSettings/primitives";
import { SitesCard } from "./geofence/SitesCard";
import { RolePoliciesCard } from "./geofence/RolePoliciesCard";
import { ExemptionsCard } from "./geofence/ExemptionsCard";
import { ReadingsCard } from "./geofence/ReadingsCard";

/**
 * Superadmin control of the sign-in location restriction.
 *
 * Ordered the way the decision is actually made, not by importance: where the
 * premises are, who it applies to, who is excused, and last — the evidence you
 * need before moving a role from recording to blocking. The readings card sits
 * at the bottom because it is what you scroll down to read, then scroll back
 * up to act on.
 */
export function GeofenceSettingsPage() {
  return (
    <div style={{ background: T.silkCream, minHeight: "100dvh", paddingBottom: 90 }}>
      <header
        style={{
          background: "#0D0207",
          position: "relative",
          overflow: "hidden",
          minHeight: 300,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          className="px-4 md:px-7 xl:px-12 w-full"
          style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 96 }}
        >
          <div
            style={{
              fontFamily: F.ui,
              fontSize: "clamp(11px, 1.4vw, 13px)",
              color: "rgba(255,253,249,0.50)",
              letterSpacing: "1.8px",
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            SINCE 1999 · SUPERADMIN · SIGN-IN LOCATION
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(32px, 6vw, 56px)",
                fontWeight: 400,
                color: "#FFFDF9",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              Sign-in Location
            </h1>
            <span
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(22px, 5vw, 36px)",
                fontStyle: "italic",
                color: T.antiqueGold,
                fontWeight: 400,
              }}
            >
              &amp; Access Limits
            </span>
          </div>

          <p
            className="max-w-[640px]"
            style={{
              fontFamily: F.ui,
              fontSize: "clamp(14px, 2.2vw, 16px)",
              color: "rgba(255,253,249,0.70)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Restrict staff sign-in to the firm's premises. Admins and Superadmins are never
            location-checked, so this screen stays reachable from anywhere — including when a
            setting here has locked everyone else out.
          </p>
        </div>
      </header>

      <div
        className="px-4 md:px-7 xl:px-14 flex flex-col gap-6"
        style={{ marginTop: -40, position: "relative", zIndex: 10 }}
      >
        <SitesCard />
        <RolePoliciesCard />
        <ExemptionsCard />
        <ReadingsCard />
      </div>
    </div>
  );
}
