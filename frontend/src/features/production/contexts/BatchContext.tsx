import React, { createContext, useContext, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "../../../shared/api/client";
import { BackendBatch, batchesApi, ReceiveBatchRowPayload } from "../../../shared/api/batches";
import type { BackendQcResult } from "../../../shared/api/qc";
// Type-only: QcContext imports from this module's sibling API layer, so a
// value import here would close a cycle at runtime.
import type { QcResult } from "../../qc/contexts/QcContext";
import { weaversApi } from "../../../shared/api/weavers";
import { factoryLoomsApi } from "../../../shared/api/factory-looms";
import { ratesApi } from "../../../shared/api/rates";
import { useAuth } from "../../../contexts/AuthContext";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface SareeRow {
  serial: number;
  sareeId: string | null;        // null until weaver or factory loom is assigned
  recipientType?: "weaver" | "factoryLoom";
  weaverId: string | null;
  weaverName: string | null;
  weaverInitials: string | null;
  weaverLoom: number | null;     // which of the weaver's own looms (1..weaver's loom count)
  factoryLoomId?: string | null;      // set when recipientType === "factoryLoom"
  factoryLoomNumber?: string | null;  // e.g. "Loom F-02"
  designCode: string | null;
  sareeTypeCode: string | null;
  sareeTypeName: string | null;
  bulkOrderRef: string | null;   // null = General Stock
  bulkOrderLabel: string | null;
  qcPassed?: boolean;            // true once Worker Staff confirms QC passed for this saree
  // Current QC verdict — the latest of possibly several, since anything short
  // of a pass sends the saree back to the weaver to be inspected again.
  // undefined until it has been inspected at all, which qcPassed alone
  // can't express (it is false for both "semi" and "defective").
  qcResult?: QcResult;
  // Failed QC (semi or defective) and sent back to the weaver, not yet
  // received again — the saree is neither produced nor in the QC queue, it is
  // out with the weaver being reworked. Worker Staff's receive queue lists it
  // as a rework.
  awaitingRework?: boolean;
  // True once the saree comes back from finishing — via either the plain
  // Worker Staff receive-back flow or the Raise Quotation receive flow, both
  // of which mark the FinishingAssignment RETURNED.
  finished?: boolean;
  // When `finished` became true (FinishingAssignment.updatedAt) — lets stats
  // credit a saree to the month it actually finished, not the month it
  // originally passed QC.
  finishedAt?: string | null;
  receivedAt: string | null;     // set once Worker Staff receives the finished saree from the weaver/loom
  receivedWeight: string | null;
  receivedColor: string | null;
  receivedPhotoUrl: string | null;
  // Actual material split entered at receipt (warp/resham in grams, jari in
  // reels) — Worker Staff's own entry (auto-computed from the rate card by
  // default, but editable), not a re-derived estimate.
  receivedWarpG: string | null;
  receivedReshamG: string | null;
  receivedJariReels: string | null;
  // Admin's per-saree weight/material verification against the received
  // entry above — distinct from BulkOrder.tallied (order-level count check).
  tallied: boolean;
  talliedBy: string | null;
  talliedAt: string | null;
}

export interface BatchRecord {
  batchId: string;
  totalCount: number;
  dueDate: string;
  rows: SareeRow[];
  // Raw literal union intentionally, not lib/domain/status.ts's ProductionStatus:
  // this is a coarse 3-state batch lifecycle (draft → active → completed) and
  // PRODUCTION_STATUS has no "active" key (its in-progress states are the
  // granular warping/weaving/finishing/qc-* stages) — forcing this onto that
  // taxonomy would misrepresent "active" as one of those specific stages,
  // which the backend doesn't track for a batch as a whole.
  status: "draft" | "active" | "completed";
  createdAt: string;
  updatedAt: string;
}

// ─── Saree ID generation ──────────────────────────────────────────────────────
// Format: {FIRSTNAME_UPPER}-L{LOOM}-B***-{SEQ_3DIGIT}  e.g. RAVI-L2-B***-001
export function generateSareeId(weaverName: string, loom: number, seq: number): string {
  // split() on a non-empty separator regex always yields at least one
  // element, but the type system can't see that — narrow explicitly.
  const first = (weaverName.split(/[\s.]+/)[0] ?? weaverName).toUpperCase();
  return `${first}-L${loom}-B***-${String(seq).padStart(3, "0")}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface BatchContextValue {
  batches: BatchRecord[];
  // Resolves with the *real* backend batch id — on the first save of a new
  // batch this differs from the caller's client-guessed batchId (the
  // server's IdCounter is authoritative), so callers must adopt the
  // returned id rather than assuming their local batchId was persisted.
  saveDraft: (batch: BatchRecord) => Promise<string>;
  updateBatch: (batchId: string, patch: Partial<BatchRecord>) => void;
  receiveRow: (batchId: string, serial: number, payload: ReceiveBatchRowPayload) => Promise<void>;
  tallyRow: (
    batchId: string, serial: number, tallied: boolean, talliedBy?: string,
    corrections?: { weight?: number; warpG?: number; reshamG?: number; jariReels?: number },
  ) => Promise<void>;
  finalizeBatch: (batchId: string) => Promise<void>;
  // Rejects with the backend's message when the batch has existing records
  // (materials issued, QC, finishing) attached — deletion is blocked, not
  // silently ignored.
  deleteBatch: (batchId: string) => Promise<void>;
  /** True when the batch list failed to load — distinct from "no batches". */
  isError: boolean;
  error: unknown;
  nextBatchId: string;
  // Cross-page navigation: set to open a specific batch in BatchCreationPage
  pendingOpenBatchId: string | null;
  setPendingOpenBatchId: (id: string | null) => void;
}

const BatchContext = createContext<BatchContextValue | null>(null);

const QUERY_KEY = ["batches"] as const;

const QC_RESULT_FROM_BACKEND: Record<BackendQcResult, QcResult> = {
  PASSED: "passed",
  SEMI: "semi",
  DEFECTIVE: "defective",
};

function backendBatchToRecord(
  b: BackendBatch,
  weaverLookup: Map<string, { name: string; initials: string }>,
  loomLookup: Map<string, string>,
  sareeTypeNameLookup: Map<string, string>,
): BatchRecord {
  return {
    batchId: b.id,
    totalCount: b.totalCount,
    dueDate: b.dueDate,
    status: b.status === "DRAFT" ? "draft" : b.status === "ACTIVE" ? "active" : "completed",
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
    rows: b.rows.map((r): SareeRow => {
      const weaver = r.weaverId ? weaverLookup.get(r.weaverId) : undefined;
      const qcResult = r.qcRecords?.[0] ? QC_RESULT_FROM_BACKEND[r.qcRecords[0].result] : undefined;
      // The weaver's own loom isn't a stored column — it's baked into the
      // generated sareeId as -L{n}- (see generateSareeId), so recover it
      // from there rather than losing it on every reload.
      const loomMatch = r.sareeId?.match(/-L(\d+)-B/);
      return {
        serial: r.serial,
        sareeId: r.sareeId,
        recipientType: r.recipientType === "WEAVER" ? "weaver" : r.recipientType === "FACTORY_LOOM" ? "factoryLoom" : undefined,
        weaverId: r.weaverId,
        weaverName: weaver?.name ?? null,
        weaverInitials: weaver?.initials ?? null,
        weaverLoom: loomMatch ? parseInt(loomMatch[1], 10) : null,
        factoryLoomId: r.factoryLoomId,
        factoryLoomNumber: r.factoryLoomId ? (loomLookup.get(r.factoryLoomId) ?? null) : null,
        designCode: r.designCode,
        sareeTypeCode: r.sareeTypeCode,
        sareeTypeName: r.sareeTypeCode ? (sareeTypeNameLookup.get(r.sareeTypeCode) ?? r.sareeTypeCode) : null,
        bulkOrderRef: r.bulkOrderRef,
        bulkOrderLabel: r.bulkOrderRef,
        qcPassed: r.qcPassed ?? undefined,
        qcResult,
        // The backend clears receivedAt on a semi or defective verdict precisely so the
        // saree falls back into the receive queue, so "semi/defective + not received"
        // is exactly the out-for-rework state.
        awaitingRework: (qcResult === "semi" || qcResult === "defective") && !r.receivedAt,
        finished: r.finishingAssignment?.status === "RETURNED",
        finishedAt: r.finishingAssignment?.status === "RETURNED" ? r.finishingAssignment.updatedAt : null,
        receivedAt: r.receivedAt,
        receivedWeight: r.receivedWeight,
        receivedColor: r.receivedColor,
        receivedPhotoUrl: r.receivedPhotoUrl,
        receivedWarpG: r.receivedWarpG,
        receivedReshamG: r.receivedReshamG,
        receivedJariReels: r.receivedJariReels,
        tallied: r.tallied,
        talliedBy: r.talliedBy,
        talliedAt: r.talliedAt,
      };
    }),
  };
}

export function BatchProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [pendingOpenBatchId, setPendingOpenBatchId] = useState<string | null>(null);
  // /factory-looms is WORKER-only and /rates is ACCOUNTANT-only on the
  // backend (ADMIN/SUPERADMIN bypass every role check) — a WEAVER caller
  // (this provider is also mounted in WeaverLayout) would always 403 on
  // both, so skip each call for roles that can't read it rather than firing
  // a guaranteed-403 request just to fall back to an empty lookup.
  const { role } = useAuth();
  const canReadFactoryLooms = role === "worker" || role === "admin" || role === "superadmin";
  const canReadRates = role === "accountant" || role === "admin" || role === "superadmin";

  const { data: batches = [], isError, error } = useQuery({
    queryKey: QUERY_KEY,
    // Retry transient failures (429 burst on a hard refresh, network blip)
    // a couple of times before surfacing an error — but never retry an auth
    // failure (401/403), which won't resolve itself no matter how many
    // times it's retried.
    retry: (failureCount, err) =>
      failureCount < 2 && !(err instanceof ApiError && (err.statusCode === 401 || err.statusCode === 403)),
    queryFn: async () => {
      // The batch list itself is NOT swallowed: if it fails, the query must
      // fail so consumers can tell "you have no batches" apart from "we
      // couldn't load your batches" (e.g. a 403 from a stale weaver token,
      // which otherwise renders as a silently empty portal).
      const batchesRes = await batchesApi.list();
      // The three lookups only decorate rows with display names, so a
      // failure there degrades labels rather than hiding real batches.
      const [weaversRes, loomsRes, ratesRes] = await Promise.all([
        weaversApi.list().catch(() => ({ items: [] })),
        canReadFactoryLooms ? factoryLoomsApi.list().catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
        canReadRates ? ratesApi.list().catch(() => ({ items: [] })) : Promise.resolve({ items: [] }),
      ]);
      const weaverLookup = new Map(
        (weaversRes?.items || []).map(w => [w.id, { name: w.name, initials: w.initials }]),
      );
      const loomLookup = new Map((loomsRes?.items || []).map(l => [l.id, l.loomNumber]));
      const sareeTypeNameLookup = new Map((ratesRes?.items || []).map(r => [r.code, r.type]));
      return (batchesRes?.items || []).map(b => backendBatchToRecord(b, weaverLookup, loomLookup, sareeTypeNameLookup));
    },
  });

  // Persists a full BatchRecord: creates the batch server-side if it doesn't
  // exist yet (the client-guessed batchId is only a display preview — the
  // real id comes back from POST /batches), then assigns every row that has
  // a recipient + saree type set (designCode is optional — see assignRow).
  // Re-running this on an already assigned row is safe: saree-id generation
  // is deterministic given the same inputs, so it's idempotent.
  const saveDraftMutation = useMutation({
    mutationFn: async (batch: BatchRecord) => {
      const existing = queryClient
        .getQueryData<BatchRecord[]>(QUERY_KEY)
        ?.find(b => b.batchId === batch.batchId);

      const realBatchId = existing
        ? batch.batchId
        : (await batchesApi.create({ totalCount: batch.totalCount, dueDate: batch.dueDate })).id;

      for (const row of batch.rows) {
        const recipientType = row.weaverId ? "WEAVER" : row.factoryLoomId ? "FACTORY_LOOM" : null;
        if (!recipientType || !row.sareeTypeCode) continue;

        await batchesApi.assignRow(realBatchId, row.serial, {
          recipientType,
          weaverId: row.weaverId ?? undefined,
          factoryLoomId: row.factoryLoomId ?? undefined,
          designCode: row.designCode ?? undefined,
          sareeTypeCode: row.sareeTypeCode,
          // Persists the row's bulk-order link so it survives a refetch —
          // previously withheld because the backend wrote an unvalidated FK
          // (any bad ref 500'd); assignRow now validates it and returns a
          // clean 404 instead, so it's safe to send. Without this, a saree's
          // link to its bulk order lived only in local draft state and was
          // lost the moment the batch list refetched, leaving the order's
          // Sarees tab to rely entirely on a fragile design/type name match.
          bulkOrderRef: row.bulkOrderRef ?? undefined,
          loomNumber: row.weaverLoom ?? undefined,
        });
      }

      return realBatchId;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Batch saved");
    },
    onError: (err) => {
      // eslint-disable-next-line no-console -- surface save failures instead of failing silently
      console.error("Failed to save batch draft:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save batch draft");
    },
  });

  // Local-only — nothing currently calls updateBatch with real persisted
  // fields; kept as an optimistic client patch so the exported context shape
  // stays stable for any future/indirect caller.
  const updateBatchMutation = useMutation({
    mutationFn: (args: { batchId: string; patch: Partial<BatchRecord> }) => Promise.resolve(args),
    onSuccess: ({ batchId, patch }) =>
      queryClient.setQueryData<BatchRecord[]>(QUERY_KEY, prev =>
        (prev ?? []).map(b => b.batchId === batchId ? { ...b, ...patch, updatedAt: new Date().toISOString() } : b)
      ),
  });

  const tallyRowMutation = useMutation({
    mutationFn: (args: { batchId: string; serial: number; tallied: boolean; talliedBy?: string; weight?: number; warpG?: number; reshamG?: number; jariReels?: number }) =>
      batchesApi.tallyRow(args.batchId, args.serial, {
        tallied: args.tallied, talliedBy: args.talliedBy,
        weight: args.weight, warpG: args.warpG, reshamG: args.reshamG, jariReels: args.jariReels,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["bulkOrders"] });
    },
    onError: (err) => {
      // eslint-disable-next-line no-console -- surface tally failures instead of failing silently
      console.error("Failed to tally saree:", err);
      toast.error(err instanceof Error ? err.message : "Failed to tally saree");
    },
  });

  const receiveRowMutation = useMutation({
    mutationFn: (args: { batchId: string; serial: number; payload: ReceiveBatchRowPayload }) =>
      batchesApi.receiveRow(args.batchId, args.serial, args.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => {
      // eslint-disable-next-line no-console -- surface receive failures instead of failing silently
      console.error("Failed to receive batch row:", err);
    },
  });

  const finalizeBatchMutation = useMutation({
    mutationFn: (batchId: string) => batchesApi.finalize(batchId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Batch finalized");
    },
    onError: (err) => {
      // eslint-disable-next-line no-console -- surface finalize failures instead of failing silently
      console.error("Failed to finalize batch:", err);
      toast.error(err instanceof Error ? err.message : "Failed to finalize batch");
    },
  });

  const deleteBatchMutation = useMutation({
    mutationFn: (batchId: string) => batchesApi.remove(batchId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      // The backend cascades the delete onto that batch's QC records,
      // finishing assignments, and inventory/saree rows — so anything
      // derived from those (readySarees, finishing assignments/returns,
      // quotations, and the bulk-order "produced" counts computed from
      // them) is now stale and needs refetching too, or a deleted batch's
      // saree keeps showing as "produced" until a full page reload.
      void queryClient.invalidateQueries({ queryKey: ["finishing"] });
      void queryClient.invalidateQueries({ queryKey: ["bulkOrders"] });
      toast.success("Batch deleted");
    },
    onError: (err) => {
      // A 404 here means the batch is already gone — deleteBatch() below
      // treats that as the caller's desired end state, not a real failure,
      // so it shouldn't surface as an error toast.
      if (err instanceof ApiError && err.statusCode === 404) return;
      toast.error(err instanceof Error ? err.message : "Failed to delete batch");
    },
  });

  const saveDraft = (batch: BatchRecord) => saveDraftMutation.mutateAsync(batch);
  const updateBatch = (batchId: string, patch: Partial<BatchRecord>) => updateBatchMutation.mutate({ batchId, patch });
  const receiveRow = (batchId: string, serial: number, payload: ReceiveBatchRowPayload) =>
    receiveRowMutation.mutateAsync({ batchId, serial, payload }).then(() => undefined);
  const tallyRow = (
    batchId: string, serial: number, tallied: boolean, talliedBy?: string,
    corrections?: { weight?: number; warpG?: number; reshamG?: number; jariReels?: number },
  ) =>
    tallyRowMutation.mutateAsync({ batchId, serial, tallied, talliedBy, ...corrections }).then(() => undefined);
  const finalizeBatch = (batchId: string) => finalizeBatchMutation.mutateAsync(batchId).then(() => undefined);
  // A 404 here means the batch is already gone (another tab deleted it, or
  // it's a stale entry) — that's the caller's desired end state either way,
  // so resolve instead of rejecting; just make sure the stale list clears.
  const deleteBatch = (batchId: string) =>
    deleteBatchMutation.mutateAsync(batchId).then(
      () => undefined,
      (err: unknown) => {
        if (err instanceof ApiError && err.statusCode === 404) {
          void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
          return undefined;
        }
        throw err;
      },
    );

  const nextBatchId = useMemo(() => {
    const batchList = Array.isArray(batches) ? batches : [];
    const allNums = batchList
      .map(b => { const m = b.batchId?.match(/BATCH-(\d+)/); return m ? parseInt(m[1] ?? "0", 10) : 0; })
      .filter(n => n > 0);
    const maxNum = allNums.length > 0 ? Math.max(...allNums) : 0;
    return `BATCH-${String(maxNum + 1).padStart(3, "0")}`;
  }, [batches]);

  const safeBatches = Array.isArray(batches) ? batches : [];

  return (
    <BatchContext.Provider value={{ batches: safeBatches, saveDraft, updateBatch, receiveRow, tallyRow, finalizeBatch, deleteBatch, isError, error, nextBatchId, pendingOpenBatchId, setPendingOpenBatchId }}>
      {children}
    </BatchContext.Provider>
  );
}

export function useBatches(): BatchContextValue {
  const ctx = useContext(BatchContext);
  if (!ctx) throw new Error("useBatches must be used inside BatchProvider");
  return ctx;
}
