import { useMemo } from "react";
import { useBatches } from "@/features/production";
import { useQc } from "@/features/qc";
import { useFinishing } from "@/features/finishing";
import { useSales } from "@/features/customers";
import { useDesignLibrary } from "@/features/design-library";
import { WeaverSareeRow } from "./types";

interface UseWeaverSareeRowsOptions {
  weaverId?: string;
  isLoom: boolean;
  isAll: boolean;
}

export function useWeaverSareeRows({ weaverId, isLoom, isAll }: UseWeaverSareeRowsOptions): WeaverSareeRow[] {
  const { batches } = useBatches();
  const { qcRecords: allQcRecords, getQcForWeaver, getQcForLoom } = useQc();
  const { readySarees, assignments, returns, dispatches } = useFinishing();
  const { sarees: allStock, soldSareeIds } = useSales();
  const { getDesign } = useDesignLibrary();

  const qcRecords = isAll ? allQcRecords : isLoom ? getQcForLoom(weaverId!) : getQcForWeaver(weaverId!);

  return useMemo<WeaverSareeRow[]>(() => {
    const byId = new Map<string, WeaverSareeRow>();

    const blank = (sareeId: string): WeaverSareeRow => ({
      sareeId, batchId: null, loomNumber: null, sareeTypeCode: null, sareeTypeName: null,
      bulkOrderLabel: null, designCode: null, color: null, receivedPhotoUrl: null,
      isAssigned: false, assignedDate: null, qcStatus: "pending",
      receivedDate: null, qcDate: null, defects: [], makingCharge: null, deduction: null,
      payable: null, finishingStatus: "none", finishingAssignedDate: null,
      finishingCompletedDate: null, stock: null, dispatched: false, sold: false,
      ownerKind: null, ownerId: null, ownerLabel: null,
    });

    // 1. Sarees assigned to this weaver/loom (or everyone, in "all" mode) through production batches
    batches.forEach(b => {
      b.rows.forEach(r => {
        const rowIsLoom = r.recipientType === "factoryLoom";
        const belongs = isAll ? true : isLoom ? r.factoryLoomId === weaverId : r.weaverId === weaverId;
        if (!belongs || !r.sareeId) return;
        const row = byId.get(r.sareeId) ?? blank(r.sareeId);
        row.batchId = b.batchId;
        row.loomNumber = (isLoom || (isAll && rowIsLoom)) ? null : (r.weaverLoom ?? null);
        row.sareeTypeCode = r.sareeTypeCode ?? null;
        row.sareeTypeName = r.sareeTypeName ?? null;
        row.bulkOrderLabel = r.bulkOrderLabel ?? null;
        row.designCode = r.designCode ?? null;
        row.receivedPhotoUrl = r.receivedPhotoUrl ?? null;
        row.isAssigned = true;
        row.assignedDate = b.createdAt;
        if (isAll) {
          if (rowIsLoom) {
            row.ownerKind = "loom"; row.ownerId = r.factoryLoomId ?? null; row.ownerLabel = r.factoryLoomNumber ?? null;
          } else {
            row.ownerKind = "weaver"; row.ownerId = r.weaverId ?? null; row.ownerLabel = r.weaverName ?? null;
          }
        }
        // Fall back to the batch flag until a QC record exists for the saree
        if (r.qcPassed === true) row.qcStatus = "passed";
        else if (r.qcPassed === false) row.qcStatus = "defective";
        byId.set(r.sareeId, row);
      });
    });

    // 2. QC outcomes — authoritative over the batch flag
    qcRecords.forEach(q => {
      const row = byId.get(q.sareeId) ?? blank(q.sareeId);
      row.batchId = row.batchId ?? q.batchId;
      row.loomNumber = row.loomNumber ?? q.loomNumber;
      row.sareeTypeCode = row.sareeTypeCode ?? q.sareeTypeCode;
      row.sareeTypeName = row.sareeTypeName ?? q.sareeTypeName;
      row.bulkOrderLabel = row.bulkOrderLabel ?? q.bulkOrderLabel;
      row.qcStatus = q.result;
      row.receivedDate = q.receivedDate;
      row.qcDate = q.qcDate;
      row.defects = q.defects;
      row.makingCharge = q.makingCharge;
      row.deduction = q.deduction;
      row.payable = q.payable;
      if (isAll && !row.ownerKind) {
        if (q.factoryLoomId) {
          row.ownerKind = "loom"; row.ownerId = q.factoryLoomId; row.ownerLabel = q.factoryLoomNumber;
        } else if (q.weaverId) {
          row.ownerKind = "weaver"; row.ownerId = q.weaverId; row.ownerLabel = q.weaverName;
        }
      }
      byId.set(q.sareeId, row);
    });

    // 3. Stock / sales ledger entries for this weaver/loom (or everyone, in "all" mode)
    allStock.forEach(s => {
      const belongs = isAll ? true : isLoom
        ? s.origin === "factoryLoom" && s.factoryLoomId === weaverId
        : s.origin === "weaver" && s.weaverId === weaverId;
      if (!belongs) return;
      const row = byId.get(s.sareeId) ?? blank(s.sareeId);
      row.batchId = row.batchId ?? s.batchId;
      row.loomNumber = (isLoom || (isAll && s.origin === "factoryLoom")) ? null : (row.loomNumber ?? s.weaverLoom ?? null);
      row.sareeTypeCode = row.sareeTypeCode ?? s.sareeTypeCode;
      row.sareeTypeName = row.sareeTypeName ?? s.sareeTypeName;
      row.designCode = row.designCode ?? s.designCode ?? null;
      row.stock = s;
      if (isAll && !row.ownerKind) {
        if (s.origin === "factoryLoom") {
          row.ownerKind = "loom"; row.ownerId = s.factoryLoomId ?? null; row.ownerLabel = s.factoryLoomNumber ?? null;
        } else if (s.origin === "weaver") {
          row.ownerKind = "weaver"; row.ownerId = s.weaverId ?? null; row.ownerLabel = s.weaverName ?? null;
        }
      }
      byId.set(s.sareeId, row);
    });

    // 4. Finishing stage
    byId.forEach(row => {
      const ret = returns.find(r => r.sareeId === row.sareeId);
      const asg = assignments.find(a => a.sareeId === row.sareeId);
      if (ret) {
        row.finishingStatus = ret.condition === "damaged" ? "rejected" : "completed";
        row.finishingCompletedDate = ret.receivedDate;
        row.finishingAssignedDate = asg?.assignedDate ?? null;
      } else if (asg && asg.status === "awaiting-return") {
        row.finishingStatus = "in-finishing";
        row.finishingAssignedDate = asg.assignedDate;
      } else if (readySarees.some(s => s.id === row.sareeId) || row.qcStatus === "passed") {
        row.finishingStatus = "pending";
      }
    });

    // 5. Body colour comes from the design library entry for the saree's design
    byId.forEach(row => {
      row.color = row.designCode ? (getDesign(row.designCode)?.color || null) : null;
    });

    // 6. Already-dispatched — including via a raised quotation — so callers
    // (e.g. the Inventory dispatch table) can exclude these from selection.
    const dispatchedSareeIds = new Set(dispatches.flatMap(d => d.sareeIds));
    byId.forEach(row => {
      row.dispatched = dispatchedSareeIds.has(row.sareeId);
      // A sold saree is off the shelf whether or not it was ever dispatched —
      // and `stock` cannot report it, since the stock list excludes sold pieces.
      row.sold = soldSareeIds.has(row.sareeId);
    });

    return [...byId.values()];
  }, [batches, qcRecords, allStock, returns, assignments, readySarees, dispatches, soldSareeIds, weaverId, isLoom, isAll, getDesign]);
}
