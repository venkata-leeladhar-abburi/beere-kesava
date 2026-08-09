import React, { createContext, useContext, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "../../../shared/api/client";
import { BackendBatch, batchesApi } from "../../../shared/api/batches";
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
  receivedAt: string | null;     // set once Worker Staff receives the finished saree from the weaver/loom
  receivedWeight: string | null;
  receivedColor: string | null;
  receivedPhotoUrl: string | null;
}

export interface BatchRecord {
  batchId: string;
  totalCount: number;
  dueDate: string;
  rows: SareeRow[];
  status: "draft" | "active" | "completed";
  createdAt: string;
  updatedAt: string;
}

// ─── Saree ID generation ──────────────────────────────────────────────────────
// Format: {FIRSTNAME_UPPER}-L{LOOM}-{SEQ_3DIGIT}  e.g. RAVI-L2-001
export function generateSareeId(weaverName: string, loom: number, seq: number): string {
  // split() on a non-empty separator regex always yields at least one
  // element, but the type system can't see that — narrow explicitly.
  const first = (weaverName.split(/[\s.]+/)[0] ?? weaverName).toUpperCase();
  return `${first}-L${loom}-${String(seq).padStart(3, "0")}`;
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
  receiveRow: (batchId: string, serial: number, payload: { weight: number; color?: string; photoUrl?: string }) => Promise<void>;
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
      return {
        serial: r.serial,
        sareeId: r.sareeId,
        recipientType: r.recipientType === "WEAVER" ? "weaver" : r.recipientType === "FACTORY_LOOM" ? "factoryLoom" : undefined,
        weaverId: r.weaverId,
        weaverName: weaver?.name ?? null,
        weaverInitials: weaver?.initials ?? null,
        weaverLoom: null,
        factoryLoomId: r.factoryLoomId,
        factoryLoomNumber: r.factoryLoomId ? (loomLookup.get(r.factoryLoomId) ?? null) : null,
        designCode: r.designCode,
        sareeTypeCode: r.sareeTypeCode,
        sareeTypeName: r.sareeTypeCode ? (sareeTypeNameLookup.get(r.sareeTypeCode) ?? r.sareeTypeCode) : null,
        bulkOrderRef: r.bulkOrderRef,
        bulkOrderLabel: r.bulkOrderRef,
        qcPassed: r.qcPassed ?? undefined,
        receivedAt: r.receivedAt,
        receivedWeight: r.receivedWeight,
        receivedColor: r.receivedColor,
        receivedPhotoUrl: r.receivedPhotoUrl,
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

  const receiveRowMutation = useMutation({
    mutationFn: (args: { batchId: string; serial: number; payload: { weight: number; color?: string; photoUrl?: string } }) =>
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
  const receiveRow = (batchId: string, serial: number, payload: { weight: number; color?: string; photoUrl?: string }) =>
    receiveRowMutation.mutateAsync({ batchId, serial, payload }).then(() => undefined);
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
    <BatchContext.Provider value={{ batches: safeBatches, saveDraft, updateBatch, receiveRow, finalizeBatch, deleteBatch, isError, error, nextBatchId, pendingOpenBatchId, setPendingOpenBatchId }}>
      {children}
    </BatchContext.Provider>
  );
}

export function useBatches(): BatchContextValue {
  const ctx = useContext(BatchContext);
  if (!ctx) throw new Error("useBatches must be used inside BatchProvider");
  return ctx;
}
