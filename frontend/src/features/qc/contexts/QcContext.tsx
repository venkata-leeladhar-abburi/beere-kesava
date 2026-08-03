import React, { createContext, useContext, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { INITIAL_RATES } from "../../pricing/components/RatesPricingPage";

// ─── Types ────────────────────────────────────────────────────────────────────
/**
 * Outcome of the Worker Staff quality check on a single saree.
 *  - "passed"    → weaver is paid the full making charge
 *  - "semi"      → saree is usable but flawed; staff withholds a partial amount
 *  - "defective" → saree is rejected; the weaver is NOT paid for it at all
 */
export type QcResult = "passed" | "semi" | "defective";

export interface QcRecord {
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

// ─── Payment rules ────────────────────────────────────────────────────────────
/** Making charge per saree for a saree type code, from the rate card. */
export function makingChargeFor(sareeTypeCode: string | null | undefined): number {
  if (!sareeTypeCode) return 0;
  const rate = INITIAL_RATES.find(r => r.code === sareeTypeCode);
  return rate ? Number(rate.charge) || 0 : 0;
}

/**
 * Single source of truth for how a QC outcome hits the weaver's payment.
 *  defective → the whole making charge is withheld, weaver earns nothing
 *  semi      → staff-entered deduction, capped at the making charge
 *  passed    → nothing withheld
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
  recordQc: (input: RecordQcInput) => QcRecord;
  getQcForSaree: (sareeId: string) => QcRecord | undefined;
  getQcForWeaver: (weaverId: string) => QcRecord[];
  getQcForLoom: (factoryLoomId: string) => QcRecord[];
}

const QcContext = createContext<QcContextValue | null>(null);

// ─── Seed data ────────────────────────────────────────────────────────────────
// Mirrors the QC outcomes already reflected in BatchContext for Ravi Kumar:
// BATCH-094 RAVI-L2-003 is the failed saree surfaced in the weaver portal alert.
function seed(
  sareeId: string,
  batchId: string,
  result: QcResult,
  defects: string[],
  semiDeduction: number,
  receivedDate: string,
  qcDate: string,
  sareeTypeCode = "SB-001",
  sareeTypeName = "Self Brocade",
  bulkOrderLabel: string | null = null,
): QcRecord {
  const makingCharge = makingChargeFor(sareeTypeCode);
  const { deduction, payable } = computeQcPayment(result, makingCharge, semiDeduction);
  return {
    sareeId, batchId, result, defects, makingCharge, deduction, payable,
    receivedDate, qcDate, sareeTypeCode, sareeTypeName, bulkOrderLabel,
    weaverId: "WV-001", weaverName: "Ravi Kumar", loomNumber: 2,
    factoryLoomId: null, factoryLoomNumber: null,
    inspectedBy: "Worker Staff",
  };
}

/** Seed QC outcome for a saree woven on an in-house factory loom. */
function seedLoom(
  sareeId: string,
  batchId: string,
  factoryLoomId: string,
  factoryLoomNumber: string,
  result: QcResult,
  defects: string[],
  semiDeduction: number,
  receivedDate: string,
  qcDate: string,
  sareeTypeCode: string,
  sareeTypeName: string,
  bulkOrderLabel: string | null = null,
): QcRecord {
  const makingCharge = makingChargeFor(sareeTypeCode);
  const { deduction, payable } = computeQcPayment(result, makingCharge, semiDeduction);
  return {
    sareeId, batchId, result, defects, makingCharge, deduction, payable,
    receivedDate, qcDate, sareeTypeCode, sareeTypeName, bulkOrderLabel,
    weaverId: null, weaverName: null, loomNumber: null,
    factoryLoomId, factoryLoomNumber,
    inspectedBy: "Worker Staff",
  };
}

const SEED_QC: QcRecord[] = [
  seed("RAVI-L2-001", "BATCH-094", "passed",    [],                     0,   "2026-06-20", "2026-06-21", "SB-001", "Self Brocade", "Lakshmi Silks · ORD-041"),
  seed("RAVI-L2-002", "BATCH-094", "semi",      ["Jari Issue"],         120, "2026-06-20", "2026-06-22", "SB-001", "Self Brocade", "Lakshmi Silks · ORD-041"),
  seed("RAVI-L2-003", "BATCH-094", "defective", ["Thread Break"],       0,   "2026-06-09", "2026-06-10", "SB-001", "Self Brocade", "Lakshmi Silks · ORD-041"),
  seed("RAVI-L2-004", "BATCH-078", "passed",    [],                     0,   "2026-05-24", "2026-05-25"),
  seed("RAVI-L2-005", "BATCH-078", "passed",    [],                     0,   "2026-05-24", "2026-05-26"),
  seed("RAVI-L2-006", "BATCH-078", "semi",      ["Measurement Error"],  90,  "2026-05-25", "2026-05-27"),
  seed("RAVI-L2-007", "BATCH-078", "passed",    [],                     0,   "2026-05-26", "2026-05-28"),

  // In-house factory loom F-01 (saree ids follow the sales-ledger BKB-F-01-NNN scheme)
  seedLoom("BKB-F-01-001", "BATCH-088", "FL-001", "Loom F-01", "passed",    [],                    0,   "2026-06-18", "2026-06-19", "SB-001", "Self Brocade", "Padma Stores · ORD-038"),
  seedLoom("BKB-F-01-002", "BATCH-088", "FL-001", "Loom F-01", "passed",    [],                    0,   "2026-06-19", "2026-06-20", "SB-001", "Self Brocade", "Padma Stores · ORD-038"),
  seedLoom("BKB-F-01-003", "BATCH-088", "FL-001", "Loom F-01", "semi",      ["Weight Problem"],    150, "2026-06-20", "2026-06-21", "HZ-003", "Heavy Zari",   "Padma Stores · ORD-038"),
  seedLoom("BKB-F-01-004", "BATCH-090", "FL-001", "Loom F-01", "defective", ["Design Error"],      0,   "2026-06-24", "2026-06-25", "SB-001", "Self Brocade", null),
  seedLoom("BKB-F-01-005", "BATCH-090", "FL-001", "Loom F-01", "passed",    [],                    0,   "2026-06-26", "2026-06-27", "SB-001", "Self Brocade", null),
];

const QUERY_KEY = ["qcRecords"] as const;

export function QcProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: qcRecords = SEED_QC } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => Promise.resolve(SEED_QC),
    initialData: SEED_QC,
  });

  const recordQcMutation = useMutation({
    mutationFn: (record: QcRecord) => Promise.resolve(record),
    // Re-inspecting a saree replaces its previous result.
    onSuccess: (record) =>
      queryClient.setQueryData<QcRecord[]>(QUERY_KEY, prev =>
        [record, ...(prev ?? []).filter(r => r.sareeId !== record.sareeId)]
      ),
  });

  const recordQc = (input: RecordQcInput): QcRecord => {
    const makingCharge = makingChargeFor(input.sareeTypeCode);
    const { deduction, payable } = computeQcPayment(input.result, makingCharge, input.semiDeduction ?? 0);
    const now = new Date().toISOString();
    const record: QcRecord = {
      sareeId: input.sareeId,
      weaverId: input.weaverId ?? null,
      weaverName: input.weaverName ?? null,
      factoryLoomId: input.factoryLoomId ?? null,
      factoryLoomNumber: input.factoryLoomNumber ?? null,
      batchId: input.batchId ?? null,
      loomNumber: input.loomNumber ?? null,
      sareeTypeCode: input.sareeTypeCode ?? null,
      sareeTypeName: input.sareeTypeName ?? null,
      bulkOrderLabel: input.bulkOrderLabel ?? null,
      result: input.result,
      defects: input.defects ?? [],
      makingCharge,
      deduction,
      payable,
      receivedDate: input.receivedDate ?? now,
      qcDate: now,
      notes: input.notes,
      photoUrl: input.photoUrl ?? null,
      inspectedBy: input.inspectedBy,
    };
    recordQcMutation.mutate(record);
    return record;
  };

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
    <QcContext.Provider value={{ qcRecords, recordQc, getQcForSaree, getQcForWeaver, getQcForLoom }}>
      {children}
    </QcContext.Provider>
  );
}

const FALLBACK: QcContextValue = {
  qcRecords: SEED_QC,
  recordQc: (() => { throw new Error("recordQc requires a QcProvider"); }) as QcContextValue["recordQc"],
  getQcForSaree: (sareeId: string) => SEED_QC.find(r => r.sareeId === sareeId),
  getQcForWeaver: (weaverId: string) => SEED_QC.filter(r => r.weaverId === weaverId),
  getQcForLoom: (factoryLoomId: string) => SEED_QC.filter(r => r.factoryLoomId === factoryLoomId),
};

export function useQc(): QcContextValue {
  return useContext(QcContext) ?? FALLBACK;
}
