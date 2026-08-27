import React, { createContext, useContext, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BackendJariGrade,
  BackendMaterialIssueRecord,
  BackendMaterialType,
  BackendWarpSubtype,
  CreateMaterialIssuePayload,
  materialIssuesApi,
} from "../../../shared/api/material-issues";
import { BackendMaterialReturnRecord, materialReturnsApi } from "../../../shared/api/material-returns";
import { BackendWeaver, weaversApi } from "../../../shared/api/weavers";
import { BackendFactoryLoom, factoryLoomsApi } from "../../../shared/api/factory-looms";
import { STOPGAP_ACTING_USER_ID } from "../../../shared/api/purchase-requests";
import { useAuth, useAuthGate } from "../../../contexts/AuthContext";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface IssuedMaterialItem {
  materialType: "Warp" | "Resham" | "Jari";
  warpSubtype?: "Resham Warp" | "Jari Warp";  // only for Warp type
  description?: string;
  quantity: number;
  unit: string;        // kg for Warp/Resham, Buns/Reels for Jari
  jariType?: "Polyester" | "Silk Fast";
  jariGrade?: "1G" | "2G" | "3G" | "4G" | "5G";
  jariColor?: string;
  grnBatchId: string;  // which received GRN batch this material came from
  /** GrnItem.id of the exact received line — what the backend deducts against. */
  grnItemId?: string;
  /** Structured per-line code of that GRN line (e.g. "GRN-SreeVignesh-004-002-1") — the same id Receive Stock displays. */
  grnItemCode?: string;
  /** How much that GRN line originally held, for the stock-impact breakdown. */
  grnItemReceivedQty?: number;
}

export interface MaterialIssueRecord {
  id: string;               // auto-generated e.g. "MIR-2026-001"
  weaverId?: string;         // Weaver.id (UUID) — the FK, not for display
  /** Human-facing weaver ID (e.g. "Wea-003"). Show this in the UI; `weaverId` is a UUID. */
  weaverCode?: string;
  weaverName?: string;
  loomNumber?: number;      // Loom number selected
  batchId?: string;         // Production batch this issuance is for
  factoryLoomId?: string;   // set instead of weaverId when issued to a factory loom
  factoryLoomNumber?: string;
  issuedBy: string;         // Admin name who issued
  issuedAt: string;         // date-time
  materials: IssuedMaterialItem[];
  signatureMethod: "here" | "remote";
  signatureCaptured: boolean;
  signatureTimestamp?: string;
  signatureUrl?: string;    // resolved URL of the captured signature image (HERE method only)
  notes?: string;
  // Rendered via <StatusPill taxonomy="document" .../> in RecordDetailsModal.tsx
  // through ISSUE_STATUS_TO_DOCUMENT (pending-signature → pending, signed →
  // signed, cancelled → void) — a material issue slip is a document awaiting
  // the weaver's signature.
  status: "pending-signature" | "signed" | "cancelled";
}

// ─── Backend <-> frontend enum mapping ─────────────────────────────────────────
// Exported so MaterialReturnContext.tsx (return-materials flow) can reuse the
// exact same mapping instead of duplicating it.
export const MATERIAL_TYPE_TO_BACKEND: Record<IssuedMaterialItem["materialType"], BackendMaterialType> = {
  Warp: "WARP",
  Resham: "RESHAM",
  Jari: "JARI",
};
export const MATERIAL_TYPE_FROM_BACKEND: Record<BackendMaterialType, IssuedMaterialItem["materialType"]> = {
  WARP: "Warp",
  RESHAM: "Resham",
  JARI: "Jari",
};
export const WARP_SUBTYPE_TO_BACKEND: Record<string, BackendWarpSubtype> = {
  "Resham Warp": "RESHAM_WARP",
  "Jari Warp": "JARI_WARP",
};
export const WARP_SUBTYPE_FROM_BACKEND: Record<BackendWarpSubtype, "Resham Warp" | "Jari Warp"> = {
  RESHAM_WARP: "Resham Warp",
  JARI_WARP: "Jari Warp",
};
export const JARI_GRADE_TO_BACKEND: Record<string, BackendJariGrade> = {
  "1G": "G1", "2G": "G2", "3G": "G3", "4G": "G4", "5G": "G5",
};
export const JARI_GRADE_FROM_BACKEND: Record<BackendJariGrade, "1G" | "2G" | "3G" | "4G" | "5G"> = {
  G1: "1G", G2: "2G", G3: "3G", G4: "4G", G5: "5G",
};

function backendItemToFrontend(item: BackendMaterialIssueRecord["items"][number]): IssuedMaterialItem {
  return {
    materialType: MATERIAL_TYPE_FROM_BACKEND[item.materialType],
    warpSubtype: item.warpSubtype ? WARP_SUBTYPE_FROM_BACKEND[item.warpSubtype] : undefined,
    quantity: Number(item.quantity),
    unit: item.unit,
    jariType: item.jariType === "Polyester" || item.jariType === "Silk Fast" ? item.jariType : undefined,
    jariGrade: item.jariGrade ? JARI_GRADE_FROM_BACKEND[item.jariGrade] : undefined,
    jariColor: item.jariColor ?? undefined,
    grnBatchId: item.grnBatchId ?? "",
    grnItemId: item.grnItemId ?? undefined,
    grnItemCode: item.grnItem?.itemCode ?? undefined,
    description: item.grnItem?.description ?? undefined,
    grnItemReceivedQty: item.grnItem ? Number(item.grnItem.quantity) : undefined,
  };
}

function backendRecordToFrontend(
  r: BackendMaterialIssueRecord,
  weaverLookup: Map<string, string>,
  loomLookup: Map<string, string>,
): MaterialIssueRecord {
  return {
    id: r.id,
    weaverId: r.weaverId ?? undefined,
    weaverCode: r.weaver?.code ?? undefined,
    weaverName: r.weaver?.name ?? (r.weaverId ? weaverLookup.get(r.weaverId) : undefined),
    loomNumber: r.loomNumber ? Number(r.loomNumber) : undefined,
    batchId: r.batchId ?? undefined,
    factoryLoomId: r.factoryLoomId ?? undefined,
    factoryLoomNumber: r.factoryLoomId ? loomLookup.get(r.factoryLoomId) : undefined,
    issuedBy: r.issuedBy ? `${r.issuedBy.firstName} ${r.issuedBy.lastName}`.trim() : "—",
    issuedAt: r.issuedAt,
    materials: r.items.map(backendItemToFrontend),
    signatureMethod: r.signatureMethod === "REMOTE" ? "remote" : "here",
    signatureCaptured: r.signatureCaptured,
    signatureTimestamp: r.signatureTimestamp ?? undefined,
    signatureUrl: r.signatureUrl ?? undefined,
    notes: r.notes ?? undefined,
    status: r.status === "PENDING_SIGNATURE" ? "pending-signature" : r.status === "SIGNED" ? "signed" : "cancelled",
  };
}

function frontendItemToPayload(m: IssuedMaterialItem): CreateMaterialIssuePayload["items"][number] {
  return {
    materialType: MATERIAL_TYPE_TO_BACKEND[m.materialType],
    warpSubtype: m.warpSubtype ? WARP_SUBTYPE_TO_BACKEND[m.warpSubtype] : undefined,
    quantity: m.quantity,
    unit: m.unit,
    jariType: m.jariType,
    jariGrade: m.jariGrade ? JARI_GRADE_TO_BACKEND[m.jariGrade] : undefined,
    jariColor: m.jariColor,
    grnBatchId: m.grnBatchId || undefined,
    grnItemId: m.grnItemId || undefined,
  };
}

// ─── Material weight conversion ───────────────────────────────────────────────
// One reel of Jari weighs 230 grams; a Reel is 4 Buns (see IssueMaterialPage).
export const JARI_REEL_GRAMS = 230;
export const BUNS_PER_REEL = 4;

/** Convert a single issued material line into grams. */
export function materialItemToGrams(m: IssuedMaterialItem): number {
  const qty = m.quantity || 0;
  if (m.materialType === "Jari") {
    const unit = (m.unit || "").toLowerCase();
    if (unit.startsWith("bun")) return qty * (JARI_REEL_GRAMS / BUNS_PER_REEL);
    // default: Reels
    return qty * JARI_REEL_GRAMS;
  }
  // Warp / Resham are weight-based
  const unit = (m.unit || "").toLowerCase();
  if (unit === "g" || unit === "gram" || unit === "grams") return qty;
  return qty * 1000; // kg → g
}

// ─── Received sarees (returned by weaver, weighed by worker staff) ─────────────
// Backed by MaterialReturnRecord: BatchesService.receiveRow auto-creates an
// APPROVED return record (drawn from the weaver's outstanding material) the
// moment a saree is received, whether Worker Staff entered a full warp/
// resham/jari split or just the plain saree weight. Each return record here
// stands in for one "received saree" line for the outstanding-balance math
// below — it isn't literally one row per saree (a saree can span several
// material-type items on the same record), but the weight is what matters.
export interface ReceivedSareeRecord {
  id: string;          // Saree ID e.g. "RAVI-L2-004"
  weaverId: string;
  batchId?: string;
  weightGrams: number;        // provisional weight entered by worker staff at receipt
  finalWeightGrams?: number;  // final weight entered by admin during tally
  tallied?: boolean;          // true once admin has confirmed the tally for this series
  receivedAt: string;  // ISO date-time
  color?: string;
  // No taxonomy pill wired here — this field has no rendering call site today
  // (only ever set, never displayed as a badge); adding a home would be
  // speculative. "received" would fit `document`'s "received" key and
  // "defective" is closest to `inventory`'s "damaged", but they'd need two
  // different taxonomies for one field, which the single-taxonomy
  // `<StatusPill>` API can't express — flag for a follow-up if/when this
  // becomes visible in the UI.
  status: "received" | "defective";
}

const INITIAL_RECEIVED_SAREES: ReceivedSareeRecord[] = [];

/** Grams for one MaterialReturnItem — auto-created returns always store
 *  quantity in grams (unit "G"); a manually-created return can use kg or,
 *  for Jari, Reels/Buns. */
function returnItemToGrams(item: { materialType: string; quantity: string; unit: string }): number {
  const qty = Number(item.quantity) || 0;
  const unit = (item.unit || "").toLowerCase();
  if (item.materialType === "JARI") {
    if (unit.startsWith("bun")) return qty * (JARI_REEL_GRAMS / BUNS_PER_REEL);
    if (unit.startsWith("reel")) return qty * JARI_REEL_GRAMS;
    return qty; // already grams
  }
  if (unit === "kg" || unit === "kgs") return qty * 1000;
  return qty; // "g" / "G"
}

function backendReturnToReceivedSaree(r: BackendMaterialReturnRecord): ReceivedSareeRecord | null {
  if (r.status === "CANCELLED" || !r.weaverId) return null;
  const weightGrams = r.items.reduce((sum, item) => sum + returnItemToGrams(item), 0);
  return {
    id: r.id,
    weaverId: r.weaverId,
    batchId: r.batchId ?? undefined,
    weightGrams,
    receivedAt: r.receivedAt,
    status: "received",
  };
}

// ─── Outstanding material summary ─────────────────────────────────────────────
export interface WeaverMaterialSummary {
  issuedGrams: number;       // total material given (in grams)
  receivedGrams: number;     // total weight of sarees returned & weighed
  outstandingGrams: number;  // still lying with the weaver (issued − received)
  jariReels: number;         // total jari issued expressed in reels
  sareesReceived: number;    // count of sarees returned
}

export interface BatchMaterialSummary extends WeaverMaterialSummary {
  batchId: string;           // production batch this material relates to
}

// Compute a summary from a set of issue records + received sarees.
function summarize(records: MaterialIssueRecord[], received: ReceivedSareeRecord[]): WeaverMaterialSummary {
  let issuedGrams = 0;
  let jariReels = 0;
  records.forEach(r => r.materials.forEach(m => {
    issuedGrams += materialItemToGrams(m);
    if (m.materialType === "Jari") {
      jariReels += (m.unit || "").toLowerCase().startsWith("bun")
        ? (m.quantity || 0) / BUNS_PER_REEL
        : (m.quantity || 0);
    }
  }));
  const receivedGrams = received.reduce((sum, r) => sum + (r.finalWeightGrams ?? r.weightGrams ?? 0), 0);
  return {
    issuedGrams,
    receivedGrams,
    outstandingGrams: issuedGrams - receivedGrams,
    jariReels,
    sareesReceived: received.length,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────
export interface AddIssueRecordInput {
  weaverId?: string;
  weaverName?: string;
  loomNumber?: number;
  factoryLoomId?: string;
  factoryLoomNumber?: string;
  batchId?: string;
  /** Set when this issuance fulfils an approved warp request — the backend
   *  flips that request to ISSUED once the material issue is created. */
  warpRequestId?: string;
  materials: IssuedMaterialItem[];
  signatureMethod: "here" | "remote";
  notes?: string;
  /** PNG blob captured from the on-screen signature canvas (HERE method only). */
  signatureBlob?: Blob | null;
}

interface MaterialIssueContextValue {
  issueRecords: MaterialIssueRecord[];
  receivedSarees: ReceivedSareeRecord[];
  addIssueRecord: (input: AddIssueRecordInput) => Promise<MaterialIssueRecord>;
  deleteIssueRecord: (id: string) => Promise<void>;
  addReceivedSaree: (rec: ReceivedSareeRecord) => void;
  getRecordsForWeaver: (weaverId: string) => MaterialIssueRecord[];
  getRecordsForBatch: (batchId: string) => MaterialIssueRecord[];
  getReceivedForWeaver: (weaverId: string) => ReceivedSareeRecord[];
  getReceivedForBatch: (batchId: string) => ReceivedSareeRecord[];
  getMaterialSummaryForWeaver: (weaverId: string) => WeaverMaterialSummary;
  getMaterialSummaryByBatch: (weaverId: string) => BatchMaterialSummary[];
  /** Weaver-side confirm: uploads the drawn signature and moves the record to SIGNED for real. */
  updateSignatureStatus: (recordId: string, signatureBlob: Blob) => Promise<void>;
  finalizeReceivedWeight: (id: string, finalWeightGrams: number) => void;
  isError: boolean;
  error: unknown;
  isLoading: boolean;
  refetch: () => void;
}

const MaterialIssueContext = createContext<MaterialIssueContextValue | null>(null);

const ISSUE_RECORDS_KEY = ["materialIssue", "issueRecords"] as const;
const RECEIVED_SAREES_KEY = ["materialIssue", "receivedSarees"] as const;

export function MaterialIssueProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  // /factory-looms is WORKER-only on the backend (ADMIN/SUPERADMIN bypass
  // every role check). This provider is mounted in WeaverLayout too, and
  // this call previously had no .catch() — a WEAVER caller's 403 here
  // rejected the whole Promise.all and wiped out their own material-issue
  // records (breaking the Confirm Materials tab).
  const { role, user } = useAuth();
  const canReadFactoryLooms = role === "worker" || role === "admin" || role === "superadmin";
  const actingUserId = user?.id ?? STOPGAP_ACTING_USER_ID;

  // GET /material-issues is overridden on the backend to WORKER/WEAVER only
  // (ADMIN/SUPERADMIN bypass every check). This provider is shared across
  // every portal, so an unscoped gate fired this for SHOP/ACCOUNTANT too and
  // they got back nothing but a "your role is not permitted" 403.
  const enabled = useAuthGate("worker", "weaver", "admin", "superadmin");

  const { data: issueRecords = [], isError, error, isLoading, refetch } = useQuery({
    queryKey: ISSUE_RECORDS_KEY,
    enabled,
    queryFn: async () => {
      const [issuesRes, weaversRes, loomsRes] = await Promise.all([
        materialIssuesApi.list(),
        weaversApi.list().catch(() => ({ items: [] as BackendWeaver[] })),
        canReadFactoryLooms
          ? factoryLoomsApi.list().catch(() => ({ items: [] as BackendFactoryLoom[] }))
          : Promise.resolve({ items: [] as BackendFactoryLoom[] }),
      ]);
      const weaverLookup = new Map(weaversRes.items.map((w: BackendWeaver) => [w.id, w.name]));
      const loomLookup = new Map(loomsRes.items.map((l: BackendFactoryLoom) => [l.id, l.code || l.loomNumber]));
      return issuesRes.items.map(r => backendRecordToFrontend(r, weaverLookup, loomLookup));
    },
  });

  const { data: receivedSarees = INITIAL_RECEIVED_SAREES } = useQuery({
    queryKey: RECEIVED_SAREES_KEY,
    enabled,
    queryFn: async () => {
      const res = await materialReturnsApi.list();
      return res.items
        .map(backendReturnToReceivedSaree)
        .filter((r): r is ReceivedSareeRecord => r !== null);
    },
  });

  const addIssueRecordMutation = useMutation({
    mutationFn: async (input: AddIssueRecordInput) => {
      const created = await materialIssuesApi.create({
        weaverId: input.weaverId,
        factoryLoomId: input.factoryLoomId,
        loomNumber: input.loomNumber,
        batchId: input.batchId,
        warpRequestId: input.warpRequestId,
        issuedById: actingUserId,
        signatureMethod: input.signatureMethod === "remote" ? "REMOTE" : "HERE",
        notes: input.notes,
        items: input.materials.map(frontendItemToPayload),
      });

      if (input.signatureMethod === "here" && input.signatureBlob) {
        return materialIssuesApi.sign(created.id, input.signatureBlob);
      }
      // Remote signing has no real device/SMS integration yet (same gap as
      // OTP auth) — the record is created but stays PENDING_SIGNATURE
      // server-side until that lands.
      return created;
    },
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: ISSUE_RECORDS_KEY });
      // Fulfilling a warp request flips it to ISSUED server-side — refresh
      // whatever "approved warp requests" list the Issue Material page has
      // open so the just-fulfilled one drops out of it.
      if (input.warpRequestId) {
        void queryClient.invalidateQueries({ queryKey: ["warp-requests"] });
      }
      toast.success("Materials issued");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to issue materials");
    },
  });

  const deleteIssueRecordMutation = useMutation({
    mutationFn: (id: string) => materialIssuesApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ISSUE_RECORDS_KEY });
    },
  });

  const addReceivedSareeMutation = useMutation({
    mutationFn: (rec: ReceivedSareeRecord) => Promise.resolve(rec),
    onSuccess: (rec) => {
      queryClient.setQueryData<ReceivedSareeRecord[]>(RECEIVED_SAREES_KEY, prev => [rec, ...(prev ?? [])]);
      toast.success("Saree received");
    },
  });

  const updateSignatureStatusMutation = useMutation({
    mutationFn: (args: { recordId: string; signatureBlob: Blob }) =>
      materialIssuesApi.sign(args.recordId, args.signatureBlob),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ISSUE_RECORDS_KEY });
      toast.success("Signature captured");
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to capture signature");
    },
  });

  const finalizeReceivedWeightMutation = useMutation({
    mutationFn: (args: { id: string; finalWeightGrams: number }) => Promise.resolve(args),
    onSuccess: ({ id, finalWeightGrams }) => {
      queryClient.setQueryData<ReceivedSareeRecord[]>(RECEIVED_SAREES_KEY, prev =>
        (prev ?? []).map(r => (r.id === id ? { ...r, finalWeightGrams, tallied: true } : r))
      );
      toast.success("Weight finalized");
    },
  });

  const addIssueRecord = async (input: AddIssueRecordInput): Promise<MaterialIssueRecord> => {
    const created = await addIssueRecordMutation.mutateAsync(input);
    const weaverLookup = new Map(input.weaverId && input.weaverName ? [[input.weaverId, input.weaverName]] : []);
    const loomLookup = new Map(
      input.factoryLoomId && input.factoryLoomNumber ? [[input.factoryLoomId, input.factoryLoomNumber]] : [],
    );
    return backendRecordToFrontend(created, weaverLookup, loomLookup);
  };

  const deleteIssueRecord = (id: string): Promise<void> =>
    deleteIssueRecordMutation.mutateAsync(id).then(() => undefined);

  const getRecordsForWeaver = useCallback((weaverId: string) => {
    return issueRecords.filter(r => r.weaverId === weaverId);
  }, [issueRecords]);

  const addReceivedSaree = (rec: ReceivedSareeRecord) => addReceivedSareeMutation.mutate(rec);

  const getReceivedForWeaver = useCallback((weaverId: string) => {
    return receivedSarees.filter(r => r.weaverId === weaverId);
  }, [receivedSarees]);

  const getReceivedForBatch = useCallback((batchId: string) => {
    return receivedSarees.filter(r => r.batchId === batchId);
  }, [receivedSarees]);

  const getRecordsForBatch = useCallback((batchId: string) => {
    return issueRecords.filter(r => r.batchId === batchId);
  }, [issueRecords]);

  const finalizeReceivedWeight = (id: string, finalWeightGrams: number) =>
    finalizeReceivedWeightMutation.mutate({ id, finalWeightGrams });

  const getMaterialSummaryForWeaver = useCallback((weaverId: string): WeaverMaterialSummary => {
    return summarize(
      issueRecords.filter(r => r.weaverId === weaverId),
      receivedSarees.filter(r => r.weaverId === weaverId),
    );
  }, [issueRecords, receivedSarees]);

  const getMaterialSummaryByBatch = useCallback((weaverId: string): BatchMaterialSummary[] => {
    const records = issueRecords.filter(r => r.weaverId === weaverId);
    const received = receivedSarees.filter(r => r.weaverId === weaverId);
    // Every batch that appears in either issued material or returned sarees.
    const batchIds = Array.from(new Set([
      ...records.map(r => r.batchId || "Unassigned"),
      ...received.map(r => r.batchId || "Unassigned"),
    ]));
    return batchIds
      .map(batchId => ({
        batchId,
        ...summarize(
          records.filter(r => (r.batchId || "Unassigned") === batchId),
          received.filter(r => (r.batchId || "Unassigned") === batchId),
        ),
      }))
      // Show batches with the most material still outstanding first.
      .sort((a, b) => b.outstandingGrams - a.outstandingGrams);
  }, [issueRecords, receivedSarees]);

  const updateSignatureStatus = (recordId: string, signatureBlob: Blob) =>
    updateSignatureStatusMutation.mutateAsync({ recordId, signatureBlob }).then(() => undefined);

  return (
    <MaterialIssueContext.Provider value={{ issueRecords, receivedSarees, addIssueRecord, deleteIssueRecord, addReceivedSaree, getRecordsForWeaver, getRecordsForBatch, getReceivedForWeaver, getReceivedForBatch, getMaterialSummaryForWeaver, getMaterialSummaryByBatch, updateSignatureStatus, finalizeReceivedWeight, isError, error, isLoading, refetch: () => void refetch() }}>
      {children}
    </MaterialIssueContext.Provider>
  );
}

const FALLBACK_MATERIAL_ISSUE: MaterialIssueContextValue = {
  issueRecords: [],
  receivedSarees: [],
  addIssueRecord: async () => ({
    id: "",
    issueNumber: "",
    issuedBy: "",
    issuedAt: "",
    materials: [],
    signatureMethod: "here",
    signatureCaptured: false,
    status: "signed",
  }),
  deleteIssueRecord: async () => {},
  addReceivedSaree: () => {},
  getRecordsForWeaver: () => [],
  getRecordsForBatch: () => [],
  getReceivedForWeaver: () => [],
  getReceivedForBatch: () => [],
  getMaterialSummaryForWeaver: () => ({
    issuedGrams: 0,
    receivedGrams: 0,
    outstandingGrams: 0,
    jariReels: 0,
    sareesReceived: 0,
    totalWarpGrams: 0,
    totalReshamGrams: 0,
    totalJariGrams: 0,
    totalReturnedWarpGrams: 0,
    totalReturnedReshamGrams: 0,
    totalReturnedJariGrams: 0,
    netWarpGrams: 0,
    netReshamGrams: 0,
    netJariGrams: 0,
  }),
  getMaterialSummaryByBatch: () => [],
  updateSignatureStatus: async () => {},
  finalizeReceivedWeight: () => {},
  isError: false,
  error: null,
  isLoading: false,
  refetch: () => {},
};

export function useMaterialIssue(): MaterialIssueContextValue {
  const ctx = useContext(MaterialIssueContext);
  return ctx ?? FALLBACK_MATERIAL_ISSUE;
}
