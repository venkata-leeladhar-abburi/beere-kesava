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
import { BackendWeaver, weaversApi } from "../../../shared/api/weavers";
import { BackendFactoryLoom, factoryLoomsApi } from "../../../shared/api/factory-looms";
import { STOPGAP_ACTING_USER_ID } from "../../../shared/api/purchase-requests";
import { useAuth } from "../../../contexts/AuthContext";

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
}

export interface MaterialIssueRecord {
  id: string;               // auto-generated e.g. "MIR-2026-001"
  weaverId?: string;         // set when issued to a weaver
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
  status: "pending-signature" | "signed" | "cancelled";
}

// ─── Backend <-> frontend enum mapping ─────────────────────────────────────────
const MATERIAL_TYPE_TO_BACKEND: Record<IssuedMaterialItem["materialType"], BackendMaterialType> = {
  Warp: "WARP",
  Resham: "RESHAM",
  Jari: "JARI",
};
const MATERIAL_TYPE_FROM_BACKEND: Record<BackendMaterialType, IssuedMaterialItem["materialType"]> = {
  WARP: "Warp",
  RESHAM: "Resham",
  JARI: "Jari",
};
const WARP_SUBTYPE_TO_BACKEND: Record<string, BackendWarpSubtype> = {
  "Resham Warp": "RESHAM_WARP",
  "Jari Warp": "JARI_WARP",
};
const WARP_SUBTYPE_FROM_BACKEND: Record<BackendWarpSubtype, "Resham Warp" | "Jari Warp"> = {
  RESHAM_WARP: "Resham Warp",
  JARI_WARP: "Jari Warp",
};
const JARI_GRADE_TO_BACKEND: Record<string, BackendJariGrade> = {
  "1G": "G1", "2G": "G2", "3G": "G3", "4G": "G4", "5G": "G5",
};
const JARI_GRADE_FROM_BACKEND: Record<BackendJariGrade, "1G" | "2G" | "3G" | "4G" | "5G"> = {
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
    weaverName: r.weaverId ? weaverLookup.get(r.weaverId) : undefined,
    loomNumber: r.loomNumber ? Number(r.loomNumber) : undefined,
    batchId: r.batchId ?? undefined,
    factoryLoomId: r.factoryLoomId ?? undefined,
    factoryLoomNumber: r.factoryLoomId ? loomLookup.get(r.factoryLoomId) : undefined,
    issuedBy: "Admin (Kesava Rao)",
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
  };
}

// ─── Material weight conversion ───────────────────────────────────────────────
// One reel of Jari weighs 230 grams; a Bun is 4 reels (see IssueMaterialPage).
export const JARI_REEL_GRAMS = 230;
export const REELS_PER_BUN = 4;

/** Convert a single issued material line into grams. */
export function materialItemToGrams(m: IssuedMaterialItem): number {
  const qty = m.quantity || 0;
  if (m.materialType === "Jari") {
    const unit = (m.unit || "").toLowerCase();
    if (unit.startsWith("bun")) return qty * REELS_PER_BUN * JARI_REEL_GRAMS;
    // default: Reels
    return qty * JARI_REEL_GRAMS;
  }
  // Warp / Resham are weight-based
  const unit = (m.unit || "").toLowerCase();
  if (unit === "g" || unit === "gram" || unit === "grams") return qty;
  return qty * 1000; // kg → g
}

// ─── Received sarees (returned by weaver, weighed by worker staff) ─────────────
// NOTE(backend gap): there is no backend model for tracking returned/weighed
// sarees yet — MaterialIssuesModule only covers the outbound issuance record.
// This stays local/mock (like the remote-signature confirmation flow below)
// until that's built; wiring it here would just be a differently-shaped mock.
export interface ReceivedSareeRecord {
  id: string;          // Saree ID e.g. "RAVI-L2-004"
  weaverId: string;
  batchId?: string;
  weightGrams: number;        // provisional weight entered by worker staff at receipt
  finalWeightGrams?: number;  // final weight entered by admin during tally
  tallied?: boolean;          // true once admin has confirmed the tally for this series
  receivedAt: string;  // ISO date-time
  color?: string;
  status: "received" | "defective";
}

const INITIAL_RECEIVED_SAREES: ReceivedSareeRecord[] = [];

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
        ? (m.quantity || 0) * REELS_PER_BUN
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
  getReceivedForWeaver: (weaverId: string) => ReceivedSareeRecord[];
  getReceivedForBatch: (batchId: string) => ReceivedSareeRecord[];
  getMaterialSummaryForWeaver: (weaverId: string) => WeaverMaterialSummary;
  getMaterialSummaryByBatch: (weaverId: string) => BatchMaterialSummary[];
  updateSignatureStatus: (recordId: string, method: "here" | "remote") => void;
  finalizeReceivedWeight: (id: string, finalWeightGrams: number) => void;
  isError: boolean;
  error: unknown;
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

  const { data: issueRecords = [], isError, error } = useQuery({
    queryKey: ISSUE_RECORDS_KEY,
    queryFn: async () => {
      const [issuesRes, weaversRes, loomsRes] = await Promise.all([
        materialIssuesApi.list(),
        weaversApi.list().catch(() => ({ items: [] as BackendWeaver[] })),
        canReadFactoryLooms
          ? factoryLoomsApi.list().catch(() => ({ items: [] as BackendFactoryLoom[] }))
          : Promise.resolve({ items: [] as BackendFactoryLoom[] }),
      ]);
      const weaverLookup = new Map(weaversRes.items.map((w: BackendWeaver) => [w.id, w.name]));
      const loomLookup = new Map(loomsRes.items.map((l: BackendFactoryLoom) => [l.id, l.loomNumber]));
      return issuesRes.items.map(r => backendRecordToFrontend(r, weaverLookup, loomLookup));
    },
  });

  const { data: receivedSarees = INITIAL_RECEIVED_SAREES } = useQuery({
    queryKey: RECEIVED_SAREES_KEY,
    queryFn: () => Promise.resolve(INITIAL_RECEIVED_SAREES),
    initialData: INITIAL_RECEIVED_SAREES,
  });

  const addIssueRecordMutation = useMutation({
    mutationFn: async (input: AddIssueRecordInput) => {
      const created = await materialIssuesApi.create({
        weaverId: input.weaverId,
        factoryLoomId: input.factoryLoomId,
        loomNumber: input.loomNumber,
        batchId: input.batchId,
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ISSUE_RECORDS_KEY });
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
    mutationFn: (args: { recordId: string; method: "here" | "remote" }) => Promise.resolve(args),
    onSuccess: ({ recordId, method }) => {
      queryClient.setQueryData<MaterialIssueRecord[]>(ISSUE_RECORDS_KEY, prev =>
        (prev ?? []).map(r =>
          r.id === recordId
            ? { ...r, signatureMethod: method, signatureCaptured: true, signatureTimestamp: new Date().toISOString(), status: "signed" as const }
            : r
        )
      );
      toast.success("Signature captured");
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

  const updateSignatureStatus = (recordId: string, method: "here" | "remote") =>
    updateSignatureStatusMutation.mutate({ recordId, method });

  return (
    <MaterialIssueContext.Provider value={{ issueRecords, receivedSarees, addIssueRecord, deleteIssueRecord, addReceivedSaree, getRecordsForWeaver, getReceivedForWeaver, getReceivedForBatch, getMaterialSummaryForWeaver, getMaterialSummaryByBatch, updateSignatureStatus, finalizeReceivedWeight, isError, error }}>
      {children}
    </MaterialIssueContext.Provider>
  );
}

export function useMaterialIssue(): MaterialIssueContextValue {
  const ctx = useContext(MaterialIssueContext);
  if (!ctx) throw new Error("useMaterialIssue must be used inside MaterialIssueProvider");
  return ctx;
}
