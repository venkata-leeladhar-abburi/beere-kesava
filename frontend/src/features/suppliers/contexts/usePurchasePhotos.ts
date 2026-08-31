// Saree photos are deliberately absent from the purchases *list* query (it is
// fetched with view="summary", which strips imageUrl/pieceImageUrls) — so any
// screen that renders saree tiles off the shared `purchases` list would show
// empty placeholders even for sarees that do have a photo stored. This hook
// hydrates a small, already-narrowed set of purchases (e.g. the ones belonging
// to the supplier whose profile is open) from the per-purchase detail query,
// reusing exactly the cache entry SupplierContext.getPurchaseDetail fills.
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { purchasesApi } from "../../../shared/api/purchases";
import { resolveAssetUrl } from "../../../shared/api/uploads";
import { Purchase } from "./supplier-types";

/** Same key shape as SupplierContext's PURCHASES_KEY + "detail" + id. */
const detailKey = (id: string) => ["suppliers", "purchases", "detail", id] as const;

export function usePurchasePhotos(purchases: Purchase[]): Purchase[] {
  const results = useQueries({
    queries: purchases.map(p => ({
      queryKey: detailKey(p.id),
      queryFn: () => purchasesApi.getOne(p.id),
      staleTime: 60_000,
    })),
  });

  // Re-derive only when a detail response actually lands, not on every render.
  const stamp = results.map(r => r.dataUpdatedAt).join(",");

  return useMemo(
    () =>
      purchases.map((p, i) => {
        const detail = results[i]?.data;
        if (!detail) return p;
        const byCode = new Map(detail.sareeLines.map(l => [l.code, l]));
        return {
          ...p,
          sarees: p.sarees.map(s => {
            const line = byCode.get(s.id);
            if (!line) return s;
            return {
              ...s,
              imageUrl: resolveAssetUrl(line.imageUrl) ?? undefined,
              pieceImageUrls: line.pieceImageUrls?.map(u => resolveAssetUrl(u) ?? ""),
            };
          }),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [purchases, stamp],
  );
}
