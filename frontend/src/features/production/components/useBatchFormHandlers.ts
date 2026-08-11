import { useState } from "react";
import { toast } from "sonner";
import { SareeRow, generateSareeId } from "../contexts/BatchContext";
import type { ActivePicker } from "./batch-creation/types";

// Minimal shapes accepted by the row-mutation helpers below — real data now
// comes from the backend (see WeaverOption/LoomOption in PickerModals.tsx),
// not the old static WEAVERS/FACTORY_LOOMS_LIST mocks.
export interface WeaverOption { id: string; name: string; initials: string; looms: number }
export interface LoomOption {
  id: string; loomNumber: string; location: string; status: string;
  operatorName: string; operatorPhone: string; installedYear: number | null; notes: string;
}

export function useBatchFormHandlers(bulkOrders: any[]) {
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
      receivedWarpG: null, receivedReshamG: null, receivedJariReels: null,
      tallied: false, talliedBy: null, talliedAt: null,
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

  function applyBulkOrder(ref: string | null, label: string) {
    const order = bulkOrders.find(o => o.ref === ref);
    let sareeTypeCode = null;
    let sareeTypeName = null;
    let designCode = null;
    if (order) {
      const match = order.sareeType.match(/(.*)\s+·\s+(.*)/) || order.sareeType.match(/(.*)·(.*)/);
      if (match) {
        sareeTypeName = match[1].trim();
        sareeTypeCode = match[2].trim();
      } else {
        sareeTypeName = order.sareeType;
      }
      // designCode is a real FK on the backend (DesignLibrary.code) — an
      // empty string isn't null/undefined, so it would survive to the save
      // request and trip the foreign-key constraint on save. A bulk order
      // without a design set must leave this null, not "".
      designCode = order.design || null;
    }

    // A bulk order only has room for as many sarees as it was placed for —
    // don't let it silently absorb more than that. Cap the assignment at the
    // order's remaining capacity (its total, minus rows already on it
    // elsewhere in this batch); anything selected past the cap goes to
    // General Stock instead, for the admin to route separately.
    const selectedSerials = rows
      .filter(r => selected.has(r.serial))
      .map(r => r.serial)
      .sort((a, b) => a - b);
    let capacity = selectedSerials.length;
    if (order) {
      const alreadyOnOrder = rows.filter(r => r.bulkOrderRef === ref && !selected.has(r.serial)).length;
      capacity = Math.max(0, order.total - alreadyOnOrder);
    }
    const capped = new Set(selectedSerials.slice(0, capacity));
    const overflow = selectedSerials.length - capped.size;

    setRows(prev => prev.map(r => {
      if (!selected.has(r.serial)) return r;
      if (order && !capped.has(r.serial)) {
        // Past this order's capacity — route to General Stock rather than
        // leaving it silently tied to an order it can't actually belong to.
        return { ...r, bulkOrderRef: null, bulkOrderLabel: null };
      }
      return {
        ...r,
        bulkOrderRef: ref,
        bulkOrderLabel: label,
        ...(order ? { sareeTypeCode, sareeTypeName, designCode } : {})
      };
    }));
    setPicker(null);

    if (order && overflow > 0) {
      toast.warning(
        `${order.ref} only has room for ${capacity} more saree${capacity === 1 ? "" : "s"} — ${overflow} of your ${selectedSerials.length} selected rows went to General Stock instead.`,
      );
    }
  }

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
        receivedWarpG: null, receivedReshamG: null, receivedJariReels: null,
        tallied: false, talliedBy: null, talliedAt: null,
      }));
      return [...prev, ...extra];
    });
  }

  return {
    rows, setRows, selected, setSelected, picker, setPicker, generated, setGenerated,
    loomPickerRow, setLoomPickerRow, generateRows, addRows, allSelected, toggleAll, toggleRow,
    applyWeaver, applyWeaverLoomToRow, applyFactoryLoom, applyBulkOrder, applyDesign,
    applySareeType, removeSelected,
  };
}
