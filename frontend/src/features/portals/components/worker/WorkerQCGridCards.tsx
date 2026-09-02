import { useMemo, useState } from "react";
import { ChevronRight, Package, User, Factory } from "lucide-react";
import { F, T, initials, type SareeItem } from "./WorkerQCTypes";
import { DataTable, ViewToggle, type ColumnDef } from "../../../../shared/ui/data";

interface WeaverGroup {
  name: string;
  code: string;
  source: string;
  sarees: SareeItem[];
}

interface BatchGroup {
  id: string;
  sarees: SareeItem[];
}

const isUuid = (str?: string | null) =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

function PendingBadge({ count }: { count: number }) {
  return (
    <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#FEF5F3] border border-[#FED3CD]">
      <span className="w-2.5 h-2.5 rounded-full bg-[#AB3832]" />
      <span style={{ fontFamily: F.u }} className="text-[13px] font-bold text-[#AB3832]">
        {count} pending
      </span>
    </div>
  );
}

function SourcePill({ source }: { source: string }) {
  return (
    <span
      style={{ fontFamily: F.u }}
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-medium ${
        source === "outsourced"
          ? "bg-[#F0FAF4] border border-[#C9E8D4] text-[#1F774E]"
          : "bg-[#FEF6EC] border border-[#F6D9BA] text-[#8D5802]"
      }`}
    >
      {source === "outsourced" ? <User size={14} /> : <Factory size={14} />}
      {source === "outsourced" ? "Outsourced" : "Own Factory"}
    </span>
  );
}

function buildWeaverColumns(): ColumnDef<WeaverGroup>[] {
  return [
    {
      id: "name", header: "Weaver", accessor: wg => wg.name, priority: 1, sortable: true,
      cell: (_v, wg) => {
        const isWeaverCodeUuid = isUuid(wg.code);
        const displayCode = (!isWeaverCodeUuid && wg.code) ? wg.code : (wg.sarees[0]?.id || "PENDING-QC");
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div
              style={{ background: T.gradHero }}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs border border-white/20"
            >
              <span style={{ fontFamily: F.u }} className="font-bold text-[12px] text-white">
                {initials(wg.name)}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Package size={12} className="text-[#6E0F2D] flex-shrink-0" />
                <span style={{ fontFamily: F.m }} className="text-[11px] font-bold text-[#6E0F2D] tracking-wider uppercase truncate">
                  {displayCode}
                </span>
              </div>
              <div style={{ fontFamily: F.d }} className="text-[15px] font-bold text-[#4A061B] truncate leading-tight">
                {wg.name}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "source", header: "Source", accessor: wg => wg.source, priority: 2,
      cell: (_v, wg) => <SourcePill source={wg.source} />,
    },
    {
      id: "pending", header: "Pending", type: "number", priority: 2, sortable: true,
      accessor: wg => wg.sarees.length,
      cell: (_v, wg) => <PendingBadge count={wg.sarees.length} />,
    },
    {
      id: "actions", header: "", type: "actions", priority: 2, width: 40,
      accessor: () => null,
      cell: () => <ChevronRight size={16} className="text-[#4F4A45]" />,
    },
  ];
}

function buildBatchColumns(): ColumnDef<BatchGroup>[] {
  return [
    {
      id: "id", header: "Batch Group", accessor: bg => bg.id, priority: 1, sortable: true,
      cell: (_v, bg) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-[14px] bg-[#FEF6EC] border border-[#F6D9BA] flex items-center justify-center text-[#8D5802] flex-shrink-0">
            <Package size={18} />
          </div>
          <div className="min-w-0">
            <div style={{ fontFamily: F.m }} className="text-[11px] font-bold text-[#8D5802] tracking-wider uppercase">
              BATCH GROUP
            </div>
            <div style={{ fontFamily: F.m }} className="text-[15px] font-bold text-[#6E0F2D] truncate leading-tight">
              {bg.id}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "weavers", header: "Weavers", priority: 2,
      accessor: bg => Array.from(new Set(bg.sarees.map(s => s.weaver))).join(", "),
      cell: (_v, bg) => {
        const bweavers = Array.from(new Set(bg.sarees.map(s => s.weaver)));
        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            {bweavers.slice(0, 2).map(w => (
              <span
                key={w}
                style={{ fontFamily: F.u }}
                className="text-[12px] font-medium text-[#4F4A45] bg-[#FAF8F6] border border-[#EAE5E1] px-3 py-0.5 rounded-full"
              >
                {w}
              </span>
            ))}
            {bweavers.length > 2 && (
              <span style={{ fontFamily: F.u }} className="text-[12px] font-semibold text-[#8D5802]">
                +{bweavers.length - 2}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "pending", header: "Pending", type: "number", priority: 2, sortable: true,
      accessor: bg => bg.sarees.length,
      cell: (_v, bg) => <PendingBadge count={bg.sarees.length} />,
    },
    {
      id: "actions", header: "", type: "actions", priority: 2, width: 40,
      accessor: () => null,
      cell: () => <ChevronRight size={16} className="text-[#4F4A45]" />,
    },
  ];
}

interface WorkerQCWeaverGridProps {
  filteredWeavers: WeaverGroup[];
  setSelectedWeaverQC: (name: string) => void;
  isDesktop?: boolean;
  isTablet?: boolean;
  pad: string;
}

export function WorkerQCWeaverGrid({
  filteredWeavers,
  setSelectedWeaverQC,
  pad,
}: WorkerQCWeaverGridProps) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const columns = useMemo(() => buildWeaverColumns(), []);
  return (
    <div style={{ padding: pad, display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="flex justify-end">
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>
      <DataTable
        columns={columns}
        data={filteredWeavers}
        getRowId={wg => wg.name}
        view={viewMode}
        onRowClick={wg => setSelectedWeaverQC(wg.name)}
        emptyTitle="No weavers pending QC"
      />
    </div>
  );
}

interface WorkerQCBatchGridProps {
  batchGroups: BatchGroup[];
  setSelectedBatchQC: (id: string) => void;
  isDesktop?: boolean;
  isTablet?: boolean;
  pad: string;
}

export function WorkerQCBatchGrid({
  batchGroups,
  setSelectedBatchQC,
  pad,
}: WorkerQCBatchGridProps) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const columns = useMemo(() => buildBatchColumns(), []);
  return (
    <div style={{ padding: pad, display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="flex justify-end">
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </div>
      <DataTable
        columns={columns}
        data={batchGroups}
        getRowId={bg => bg.id}
        view={viewMode}
        onRowClick={bg => setSelectedBatchQC(bg.id)}
        emptyTitle="No batches pending QC"
      />
    </div>
  );
}
