import type { SareeTag } from "@/features/suppliers";
import { SareeRow } from "./types";

let rowUidCounter = 0;
export function nextRowUid() {
  rowUidCounter += 1;
  return `row-${rowUidCounter}-${Date.now()}`;
}

export function toSareeRow(s: SareeTag): SareeRow {
  const { id, ...rest } = s;
  return { ...rest, code: id || undefined, _uid: nextRowUid() };
}
