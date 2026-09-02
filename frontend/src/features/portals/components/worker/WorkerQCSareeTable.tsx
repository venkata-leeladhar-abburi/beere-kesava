import type { CSSProperties } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Package, User, Factory } from "lucide-react";
import { F, SareeItem, splitDesignField, initials } from "./WorkerQCTypes";
import { useRatesPricing } from "@/features/pricing";

interface WorkerQCSareeTableProps {
  sarees: SareeItem[];
  onMarkPassed: (s: SareeItem) => void;
  onStartSemiApproved: (s: SareeItem) => void;
  onStartDefect: (s: SareeItem) => void;
  onOpenSareeTypeCode: (typeCode: string) => void;
}

const th: CSSProperties = {
  fontFamily: F.u,
  fontSize: 11,
  fontWeight: 700,
  color: "#9F7315",
  textTransform: "uppercase",
  letterSpacing: 0.4,
  textAlign: "left",
  padding: "10px 12px",
  whiteSpace: "nowrap",
};

const td: CSSProperties = {
  padding: "12px",
  verticalAlign: "middle",
  borderTop: "1px solid #F0E5D8",
};

export function WorkerQCSareeTable({
  sarees,
  onMarkPassed,
  onStartSemiApproved,
  onStartDefect,
  onOpenSareeTypeCode,
}: WorkerQCSareeTableProps) {
  const { getSareeTypeByName } = useRatesPricing();

  return (
    <div className="rounded-2xl border border-[#F0E5D8] overflow-hidden">
      <div className="overflow-x-auto">
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#FFFDFB" }}>
          <thead>
            <tr style={{ background: "#FAF8F5" }}>
              <th style={th}>Saree ID</th>
              <th style={th}>Batch</th>
              <th style={th}>Weaver</th>
              <th style={th}>Saree Type</th>
              <th style={th}>Saree Code</th>
              <th style={th}>Weight</th>
              <th style={th}>Color</th>
              <th style={th}>Order</th>
              <th style={{ ...th, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sarees.map((s) => {
              const { typeName } = splitDesignField(s.design);
              const typeRec = typeName ? getSareeTypeByName(typeName) : undefined;
              const sareeCode = s.sareeTypeCode ?? typeRec?.code ?? "—";
              const weaverInitials = initials(s.weaver);

              return (
                <tr key={s.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td style={td}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#FEF4F5] border border-[#FEE8EB] flex items-center justify-center text-[#6E0F2D] flex-shrink-0">
                        <Package size={13} />
                      </div>
                      <span style={{ fontFamily: F.m }} className="text-[12.5px] font-bold text-[#4A061B]" title={s.id}>
                        {s.id}
                      </span>
                    </div>
                  </td>

                  <td style={td}>
                    <span style={{ fontFamily: F.m }} className="text-[11.5px] font-bold text-[#6E0F2D]">
                      {s.batch}
                    </span>
                  </td>

                  <td style={td}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-white border border-[#C89B47] flex items-center justify-center flex-shrink-0">
                        <span style={{ fontFamily: F.u }} className="font-bold text-[9.5px] text-[#845E04]">
                          {weaverInitials}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div style={{ fontFamily: F.u }} className="text-[12.5px] font-semibold text-[#1D1814] truncate max-w-[140px]">
                          {s.weaver}
                        </div>
                        <div className="flex items-center gap-1 text-[10.5px] text-[#69635E]">
                          {s.source === "outsourced" ? <User size={10} /> : <Factory size={10} />}
                          {s.source === "outsourced" ? "Outsourced" : "Own Factory"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={td}>
                    <span style={{ fontFamily: F.u }} className="text-[12.5px] font-semibold text-[#1D1814]">
                      {typeName || "—"}
                    </span>
                  </td>

                  <td style={td}>
                    <span
                      onClick={() => sareeCode !== "—" && onOpenSareeTypeCode(sareeCode)}
                      role={sareeCode !== "—" ? "button" : undefined}
                      tabIndex={sareeCode !== "—" ? 0 : undefined}
                      style={{ fontFamily: F.m }}
                      className={`text-[12px] font-bold text-[#6E0F2D] ${sareeCode !== "—" ? "cursor-pointer hover:underline" : ""}`}
                    >
                      {sareeCode}
                    </span>
                  </td>

                  <td style={td}>
                    <span style={{ fontFamily: F.m }} className="text-[12.5px] font-bold text-[#1D1814]">
                      {s.weight > 0 ? `${s.weight}g` : "—"}
                    </span>
                  </td>

                  <td style={td}>
                    {s.color ? (
                      <span
                        style={{ fontFamily: F.u }}
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#1D1814] bg-[#FAF8F6] border border-[#EAE5E1] px-2.5 py-1 rounded-full"
                      >
                        {s.color}
                      </span>
                    ) : (
                      <span style={{ fontFamily: F.u }} className="text-[12px] text-[#A69E96]">—</span>
                    )}
                  </td>

                  <td style={td}>
                    {s.bulkOrderLabel ? (
                      <span
                        style={{ fontFamily: F.u }}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#F0FAF4] border border-[#C9E8D4] text-[11px] font-medium text-[#0F4C30]"
                      >
                        {s.bulkOrderLabel}
                      </span>
                    ) : (
                      <span
                        style={{ fontFamily: F.u }}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#F5F2EE] border border-[#EAE5E1] text-[11px] font-normal text-[#69635E]"
                      >
                        General Stock
                      </span>
                    )}
                  </td>

                  <td style={{ ...td, textAlign: "right" }}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onMarkPassed(s)}
                        title="Passed"
                        className="w-8 h-8 rounded-lg bg-[#F0FAF4] border border-[#319061] text-[#1F774E] flex items-center justify-center hover:bg-[#E2F3E8] transition-colors cursor-pointer"
                      >
                        <CheckCircle2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onStartSemiApproved(s)}
                        title="Semi"
                        className="w-8 h-8 rounded-lg bg-[#FEF6EC] border border-[#CA8104] text-[#8D5802] flex items-center justify-center hover:bg-[#FBEBDA] transition-colors cursor-pointer"
                      >
                        <AlertTriangle size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onStartDefect(s)}
                        title="Defective"
                        className="w-8 h-8 rounded-lg bg-[#6E0F2D] hover:bg-[#4A061B] text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <XCircle size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
