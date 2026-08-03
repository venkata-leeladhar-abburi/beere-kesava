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

export const INITIAL_RATES: SareeTypeRecord[] = [
  { code: "SB-001", type: "Self Brocade",   description: "Traditional brocade with self-woven patterns",    charge: "450",    retail: "8500",  wholesale: "7200",  stdWeight: "850",  warpWeight: "480", reshamWeight: "240", jariWeight: "6",  changed: "3 days ago"  },
  { code: "HZ-003", type: "Heavy Zari",     description: "Rich gold zari work with heavy metallic detailing", charge: "680",   retail: "12000", wholesale: "10500", stdWeight: "920",  warpWeight: "500", reshamWeight: "280", jariWeight: "10", changed: "1 week ago"  },
  { code: "PS-002", type: "Plain Silk",     description: "Classic plain silk with minimal ornamentation",     charge: "280",   retail: "5500",  wholesale: "4800",  stdWeight: "780",  warpWeight: "450", reshamWeight: "200", jariWeight: "0",  changed: "2 weeks ago" },
  { code: "BS-004", type: "Bridal Special", description: "Premium bridal collection with intricate work",     charge: "1200",  retail: "22000", wholesale: "19500", stdWeight: "1050", warpWeight: "580", reshamWeight: "340", jariWeight: "14", changed: "1 month ago" },
  { code: "LC-005", type: "Light Cotton",   description: "Lightweight cotton blend for everyday use",         charge: "220",   retail: "4200",  wholesale: "3600",  stdWeight: "680",  warpWeight: "400", reshamWeight: "180", jariWeight: "0",  changed: "1 month ago" },
];

// ═══════════════════════════════════════════════════════════════════════════
// LOOKUP HELPERS — resolve saree type records by code/name from other pages
// ═══════════════════════════════════════════════════════════════════════════
export function getSareeTypeByCode(code: string): SareeTypeRecord | undefined {
  return INITIAL_RATES.find(r => r.code === code);
}

export function getSareeTypeByName(name: string): SareeTypeRecord | undefined {
  return INITIAL_RATES.find(r => r.type === name);
}
