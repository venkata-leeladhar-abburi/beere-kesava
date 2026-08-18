export interface FactoryLoom {
  id: string;
  /** Human-facing sequential id, e.g. "Loom-001" — falls back to the UUID
   * when displayCode hasn't loaded yet, same fallback pattern as customers. */
  displayCode?: string;
  loomNumber: string;
  location: string; operatorName: string; operatorPhone: string;
  status: "active" | "idle" | "maintenance";
  installedYear: string; notes: string;
}

/**
 * What a loom is called everywhere in the UI: the backend-generated display
 * code ("Loom-002"). `loomNumber` is only a legacy, manually typed label kept
 * for older records and for matching dispatch/QC rows that still reference it,
 * so it's a fallback here rather than something we show by choice.
 */
export function loomLabel(l: Pick<FactoryLoom, "displayCode" | "loomNumber" | "id">): string {
  return l.displayCode || l.loomNumber || l.id;
}

const INITIAL_LOOMS: FactoryLoom[] = [];

export const FACTORY_LOOMS_LIST: FactoryLoom[] = INITIAL_LOOMS;
