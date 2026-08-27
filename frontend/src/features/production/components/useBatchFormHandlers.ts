import { useState } from "react";
import { SareeRow, generateSareeId } from "../contexts/BatchContext";
import type { ActivePicker } from "./batch-creation/types";
import type { BulkOrder } from "@/features/bulk-orders";

// Minimal shapes accepted by the row-mutation helpers below — real data now
// comes from the backend (see WeaverOption/LoomOption in PickerModals.tsx),
// not the old static WEAVERS/FACTORY_LOOMS_LIST mocks.
export interface WeaverOption { id: string; name: string; initials: string; looms: number }
export interface LoomOption {
  id: string; loomNumber: string; location: string; status: string;
  operatorName: string; operatorPhone: string; installedYear: number | null; notes: string;
}

/**
 * A bulk-order assignment that would overflow the order's placed quantity.
 * Surfaced to the page as a blocking modal instead of being silently capped —
 * assigning 30 sarees to a 20-saree order is a data-entry mistake the admin
 * has to see and resolve, not something to quietly absorb.
 */
export interface BulkOrderCapacityConflict {
  order: BulkOrder;
  ref: string;
  label: string;
  /** How many rows the admin had selected. */
  selectedCount: number;
  /** How many of those can actually be taken (order total − already assigned). */
  capacity: number;
  /** Rows on this order elsewhere in this batch. */
  assignedInBatch: number;
  /** Rows on this order in other batches. */
  assignedElsewhere: number;
  /** selectedCount − capacity. */
  overflow: number;
}

export function useBatchFormHandlers(
  bulkOrders: BulkOrder[],
  /** Sarees already tied to each bulk order ref in *other* batches, keyed by ref. */
  assignedElsewhereByRef: Record<string, number> = {},
) {
  const [rows, setRows] = useState<SareeRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [picker, setPicker] = useState<ActivePicker>(null);
  const [generated, setGenerated] = useState(false);
  const [loomPickerRow, setLoomPickerRow] = useState<SareeRow | null>(null);

  function generateRows(totalCount: string) {
    const n = parseInt(totalCount, 10);
    if (!n || n < 1 || n > 500) return;
    setRows(Array.from({ length: n }, (_, i) => ({
      serial: i + 1,
      sareeId: null, recipientType: undefined,
      weaverId: null, weaverName: null, weaverInitials: null, weaverLoom: null,
      factoryLoomId: null, factoryLoomNumber: null,
      designCode: null, sareeTypeCode: null, sareeTypeName: null,
      bulkOrderRef: null, bulkOrderLabel: null,
      receivedAt: null, receivedWeight: null, receivedColor: null, receivedPhotoUrl: null,
      receivedWarpG: null, receivedReshamG: null, receivedJariReels: null, receivedByName: null,
      tallied: false, talliedByName: null, talliedAt: null,
    })));
    setSelected(new Set());
    setGenerated(true);
  }

  const allSelected = rows.length > 0 && selected.size === rows.length;
  function toggleAll() { setSelected(allSelected ? new Set() : new Set(rows.map(r => r.serial))); }
  function toggleRow(serial: number) {
    setSelected(prev => { const n = new Set(prev); if (n.has(serial)) n.delete(serial); else n.add(serial); return n; });
  }

  function applyWeaver(w: WeaverOption) {
    const seqMap: Record<string, number> = {};
    rows.forEach(r => {
      if (r.weaverId === w.id && r.sareeId) {
        const m = r.sareeId.match(/-(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10);
          seqMap[w.id] = Math.max(seqMap[w.id] || 0, n);
        }
      }
    });
    let seq = seqMap[w.id] || 0;
    setRows(prev => prev.map(r => {
      if (!selected.has(r.serial)) return r;
      seq++;
      return {
        ...r, recipientType: "weaver" as const,
        weaverId: w.id, weaverName: w.name, weaverInitials: w.initials, weaverLoom: 1,
        factoryLoomId: null, factoryLoomNumber: null,
        sareeId: generateSareeId(w.name, 1, seq),
      };
    }));
    setPicker(null);
  }

  function applyWeaverLoomToRow(row: SareeRow, loomNum: number) {
    setRows(prev => prev.map(r => {
      if (r.serial !== row.serial) return r;
      const seqMatch = r.sareeId ? r.sareeId.match(/-(\d+)$/) : null;
      const seq = seqMatch ? parseInt(seqMatch[1], 10) : r.serial;
      const newSareeId = r.weaverName ? generateSareeId(r.weaverName, loomNum, seq) : r.sareeId;
      return { ...r, weaverLoom: loomNum, sareeId: newSareeId };
    }));
    setLoomPickerRow(null);
  }

  function applyFactoryLoom(loom: LoomOption) {
    const seqMap: Record<string, number> = {};
    rows.forEach(r => {
      if (r.factoryLoomId === loom.id && r.sareeId) {
        const m = r.sareeId.match(/-(\d+)$/);
        if (m) {
          const n = parseInt(m[1], 10);
          seqMap[loom.id] = Math.max(seqMap[loom.id] || 0, n);
        }
      }
    });
    let seq = seqMap[loom.id] || 0;
    setRows(prev => prev.map(r => {
      if (!selected.has(r.serial)) return r;
      seq++;
      return {
        ...r, recipientType: "factoryLoom" as const,
        weaverId: null, weaverName: null, weaverInitials: null, weaverLoom: null,
        factoryLoomId: loom.id, factoryLoomNumber: loom.loomNumber,
        // Matches backend buildSareeId(): {loomNumber}-B{batchSeq}-{seq3}. We don't have batchSeq yet so use B***.
        sareeId: `${loom.loomNumber}-B***-${String(seq).padStart(3, "0")}`,
      };
    }));
    setPicker(null);
  }

  const [bulkOrderConflict, setBulkOrderConflict] = useState<BulkOrderCapacityConflict | null>(null);

  // Writes the order (and the saree type / design it implies) onto every row in
  // `allowed`; anything selected but not allowed is left untouched.
  function commitBulkOrder(ref: string | null, label: string, allowed: Set<number> | null) {
    const order = bulkOrders.find(o => o.ref === ref);
    // Only set when the order actually specifies one — a row's existing
    // saree type / design (already picked via "Assign Saree Type"/"Assign
    // Design Code") must survive linking an order that doesn't carry its
    // own, instead of being nulled out. Wiping sareeTypeCode here used to
    // drop the row out of the "assignable" filter in BatchContext's save
    // payload entirely (it requires sareeTypeCode), so the bulk-order link
    // itself silently never reached the backend on Save Changes.
    let sareeTypeCode: string | null | undefined;
    let sareeTypeName: string | null | undefined;
    let designCode: string | null | undefined;
    if (order) {
      const match = order.sareeType.match(/(.*)\s+·\s+(.*)/) || order.sareeType.match(/(.*)·(.*)/);
      if (match) {
        sareeTypeName = match[1].trim();
        sareeTypeCode = match[2].trim();
      } else if (order.sareeType) {
        sareeTypeName = order.sareeType;
      }
      if (order.design) designCode = order.design;
    }

    setRows(prev => prev.map(r => {
      if (!selected.has(r.serial)) return r;
      if (allowed && !allowed.has(r.serial)) return r;
      return {
        ...r,
        bulkOrderRef: ref,
        bulkOrderLabel: label,
        sareeTypeCode: sareeTypeCode ?? r.sareeTypeCode,
        sareeTypeName: sareeTypeName ?? r.sareeTypeName,
        designCode: designCode ?? r.designCode,
      };
    }));
    setPicker(null);
  }

  function applyBulkOrder(ref: string | null, label: string) {
    const order = bulkOrders.find(o => o.ref === ref);

    // General Stock is unbounded — nothing to check.
    if (!order || !ref) {
      commitBulkOrder(ref, label, null);
      return;
    }

    // A bulk order only has room for as many sarees as it was placed for.
    // Its remaining capacity is its total minus rows already on it — both
    // elsewhere in this batch and in every other batch.
    const selectedCount = rows.filter(r => selected.has(r.serial)).length;
    const assignedInBatch = rows.filter(r => r.bulkOrderRef === ref && !selected.has(r.serial)).length;
    const assignedElsewhere = assignedElsewhereByRef[ref] ?? 0;
    const capacity = Math.max(0, order.total - assignedInBatch - assignedElsewhere);

    if (selectedCount > capacity) {
      // Don't touch a single row — show the admin exactly what doesn't fit and
      // let them choose to take the part that does.
      setPicker(null);
      setBulkOrderConflict({
        order, ref, label, selectedCount, capacity,
        assignedInBatch, assignedElsewhere,
        overflow: selectedCount - capacity,
      });
      return;
    }

    commitBulkOrder(ref, label, null);
  }

  /** Assign only as many of the selected rows as the order still has room for. */
  function assignBulkOrderUpToCapacity() {
    const c = bulkOrderConflict;
    if (!c) return;
    const allowed = new Set(
      rows.filter(r => selected.has(r.serial)).map(r => r.serial).sort((a, b) => a - b).slice(0, c.capacity),
    );
    commitBulkOrder(c.ref, c.label, allowed);
    setBulkOrderConflict(null);
  }

  function dismissBulkOrderConflict() { setBulkOrderConflict(null); }

  function applyDesign(code: string) {
    setRows(prev => prev.map(r => selected.has(r.serial) ? { ...r, designCode: code } : r));
    setPicker(null);
  }

  function applySareeType(code: string, name: string) {
    setRows(prev => prev.map(r => selected.has(r.serial) ? { ...r, sareeTypeCode: code, sareeTypeName: name } : r));
    setPicker(null);
  }

  function removeSelected() {
    setRows(prev => prev.filter(r => !selected.has(r.serial)).map((r, i) => ({ ...r, serial: i + 1 })));
    setSelected(new Set());
  }

  // Appends n new blank rows after the existing ones, continuing the serial
  // sequence — unlike generateRows(), this never touches already-entered
  // rows, so it's safe to call while editing a draft/active batch.
  function addRows(n: number) {
    if (!n || n < 1) return;
    setRows(prev => {
      const startSerial = prev.length;
      const extra: SareeRow[] = Array.from({ length: n }, (_, i) => ({
        serial: startSerial + i + 1,
        sareeId: null, recipientType: undefined,
        weaverId: null, weaverName: null, weaverInitials: null, weaverLoom: null,
        factoryLoomId: null, factoryLoomNumber: null,
        designCode: null, sareeTypeCode: null, sareeTypeName: null,
        bulkOrderRef: null, bulkOrderLabel: null,
        receivedAt: null, receivedWeight: null, receivedColor: null, receivedPhotoUrl: null,
        receivedWarpG: null, receivedReshamG: null, receivedJariReels: null, receivedByName: null,
        tallied: false, talliedByName: null, talliedAt: null,
      }));
      return [...prev, ...extra];
    });
  }

  return {
    rows, setRows, selected, setSelected, picker, setPicker, generated, setGenerated,
    loomPickerRow, setLoomPickerRow, generateRows, addRows, allSelected, toggleAll, toggleRow,
    applyWeaver, applyWeaverLoomToRow, applyFactoryLoom, applyBulkOrder, applyDesign,
    applySareeType, removeSelected,
    bulkOrderConflict, assignBulkOrderUpToCapacity, dismissBulkOrderConflict,
  };
}
