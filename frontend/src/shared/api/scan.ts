import { apiClient } from "./client";

export interface ScanLookupResult {
  sareeId: string;
  batchId: string;
  recipientType: "WEAVER" | "FACTORY_LOOM";
  /** `loomNumber` is which of the weaver's own looms produced this saree (parsed from the sareeId), not a factory loom. */
  weaver: { id: string; name: string; loomNumber: number | null } | null;
  /** `code` is the human-facing loom id ("Loom-002"); `loomNumber` is the legacy machine label. */
  factoryLoom: { id: string; code: string | null; loomNumber: string } | null;
  design: { code: string; name: string | null } | null;
  sareeType: { code: string; type: string } | null;
  /** Recorded by Worker Staff at Receive Sarees — same source the printed tag uses. */
  weight: number | null;
  color: string | null;
  receivedDate: string | null;
  batchDate: string;
  qc: { result: string; payable: number; date: string } | null;
  finishing: { status: string; staffName: string | null; condition: string | null } | null;
  inventoryStatus: string | null;
  /** Whether this saree can be sold at the shop counter right now.
   *  "NOT_IN_SHOP" — QC-passed but still in the factory, never dispatched to the shop.
   *  "WHOLESALE_DISPATCHED" — sent to a wholesale customer, gone from the business. */
  saleEligibility:
    | "PASSED"
    | "QC_NOT_PASSED"
    | "NOT_IN_SHOP"
    | "WHOLESALE_DISPATCHED"
    | "SOLD"
    | "DAMAGED_REVIEW_NEEDED";
  /** True once a SHOP dispatch has delivered this saree to the shop floor. */
  atShop: boolean;
  /** Worker-entered per-saree retail price from receipt, if set — overrides the type's shared rate. */
  sellingPrice: number | null;
}

export const scanApi = {
  lookup: (sareeId: string) => apiClient.get<ScanLookupResult>(`/scan/${encodeURIComponent(sareeId)}`),
};
