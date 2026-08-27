import React, { createContext, useContext, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRatesPricing } from "@/features/pricing";
import { type SareeTypeRecord } from "@/features/pricing";
import { BackendQcRecord, BackendQcResult, qcApi } from "../../../shared/api/qc";
import { weaversApi, BackendWeaver } from "../../../shared/api/weavers";
import { factoryLoomsApi, BackendFactoryLoom } from "../../../shared/api/factory-looms";
import { batchesApi, BackendBatch, BackendBatchSareeRow } from "../../../shared/api/batches";
import { STOPGAP_ACTING_USER_ID } from "../../../shared/api/purchase-requests";
import { useAuth, useAuthGate } from "../../../contexts/AuthContext";
import { resolveAssetUrl, toStoredAssetPath } from "../../../shared/api/uploads";

// ─── Types ────────────────────────────────────────────────────────────────────
/**
 * Outcome of the Worker Staff quality check on a single saree.
 *  - "passed"    → weaver is paid the full making charge
 *  - "semi"      → saree is usable but flawed; staff withholds a partial amount
 *  - "defective" → saree is rejected; the weaver is NOT paid for it at all
 */
export type QcResult = "passed" | "semi" | "defective";

export interface QcRecord {
  /** The QC record's own id — distinct from sareeId, which repeats across a
   *  saree's inspection history (fail, rework, re-inspect). Use this as the
   *  React list key wherever a saree can appear more than once. */
  id: string;
  sareeId: string;
  /** Set when the saree was woven by an outsourced weaver. */
  weaverId: string | null;
  weaverName: string | null;
  /** Set instead of weaverId when the saree was woven on an in-house factory loom. */
  factoryLoomId: string | null;
  factoryLoomNumber: string | null;
  batchId: string | null;
  loomNumber: number | null;
  sareeTypeCode: string | null;
  sareeTypeName: string | null;
  bulkOrderLabel: string | null;

  result: QcResult;
  defects: string[];

  /** Full making charge for this saree type, before any QC deduction. */
  makingCharge: number;
  /** Amount withheld from the weaver. Always === makingCharge when defective. */
  deduction: number;
  /** What the weaver actually earns for this saree. Always 0 when defective. */
  payable: number;

  /** ISO date the woven saree was received from the weaver for inspection. */
  receivedDate: string;
  /** ISO date the quality check was completed. */
  qcDate: string;

  notes?: string;
  photoUrl?: string | null;
  inspectedBy?: string;
}

// ─── Backend <-> frontend enum mapping ─────────────────────────────────────────
const RESULT_TO_BACKEND: Record<QcResult, BackendQcResult> = {
  passed: "PASSED",
  semi: "SEMI",
  defective: "DEFECTIVE",
};
const RESULT_FROM_BACKEND: Record<BackendQcResult, QcResult> = {
  PASSED: "passed",
  SEMI: "semi",
  DEFECTIVE: "defective",
};



/**
 * Single source of truth for how a QC outcome hits the weaver's payment.
 *  defective → the whole making charge is withheld, weaver earns nothing
 *  semi      → staff-entered deduction, capped at the making charge
 *  passed    → nothing withheld
 * Mirrors the backend's computeQcPayment in qc.service.ts exactly — the
 * server is authoritative (it knows the real makingCharge), this is only
 * used for optimistic client-side preview before the record is saved.
 */
export function computeQcPayment(
  result: QcResult,
  makingCharge: number,
  semiDeduction = 0,
): { deduction: number; payable: number } {
  if (result === "defective") return { deduction: makingCharge, payable: 0 };
  if (result === "semi") {
    const d = Math.min(Math.max(semiDeduction, 0), makingCharge);
    return { deduction: d, payable: makingCharge - d };
  }
  return { deduction: 0, payable: makingCharge };
}

export const QC_RESULT_LABEL: Record<QcResult, string> = {
  passed: "QC Passed",
  semi: "Semi-Approved",
  defective: "Defective",
};

// ─── Context ──────────────────────────────────────────────────────────────────
export interface RecordQcInput {
  sareeId: string;
  weaverId?: string | null;
  weaverName?: string | null;
  factoryLoomId?: string | null;
  factoryLoomNumber?: string | null;
  batchId?: string | null;
  loomNumber?: number | null;
  sareeTypeCode?: string | null;
  sareeTypeName?: string | null;
  bulkOrderLabel?: string | null;
  result: QcResult;
  defects?: string[];
  /** Only used when result === "semi"; ignored for passed / defective. */
  semiDeduction?: number;
  receivedDate?: string;
  notes?: string;
  photoUrl?: string | null;
  inspectedBy?: string;
}

interface QcContextValue {
  qcRecords: QcRecord[];
  recordQc: (input: RecordQcInput) => Promise<void>;
  getQcForSaree: (sareeId: string) => QcRecord | undefined;
  getQcForWeaver: (weaverId: string) => QcRecord[];
  getQcForLoom: (factoryLoomId: string) => QcRecord[];
  isError: boolean;
  error: unknown;
  isLoading: boolean;
  refetch: () => void;
}

const QcContext = createContext<QcContextValue | null>(null);

const QUERY_KEY = ["qcRecords"] as const;

function backendRecordToFrontend(
  r: BackendQcRecord,
  weaverLookup: Map<string, string>,
  loomLookup: Map<string, string>,
  rowLookup: Map<string, BackendBatchSareeRow>,
  getSareeTypeByCode: (code: string) => SareeTypeRecord | undefined
): QcRecord {
  const row = rowLookup.get(r.sareeId);
  return {
    id: r.id,
    sareeId: r.sareeId,
    weaverId: r.weaverId,
    weaverName: r.weaverId ? (weaverLookup.get(r.weaverId) ?? null) : null,
    factoryLoomId: r.factoryLoomId,
    factoryLoomNumber: r.factoryLoomId ? (loomLookup.get(r.factoryLoomId) ?? null) : null,
    batchId: r.batchId,
    loomNumber: null,
    sareeTypeCode: row?.sareeTypeCode ?? null,
    sareeTypeName: row?.sareeTypeCode ? (getSareeTypeByCode(row.sareeTypeCode)?.type ?? row.sareeTypeCode) : null,
    bulkOrderLabel: row?.bulkOrderRef ?? null,
    result: RESULT_FROM_BACKEND[r.result],
    defects: r.defects,
    makingCharge: Number(r.makingCharge),
    deduction: Number(r.deduction),
    payable: Number(r.payable),
    receivedDate: r.receivedDate,
    qcDate: r.qcDate,
    notes: r.notes ?? undefined,
    photoUrl: resolveAssetUrl(r.photoUrl),
    // Real name of whoever performed the check — joined server-side onto
    // QcRecord.inspectedById. Falls back to a generic label only when that
    // relation is genuinely missing (legacy record with no resolvable user).
    inspectedBy: r.inspectedBy ? `${r.inspectedBy.firstName} ${r.inspectedBy.lastName}`.trim() : "Worker Staff",
  };
}

export function QcProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  // /factory-looms is WORKER-only on the backend (ADMIN/SUPERADMIN bypass
  // every role check). This provider is mounted globally (App.tsx) for
  // every role, so a WEAVER caller would always 403 here — and since this
  // call wasn't caught, that 403 rejected the whole Promise.all and wiped
  // out the weaver's own QC records too. Skip the call for roles that can
  // never read it, and fall back gracefully either way.
  const { role, user } = useAuth();
  const canReadFactoryLooms = role === "worker" || role === "admin" || role === "superadmin";
  const { getSareeTypeByCode } = useRatesPricing();

  // GET /qc and GET /batches (also fetched below) are both WORKER/WEAVER-
  // only on the backend (ADMIN/SUPERADMIN bypass every role check). This
  // provider is shared across every portal, so an unscoped gate fired this
  // for SHOP/ACCOUNTANT too and they got back nothing but a "your role is
  // not permitted" 403.
  const enabled = useAuthGate("worker", "weaver", "admin", "superadmin");

  const { data: qcRecords = [], isError, error, isLoading, refetch } = useQuery({
    queryKey: QUERY_KEY,
    enabled,
    queryFn: async () => {
      const [qcRes, weaversRes, loomsRes, batchesRes] = await Promise.all([
        qcApi.list(),
        weaversApi.list().catch(() => ({ items: [] as BackendWeaver[] })),
        canReadFactoryLooms
          ? factoryLoomsApi.list().catch(() => ({ items: [] as BackendFactoryLoom[] }))
          : Promise.resolve({ items: [] as BackendFactoryLoom[] }),
        batchesApi.list().catch(() => ({ items: [] as BackendBatch[] })),
      ]);
      const weaverLookup = new Map(weaversRes.items.map(w => [w.id, w.name]));
      const loomLookup = new Map(loomsRes.items.map(l => [l.id, l.code || l.loomNumber]));
      const rowLookup = new Map(
        batchesRes.items.flatMap(b => b.rows.filter(r => r.sareeId).map(r => [r.sareeId as string, r] as const)),
      );
      return qcRes.items.map(r => backendRecordToFrontend(r, weaverLookup, loomLookup, rowLookup, getSareeTypeByCode));
    },
  });

  const recordQcMutation = useMutation({
    mutationFn: (input: RecordQcInput) =>
      qcApi.create({
        sareeId: input.sareeId,
        result: RESULT_TO_BACKEND[input.result],
        defects: input.defects,
        semiDeduction: input.result === "semi" ? (input.semiDeduction ?? 0) : undefined,
        notes: input.notes,
        photoUrl: toStoredAssetPath(input.photoUrl) ?? undefined,
        inspectedById: user?.id ?? STOPGAP_ACTING_USER_ID,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      // The backend derives the ready-for-finishing queue from QC results,
      // so a new QC record can change it too.
      void queryClient.invalidateQueries({ queryKey: ["finishing", "readySarees"] });
    },
    onError: (err) => {
      console.error("Failed to record QC result:", err);
    },
  });

  const recordQc = (input: RecordQcInput): Promise<void> =>
    recordQcMutation.mutateAsync(input).then(() => undefined);

  const getQcForSaree = useCallback(
    (sareeId: string) => qcRecords.find(r => r.sareeId === sareeId),
    [qcRecords],
  );

  const getQcForWeaver = useCallback(
    (weaverId: string) => qcRecords.filter(r => r.weaverId === weaverId),
    [qcRecords],
  );

  const getQcForLoom = useCallback(
    (factoryLoomId: string) => qcRecords.filter(r => r.factoryLoomId === factoryLoomId),
    [qcRecords],
  );

  return (
    <QcContext.Provider value={{ qcRecords, recordQc, getQcForSaree, getQcForWeaver, getQcForLoom, isError, error, isLoading, refetch: () => void refetch() }}>
      {children}
    </QcContext.Provider>
  );
}

const FALLBACK: QcContextValue = {
  qcRecords: [],
  recordQc: () => Promise.reject(new Error("recordQc requires a QcProvider")),
  getQcForSaree: () => undefined,
  getQcForWeaver: () => [],
  getQcForLoom: () => [],
  isError: false,
  error: null,
  isLoading: false,
  refetch: () => {},
};

export function useQc(): QcContextValue {
  return useContext(QcContext) ?? FALLBACK;
}
