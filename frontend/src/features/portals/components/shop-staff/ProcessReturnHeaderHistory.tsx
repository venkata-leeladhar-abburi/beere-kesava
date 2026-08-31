import { ChevronLeft, RotateCcw } from "lucide-react";
import { C, F } from "./theme";
import { IconButton } from "../../../../shared/ui/primitives";
import { LoadingState, ErrorState, EmptyState } from "../../../../shared/ui/state";
import { usePagination, Pagination } from "../../../../shared/ui/DataPagination";

export interface ReturnRecord {
  id: string;
  type: "retail" | "wholesale";
  date: string;
  customer?: string;
  vendor?: string;
  originalSaleId?: string;
  reason?: string;
  amount?: string;
  design?: string;
  color?: string;
  weight?: string;
  wsReason?: string;
}

interface ProcessReturnHeaderProps {
  step: "type" | 1 | 2 | 3 | "success";
  onBack: () => void;
  setStep: (s: "type" | 1 | 2 | 3 | "success") => void;
  setReturnType: (t: "retail" | "wholesale" | null) => void;
}

export function ProcessReturnHeader({ step, onBack, setStep, setReturnType }: ProcessReturnHeaderProps) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${C.dark} 0%, #8B1A1A 100%)`,
      display: "flex", alignItems: "center", padding: "14px 16px", gap: 12,
    }}>
      <IconButton
        icon={ChevronLeft}
        label="Back"
        variant="ghost"
        onClick={step === "type" ? onBack : () => {
          if (step === 1) { setStep("type"); setReturnType(null); }
          else if (step === 2) setStep(1);
          else if (step === 3) setStep(2);
        }}
        className="bg-white/10 border border-white/20 rounded-[10px] w-[38px] h-[38px] text-white"
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: F.m, fontSize: 12, letterSpacing: 2, color: "rgba(255,255,255,0.50)", textTransform: "uppercase" as const, marginBottom: 2 }}>Since 1999</div>
        <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 20, color: "#FFF" }}>Process Return</div>
      </div>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RotateCcw size={18} color="rgba(255,255,255,0.70)" />
      </div>
    </div>
  );
}

interface ReturnHistorySectionProps {
  returnLog: ReturnRecord[];
  canSeePrices: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

export function ReturnHistorySection({ returnLog, canSeePrices, isLoading, isError, onRetry }: ReturnHistorySectionProps) {
  const pag = usePagination(returnLog, 10);

  return (
    <div style={{ margin: "20px 20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 4, height: 20, background: C.crim, borderRadius: 2 }} />
        <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text }}>Return History</span>
      </div>
      {isLoading ? (
        <LoadingState variant="skeleton" rows={3} />
      ) : isError ? (
        <ErrorState error={undefined} onRetry={onRetry} />
      ) : returnLog.length === 0 ? (
        <EmptyState title="No returns processed yet" description="Returns recorded here will show up in this history." compact />
      ) : (
        <>
          {pag.pageItems.map((r) => (
            <div key={r.id} style={{ background: C.white, border: `1px solid rgba(110,15,45,0.18)`, borderRadius: 14, padding: "16px 18px", marginBottom: 12, boxShadow: "0 2px 10px rgba(74,6,27,0.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ background: r.type === "retail" ? "rgba(110,15,45,0.08)" : "rgba(200,155,71,0.15)", color: r.type === "retail" ? C.burg : "#8B6520", borderRadius: 999, padding: "4px 10px", fontFamily: F.m, fontSize: 12, fontWeight: 700 }}>{r.id}</span>
                <span style={{ background: r.type === "retail" ? "rgba(110,15,45,0.05)" : "rgba(200,155,71,0.10)", color: r.type === "retail" ? C.burg : "#8B6520", borderRadius: 999, padding: "4px 10px", fontFamily: F.u, fontSize: 12, fontWeight: 700 }}>{r.type === "retail" ? "Retail" : "Wholesale"}</span>
                <span style={{ marginLeft: "auto", fontFamily: F.m, fontSize: 13, color: C.muted, fontWeight: 500 }}>{r.date}</span>
              </div>
              {r.type === "retail" ? (
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600 }}>{r.customer}</span> <span style={{ color: C.muted }}>·</span> {r.originalSaleId} <span style={{ color: C.muted }}>·</span> {r.reason}
                  {canSeePrices && <> <span style={{ color: C.muted }}>·</span> <span style={{ color: C.gold, fontWeight: 700 }}>{r.amount}</span></>}
                </div>
              ) : (
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.text, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 600 }}>{r.vendor}</span> <span style={{ color: C.muted }}>·</span> {r.design} <span style={{ color: C.muted }}>·</span> {r.color} <span style={{ color: C.muted }}>·</span> {r.weight} <span style={{ color: C.muted }}>·</span> {r.wsReason}
                </div>
              )}
            </div>
          ))}
          {returnLog.length > 10 && (
            <div style={{ marginTop: 16, marginBottom: 24 }}>
              <Pagination
                page={pag.page}
                pageCount={pag.pageCount}
                total={pag.total}
                pageSize={pag.pageSize}
                start={pag.start}
                onPageChange={pag.setPage}
                onPageSizeChange={pag.setPageSize}
                itemLabel="returns"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

