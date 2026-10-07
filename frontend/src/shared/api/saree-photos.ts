import { apiClient } from "./client";

/** Mirrors backend SareePhotoRecord (saree-photos.service.ts). */
export interface SareePhotoRecord {
  sareeId: string;
  origin: "production" | "external";
  /** Where the saree is in its life, e.g. "QC passed", "Purchased stock". */
  stage: string;
  designCode: string | null;
  designName: string | null;
  sareeType: string | null;
  color: string | null;
  weightG: number | null;
  batchId: string | null;
  maker: { kind: "weaver" | "loom"; label: string } | null;
  receivedAt: string | null;
  qc: { result: "PASSED" | "SEMI" | "DEFECTIVE"; date: string } | null;
  purchase: {
    id: string;
    supplier: string | null;
    invoiceNumber: string | null;
    date: string;
    lineCode: string;
    pieceNo: number;
    lineQuantity: number;
    /** Shared by every piece of the purchase line — not this piece's own photo. */
    linePhotoUrl: string | null;
  } | null;
  /**
   * "inventory" = the saree's own photo; "qc" = none of its own yet, so the
   * latest QC inspection photo stands in for it (as on every inventory screen).
   */
  photo: { url: string; source: "inventory" | "qc" } | null;
}

export const sareePhotosApi = {
  lookup: (sareeId: string) =>
    apiClient.get<SareePhotoRecord>(`/saree-photos/${encodeURIComponent(sareeId.trim())}`),
  /** `photoUrl` must be the path POST /uploads/photo returned. */
  setPhoto: (sareeId: string, photoUrl: string) =>
    apiClient.put<SareePhotoRecord>(`/saree-photos/${encodeURIComponent(sareeId.trim())}`, {
      photoUrl,
    }),
};
