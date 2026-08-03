import { useState } from "react";
import { SareeRow, generateSareeId } from "../contexts/BatchContext";
import { WEAVERS } from "./batch-creation/constants";
import { FACTORY_LOOMS_LIST } from "../data/factoryLooms";
import type { ActivePicker } from "./batch-creation/types";

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
    })));
    setSelected(new Set());
    setGenerated(true);
  }

  const allSelected = rows.length > 0 && selected.size === rows.length;
  function toggleAll() { setSelected(allSelected ? new Set() : new Set(rows.map(r => r.serial))); }
  function toggleRow(serial: number) {
    setSelected(prev => { const n = new Set(prev); if (n.has(serial)) n.delete(serial); else n.add(serial); return n; });
  }

  function applyWeaver(w: typeof WEAVERS[0]) {
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

  function applyFactoryLoom(loom: typeof FACTORY_LOOMS_LIST[0]) {
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
        sareeId: `${loom.id}-${String(seq).padStart(3, "0")}`,
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
      designCode = order.design;
    }

    setRows(prev => prev.map(r => {
      if (!selected.has(r.serial)) return r;
      return {
        ...r,
        bulkOrderRef: ref,
        bulkOrderLabel: label,
        ...(order ? { sareeTypeCode, sareeTypeName, designCode } : {})
      };
    }));
    setPicker(null);
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

  return {
    rows, setRows, selected, setSelected, picker, setPicker, generated, setGenerated,
    loomPickerRow, setLoomPickerRow, generateRows, allSelected, toggleAll, toggleRow,
    applyWeaver, applyWeaverLoomToRow, applyFactoryLoom, applyBulkOrder, applyDesign,
    applySareeType, removeSelected,
  };
}
