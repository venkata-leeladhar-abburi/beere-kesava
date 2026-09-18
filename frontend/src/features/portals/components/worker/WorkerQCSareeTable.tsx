import { CheckCircle2, AlertTriangle, XCircle, Package, User, Factory } from "lucide-react";
import { F, SareeItem, splitDesignField, initials } from "./WorkerQCTypes";
import { useRatesPricing } from "@/features/pricing";
import { DataTable, type ColumnDef } from "@/shared/ui/data";

interface WorkerQCSareeTableProps {
  sarees: SareeItem[];
  onMarkPassed: (s: SareeItem) => void;
  onStartSemiApproved: (s: SareeItem) => void;
  onStartDefect: (s: SareeItem) => void;
  onOpenSareeTypeCode: (typeCode: string) => void;
}

export function WorkerQCSareeTable({
  sarees,
  onMarkPassed,
  onStartSemiApproved,
  onStartDefect,
  onOpenSareeTypeCode,
}: WorkerQCSareeTableProps) {
  const { getSareeTypeByName } = useRatesPricing();

  /** Saree type name and the code that identifies it, resolved per row. */
  const typeOf = (s: SareeItem) => {
    const { typeName } = splitDesignField(s.design);
    const typeRec = typeName ? getSareeTypeByName(typeName) : undefined;
    return { typeName, sareeCode: s.sareeTypeCode ?? typeRec?.code ?? "—" };
  };

  const columns: ColumnDef<SareeItem>[] = [
    {
      id: "sareeId", header: "Saree ID", accessor: s => s.id, priority: 1,
      cell: (_v, s) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FEF4F5] border border-[#FEE8EB] flex items-center justify-center text-[#6E0F2D] flex-shrink-0">
            <Package size={13} />
          </div>
          <span style={{ fontFamily: F.m }} className="text-[12.5px] font-bold text-[#4A061B]" title={s.id}>
            {s.id}
          </span>
        </div>
      ),
    },
    {
      id: "batch", header: "Batch", accessor: s => s.batch, priority: 3,
      cell: (_v, s) => (
        <span style={{ fontFamily: F.m }} className="text-[11.5px] font-bold text-[#6E0F2D]">{s.batch}</span>
      ),
    },
    {
      id: "weaver", header: "Weaver", accessor: s => s.weaver, priority: 2,
      cell: (_v, s) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-white border border-[#C89B47] flex items-center justify-center flex-shrink-0">
            <span style={{ fontFamily: F.u }} className="font-bold text-[9.5px] text-[#845E04]">{initials(s.weaver)}</span>
          </div>
          <div className="min-w-0">
            <div style={{ fontFamily: F.u }} className="text-[12.5px] font-semibold text-[#1D1814] truncate max-w-[140px]">{s.weaver}</div>
            <div className="flex items-center gap-1 text-[10.5px] text-[#69635E]">
              {s.source === "outsourced" ? <User size={10} /> : <Factory size={10} />}
              {s.source === "outsourced" ? "Outsourced" : "Own Factory"}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "sareeType", header: "Saree Type", accessor: s => typeOf(s).typeName ?? "", priority: 2,
      cell: (_v, s) => (
        <span style={{ fontFamily: F.u }} className="text-[12.5px] font-semibold text-[#1D1814]">{typeOf(s).typeName || "—"}</span>
      ),
    },
    {
      id: "sareeCode", header: "Saree Code", accessor: s => typeOf(s).sareeCode, priority: 3,
      cell: (_v, s) => {
        const { sareeCode } = typeOf(s);
        // A real button when there is a code to open — it used to be a span
        // wearing role="button", which no keyboard could reach.
        return sareeCode !== "—" ? (
          <button
            type="button"
            onClick={() => onOpenSareeTypeCode(sareeCode)}
            style={{ fontFamily: F.m, background: "none", border: "none", padding: 0 }}
            className="text-[12px] font-bold text-[#6E0F2D] cursor-pointer hover:underline"
          >
            {sareeCode}
          </button>
        ) : (
          <span style={{ fontFamily: F.m }} className="text-[12px] font-bold text-[#6E0F2D]">{sareeCode}</span>
        );
      },
    },
    {
      id: "weight", header: "Weight", accessor: s => s.weight, type: "number", priority: 3,
      cell: (_v, s) => (
        <span style={{ fontFamily: F.m }} className="text-[12.5px] font-bold text-[#1D1814]">
          {s.weight > 0 ? `${s.weight}g` : "—"}
        </span>
      ),
    },
    {
      id: "color", header: "Color", accessor: s => s.color ?? "", priority: 3,
      cell: (_v, s) => s.color ? (
        <span style={{ fontFamily: F.u }} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#1D1814] bg-[#FAF8F6] border border-[#EAE5E1] px-2.5 py-1 rounded-full">
          {s.color}
        </span>
      ) : (
        <span style={{ fontFamily: F.u }} className="text-[12px] text-[#A69E96]">—</span>
      ),
    },
    {
      id: "order", header: "Order", accessor: s => s.bulkOrderLabel ?? "", priority: 3,
      cell: (_v, s) => s.bulkOrderLabel ? (
        <span style={{ fontFamily: F.u }} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#F0FAF4] border border-[#C9E8D4] text-[11px] font-medium text-[#0F4C30]">
          {s.bulkOrderLabel}
        </span>
      ) : (
        <span style={{ fontFamily: F.u }} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#F5F2EE] border border-[#EAE5E1] text-[11px] font-normal text-[#69635E]">
          General Stock
        </span>
      ),
    },
    {
      id: "actions", header: "Actions", accessor: () => null, type: "actions", align: "end",
      cell: (_v, s) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onMarkPassed(s)}
            title="Passed"
            aria-label={`Mark saree ${s.id} as passed`}
            className="w-8 h-8 rounded-lg bg-[#F0FAF4] border border-[#319061] text-[#1F774E] flex items-center justify-center hover:bg-[#E2F3E8] transition-colors cursor-pointer"
          >
            <CheckCircle2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => onStartSemiApproved(s)}
            title="Semi"
            aria-label={`Mark saree ${s.id} as semi-approved`}
            className="w-8 h-8 rounded-lg bg-[#FEF6EC] border border-[#CA8104] text-[#8D5802] flex items-center justify-center hover:bg-[#FBEBDA] transition-colors cursor-pointer"
          >
            <AlertTriangle size={15} />
          </button>
          <button
            type="button"
            onClick={() => onStartDefect(s)}
            title="Defective"
            aria-label={`Mark saree ${s.id} as defective`}
            className="w-8 h-8 rounded-lg bg-[#6E0F2D] hover:bg-[#4A061B] text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <XCircle size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl border border-[#F0E5D8] overflow-hidden">
      <DataTable
        responsive
        columns={columns}
        data={sarees}
        getRowId={s => s.id}
        emptyTitle="No sarees awaiting QC"
      />
    </div>
  );
}
