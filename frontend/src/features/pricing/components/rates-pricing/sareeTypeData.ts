// ═══════════════════════════════════════════════════════════════════════════
// DATA TYPES
// ═══════════════════════════════════════════════════════════════════════════
export interface SareeTypeRecord {
  code: string;
  type: string;
  description: string;
  charge: string;
  retail: string;
  wholesale: string;
  stdWeight: string;
  warpWeight: string;
  reshamWeight: string;
  jariWeight: string;
  changed: string;
}

export const INITIAL_RATES: SareeTypeRecord[] = [];

// ═══════════════════════════════════════════════════════════════════════════
// LOOKUP HELPERS — resolve saree type records by code/name from other pages
// ═══════════════════════════════════════════════════════════════════════════
export function getSareeTypeByCode(code: string): SareeTypeRecord | undefined {
  return INITIAL_RATES.find(r => r.code === code);
}

export function getSareeTypeByName(name: string): SareeTypeRecord | undefined {
  return INITIAL_RATES.find(r => r.type === name);
}
