import { apiClient } from "./client";

export interface ScanLookupResult {
  sareeId: string;
  /** "external" is a saree bought from a supplier (PurchaseSareeLine) —
   *  batchId/recipientType/weaver/factoryLoom/design/qc/finishing are all
   *  null for it, and supplier/invoiceNumber/serial/costPrice are populated
   *  instead (all null for a "production" saree). */
  origin: "production" | "external";
  batchId: string | null;
  recipientType: "WEAVER" | "FACTORY_LOOM" | null;
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
  /** Whether this saree can be sold at the shop counter right now. A saree
   *  still in the factory is sellable — the counter sells straight from
   *  factory stock, no SHOP dispatch needed.
   *  "WHOLESALE_DISPATCHED" — sent to a wholesale customer, gone from the business. */
  saleEligibility:
    | "PASSED"
    | "QC_NOT_PASSED"
    | "WHOLESALE_DISPATCHED"
    | "SOLD"
    | "DAMAGED_REVIEW_NEEDED";
  /** True once a SHOP dispatch has delivered this saree to the shop floor. */
  atShop: boolean;
  /** Worker-entered per-saree retail price from receipt, if set — overrides the type's shared rate. */
  sellingPrice: number | null;
  /** External-purchase-only fields, all null for a "production" saree. */
  supplier: { id: string | null; name: string; shortName: string | null } | null;
  invoiceNumber: string | null;
  serial: string | null;
  /** Buying/cost price — never shown in plain rupees on a printed tag (see
   *  costCipher.ts), but this authenticated scan result shows it plainly. */
  costPrice: number | null;
}

export const scanApi = {
  lookup: (sareeId: string) => apiClient.get<ScanLookupResult>(`/scan/${encodeURIComponent(sareeId)}`),
  /** The current code for a scanned/typed one — see resolveSareeCode. */
  resolve: (code: string) => apiClient.get<{ code: string }>(`/scan/resolve?code=${encodeURIComponent(code)}`),
};

/**
 * The code a saree carries now, for one read off a tag.
 *
 * An external-purchase saree's code is built from its supplier's short name
 * and its invoice number; editing either re-codes the saree everywhere, but a
 * sticker printed before the edit still carries the old code. Screens that
 * match a scan against sarees already on screen run it through this first so
 * an old sticker still finds its saree. Never throws: offline or on any
 * error the scanned text is used as-is, exactly as before this existed.
 */
export async function resolveSareeCode(raw: string): Promise<string> {
  const code = raw.trim();
  if (!code) return code;
  try {
    return (await scanApi.resolve(code)).code || code;
  } catch {
    return code;
  }
}
