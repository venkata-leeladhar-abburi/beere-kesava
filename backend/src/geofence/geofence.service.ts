import { Injectable } from "@nestjs/common";
import { GeofenceDecision, GeofenceMode, UserRole } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { haversineMeters, isUsableFix } from "./geo.util";

/** A position as a browser reports it. Every field optional — "the user denied
 *  permission" and "the fix timed out" both arrive here as nothing at all. */
export interface LocationFix {
  latitude?: number | null;
  longitude?: number | null;
  accuracyMeters?: number | null;
}

export interface GeofenceEvaluation {
  /** Whether the login may proceed. In OBSERVE mode this is always true. */
  allowed: boolean;
  decision: GeofenceDecision;
  /** Null when the role carries no policy at all. */
  mode: GeofenceMode | null;
  distanceMeters: number | null;
  nearestSiteLabel: string | null;
  /** User-facing explanation, set only when `allowed` is false. */
  message: string | null;
}

const NOT_ENFORCED: GeofenceEvaluation = {
  allowed: true,
  decision: GeofenceDecision.NOT_ENFORCED,
  mode: null,
  distanceMeters: null,
  nearestSiteLabel: null,
  message: null,
};

@Injectable()
export class GeofenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Decides whether a sign-in from `fix` is permitted for `role`.
   *
   * Deliberately not cached. This runs on OTP request/verify and portal
   * switches only — a handful of queries per login, nowhere near worth the
   * staleness bug where an admin widens the radius to unblock stranded staff
   * and the change sits in a cache for the next few minutes. If this is ever
   * extended to a per-request check, add the cache then.
   */
  async evaluate(params: {
    role: UserRole;
    userId?: string | null;
    fix?: LocationFix | null;
  }): Promise<GeofenceEvaluation> {
    const { role, userId, fix } = params;

    // A role with no policy row is not geofenced. ADMIN and SUPERADMIN stay
    // unrestricted by having no row, rather than by a hardcoded exception —
    // so "who is exempt" is answerable from the database, and adding a new
    // unrestricted role is a data change, not a code change.
    const policy = await this.prisma.geofenceRolePolicy.findUnique({ where: { role } });
    if (!policy || !policy.enforced) return NOT_ENFORCED;

    const { mode } = policy;
    // OBSERVE records the decision but never blocks, so every branch below
    // reports through this rather than deciding for itself.
    const verdict = (
      decision: GeofenceDecision,
      message: string,
      distanceMeters: number | null,
      nearestSiteLabel: string | null,
    ): GeofenceEvaluation => ({
      allowed: mode === GeofenceMode.OBSERVE,
      decision,
      mode,
      distanceMeters,
      nearestSiteLabel,
      message: mode === GeofenceMode.ENFORCE ? message : null,
    });

    if (userId) {
      const exemption = await this.prisma.geofenceExemption.findFirst({
        where: { userId, expiresAt: { gt: new Date() } },
        orderBy: { expiresAt: "desc" },
      });
      if (exemption) {
        return { ...NOT_ENFORCED, decision: GeofenceDecision.EXEMPT, mode };
      }
    }

    const sites = await this.prisma.geofenceSite.findMany({ where: { active: true } });
    // Fail open, loudly. An empty site table means the feature was switched on
    // before anywhere was configured; locking every non-admin out of the
    // business until someone notices is a worse failure than letting them in
    // and recording NO_SITE_CONFIGURED against every login.
    if (sites.length === 0) {
      return { ...NOT_ENFORCED, decision: GeofenceDecision.NO_SITE_CONFIGURED, mode };
    }

    if (!fix || !isUsableFix(fix)) {
      return verdict(
        GeofenceDecision.UNAVAILABLE,
        "We could not read your location. Please allow location access in your browser and try again from the factory premises.",
        null,
        null,
      );
    }

    const point = { latitude: fix.latitude as number, longitude: fix.longitude as number };
    const nearest = sites
      .map((site) => ({ site, distance: haversineMeters(point, site) }))
      .reduce((closest, candidate) => (candidate.distance < closest.distance ? candidate : closest));
    const distance = Math.round(nearest.distance * 10) / 10;

    // Checked before the radius on purpose. A fix with +/-400m of error that
    // happens to land inside the circle has not shown the person is on site —
    // it has shown the phone does not know where it is. Accepting it would
    // make the geofence trivially passable by anyone with a weak signal.
    const accuracy = fix.accuracyMeters;
    if (typeof accuracy === "number" && Number.isFinite(accuracy) && accuracy > nearest.site.maxAccuracyMeters) {
      return verdict(
        GeofenceDecision.INACCURATE,
        `Your device could only place you to within ${Math.round(accuracy)} metres, which is not precise enough to confirm you are at ${nearest.site.label}. Please step outside or near a window and try again.`,
        distance,
        nearest.site.label,
      );
    }

    if (distance <= nearest.site.radiusMeters) {
      return {
        allowed: true,
        decision: GeofenceDecision.ALLOWED,
        mode,
        distanceMeters: distance,
        nearestSiteLabel: nearest.site.label,
        message: null,
      };
    }

    return verdict(
      GeofenceDecision.OUTSIDE,
      `You appear to be about ${this.humanDistance(distance)} from ${nearest.site.label}. This portal can only be used at the premises. Please contact your administrator if you believe this is wrong.`,
      distance,
      nearest.site.label,
    );
  }

  /** Metres up close, kilometres once the number stops being readable. */
  private humanDistance(metres: number): string {
    return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} metres`;
  }

  /** The columns AuditLog keeps for a login attempt. */
  auditFieldsFor(evaluation: GeofenceEvaluation, fix?: LocationFix | null) {
    const usable = fix != null && isUsableFix(fix);
    return {
      latitude: usable ? (fix.latitude ?? null) : null,
      longitude: usable ? (fix.longitude ?? null) : null,
      accuracyMeters: typeof fix?.accuracyMeters === "number" ? fix.accuracyMeters : null,
      distanceMeters: evaluation.distanceMeters,
      geofenceDecision: evaluation.decision,
      geofenceMode: evaluation.mode,
    };
  }
}
