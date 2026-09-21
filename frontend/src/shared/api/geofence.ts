import { apiClient } from "./client";

export type GeofenceMode = "OBSERVE" | "ENFORCE";

export type GeofenceDecision =
  | "ALLOWED"
  | "OUTSIDE"
  | "INACCURATE"
  | "UNAVAILABLE"
  | "EXEMPT"
  | "NOT_ENFORCED"
  | "NO_SITE_CONFIGURED";

export interface GeofenceSite {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  maxAccuracyMeters: number;
  active: boolean;
  sourceNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GeofenceRolePolicy {
  role: string;
  enforced: boolean;
  mode: GeofenceMode;
  /** ADMIN and SUPERADMIN — reported so the screen can show why they can't be changed. */
  lockedUnrestricted: boolean;
}

export interface GeofenceExemption {
  id: string;
  userId: string;
  reason: string;
  expiresAt: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; empId: string | null; role: string };
  grantedBy: { id: string; firstName: string; lastName: string } | null;
}

export interface GeofenceReadingRow {
  id: string;
  at: string;
  signedIn: boolean;
  staffName: string | null;
  empId: string | null;
  role: string | null;
  device: string | null;
  failReason: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  distanceMeters: number | null;
  decision: GeofenceDecision | null;
  mode: GeofenceMode | null;
}

export interface GeofenceReadings {
  days: number;
  radiusMeters: number;
  siteLabel: string | null;
  summary: {
    total: number;
    insideRadius: number;
    outside: number;
    inaccurate: number;
    unavailable: number;
    wouldBeRefusedIfEnforced: number;
    medianDistanceMeters: number | null;
    medianAccuracyMeters: number | null;
  };
  buckets: { label: string; fromMeters: number | null; toMeters: number | null; count: number }[];
  rows: GeofenceReadingRow[];
}

export type CreateSitePayload = Pick<GeofenceSite, "label" | "latitude" | "longitude"> &
  Partial<Pick<GeofenceSite, "radiusMeters" | "maxAccuracyMeters" | "active" | "sourceNote">>;

export type UpdateSitePayload = Partial<CreateSitePayload>;

export const geofenceApi = {
  listSites: () => apiClient.get<GeofenceSite[]>("/geofence/sites"),
  createSite: (payload: CreateSitePayload) => apiClient.post<GeofenceSite>("/geofence/sites", payload),
  updateSite: (id: string, payload: UpdateSitePayload) =>
    apiClient.patch<GeofenceSite>(`/geofence/sites/${id}`, payload),
  deleteSite: (id: string) => apiClient.delete<{ ok: boolean }>(`/geofence/sites/${id}`),

  listPolicies: () => apiClient.get<GeofenceRolePolicy[]>("/geofence/policies"),
  setPolicy: (role: string, payload: { enforced: boolean; mode: GeofenceMode }) =>
    apiClient.put<GeofenceRolePolicy>(`/geofence/policies/${role}`, payload),

  listExemptions: () => apiClient.get<GeofenceExemption[]>("/geofence/exemptions"),
  createExemption: (payload: { userId: string; reason: string; expiresAt: string }) =>
    apiClient.post<GeofenceExemption>("/geofence/exemptions", payload),
  revokeExemption: (id: string) => apiClient.delete<{ ok: boolean }>(`/geofence/exemptions/${id}`),

  readings: (params: { days?: number; role?: string; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.days) query.set("days", String(params.days));
    if (params.role) query.set("role", params.role);
    if (params.limit) query.set("limit", String(params.limit));
    const suffix = query.toString();
    return apiClient.get<GeofenceReadings>(`/geofence/readings${suffix ? `?${suffix}` : ""}`);
  },
};
