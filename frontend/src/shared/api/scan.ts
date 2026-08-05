import { apiClient } from "./client";

export interface ScanLookupResult {
  sareeId: string;
  batchId: string;
  recipientType: "WEAVER" | "FACTORY_LOOM";
  weaver: { id: string; name: string } | null;
  factoryLoom: { id: string; loomNumber: string } | null;
  design: { code: string; name: string | null } | null;
  sareeType: { code: string; type: string } | null;
  qc: { result: string; payable: number; date: string } | null;
  finishing: { status: string; staffName: string | null; condition: string | null } | null;
  inventoryStatus: string | null;
}

export const scanApi = {
  lookup: (sareeId: string) => apiClient.get<ScanLookupResult>(`/scan/${encodeURIComponent(sareeId)}`),
};
