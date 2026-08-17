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

const INITIAL_LOOMS: FactoryLoom[] = [];

export const FACTORY_LOOMS_LIST: FactoryLoom[] = INITIAL_LOOMS;
