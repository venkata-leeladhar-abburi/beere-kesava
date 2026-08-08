import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../../contexts/AuthContext";
import { weaversApi, BackendWeaver } from "../../../../shared/api/weavers";
import { batchesApi } from "../../../../shared/api/batches";

export function useCurrentWeaver() {
  const { user } = useAuth();

  // Not `retry: false` here on purpose: this directory fetch only decorates
  // the weaver's name/code for display — a transient failure (429 burst on
  // a hard refresh, brief network blip) must self-heal instead of
  // permanently blanking every batch-row filter that depends on weaverId.
  const { data: weaversList, isLoading: listLoading, isError: listError } = useQuery({
    queryKey: ["weavers"],
    queryFn: () => weaversApi.list(),
    retry: 2,
  });

  const { data: batchesData } = useQuery({
    queryKey: ["batches"],
    queryFn: () => batchesApi.list(),
    retry: 2,
  });

  const allWeavers = weaversList?.items ?? [];
  const allBatches = batchesData?.items ?? [];

  // The JWT already carries the caller's real weaverId for a WEAVER-role
  // login — use it directly rather than re-deriving it by matching against
  // the weavers directory. That match previously required GET /weavers to
  // succeed just to know "who am I", so any hiccup on that one fetch (or on
  // a hard refresh, where every context refetches at once) silently
  // resolved weaverId to null and made every row-filter downstream (batch
  // rows, material issues, QC) come back empty — looking like data loss.
  const tokenWeaverId = user?.weaverId ?? null;

  // Match weaver by explicit weaverId, empId, code, or name — used only to
  // enrich display info (name/initials/village); never gates weaverId itself.
  let resolvedWeaver: BackendWeaver | null = null;

  if (user) {
    resolvedWeaver = allWeavers.find(w =>
      (tokenWeaverId && (w.id === tokenWeaverId || w.code.toLowerCase() === tokenWeaverId.toLowerCase())) ||
      (user.empId && w.code.toLowerCase() === user.empId.toLowerCase()) ||
      (user.name && w.name.trim().toLowerCase() === user.name.trim().toLowerCase()) ||
      w.id === user.id
    ) ?? null;
  }

  // Admin "view as weaver" case: no direct weaverId on the token at all —
  // fall back to whichever weaver has batch assignments, then to the first
  // weaver in the directory. A genuine WEAVER login never reaches this,
  // since tokenWeaverId already resolved effectiveWeaverId above.
  if (!tokenWeaverId && !resolvedWeaver) {
    const savedAdminWeaverId = sessionStorage.getItem("admin_impersonate_weaver_id");
    if (savedAdminWeaverId) {
      resolvedWeaver = allWeavers.find(w => w.id === savedAdminWeaverId) ?? null;
    }

    if (!resolvedWeaver && allBatches.length > 0) {
      const activeRow = allBatches.flatMap(b => b.rows).find(r => r.weaverId);
      if (activeRow?.weaverId) {
        resolvedWeaver = allWeavers.find(w => w.id === activeRow.weaverId || w.code === activeRow.weaverId) ?? null;
      }
    }
    
    if (!resolvedWeaver) {
      resolvedWeaver = allWeavers[0] ?? null;
    }

    if (resolvedWeaver) {
      sessionStorage.setItem("admin_impersonate_weaver_id", resolvedWeaver.id);
    }
  }

  const effectiveWeaverId = tokenWeaverId ?? resolvedWeaver?.id ?? null;
  const isLoading = !tokenWeaverId && listLoading;
  const isError = !effectiveWeaverId && !isLoading;

  return {
    weaver: resolvedWeaver,
    weaverId: effectiveWeaverId,
    weaverCode: resolvedWeaver?.code ?? user?.empId ?? null,
    isLoading,
    isError,
    error: isError
      ? (listError ? new Error("Could not load your weaver profile. Please refresh.") : new Error("No weaver record found in the database."))
      : null,
  };
}
