import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, ChevronDown, Eye, Calendar, Users, Download,
  CheckCircle2, Loader2, TriangleAlert,
} from "lucide-react";
import { ProductionHistoryFooter } from "./ProductionHistoryFooter";
import { Button, IconButton, SearchInput } from "../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";
import { useBatches } from "../contexts/BatchContext";
import { qcApi } from "../../../shared/api/qc";
import type { HistoryBatch } from "./types";

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  silkCream:     "#F7F2EA",
  warmIvory:     "#FFFDF9",
  royalBurgundy: "#6E0F2D",
  deepWine:      "#4A061B",
  darkBurgundy:  "#3D0E1A",
  antiqueGold:   "#C89B47",
  goldLight:     "#E7C983",
  luxuryBrown:   "#3B2314",
  taupe:         "#69635E",
  green:         "#1E6640",
  greenBg:       "#DCFCE7",
  amber:         "#92400E",
  amberBg:       "#FEF3C7",
  blue:          "#1E3A8A",
  blueBg:        "#DBEAFE",
  borderDef:     "rgba(110,15,45,0.10)",
};

const F = {
  display: "'Plus Jakarta Sans', sans-serif",
  ui:      "'Inter', sans-serif",
  mono:    "'JetBrains Mono', monospace",
};

// ── Batch data ────────────────────────────────────────────────────────────────
type BatchStatus = "Printing Completed" | "Printing In Process" | "Challenge in Progress";

const PIP_COLORS = ["#7C3AED", "#C0392B", "#0F766E", "#B45309"];

// Derives the history table from real batch + QC data (same join pattern as
// ProductionHistorySection.tsx). Only finalized ("completed") batches are
// shown; per-saree QC outcomes (okPieces/found, making charges) come from QC
// records joined by batchId — there is no separate "printing"/"embossing"
// workflow tracked by the backend, so status is always "Printing Completed"
// for every batch here (kept for label continuity with the styling, not a
// tracked backend state).
function useHistoryBatches(): { batches: HistoryBatch[]; isLoading: boolean } {
  const { batches } = useBatches();
  const { data: qcRecords = [], isLoading } = useQuery({
    queryKey: ["qc", "all"],
    queryFn: () => qcApi.list().then(r => r.items),
  });

  const historyBatches = useMemo(() => {
    const completed = batches.filter(b => b.status === "completed");
    return completed.map((b): HistoryBatch => {
      const batchQc = qcRecords.filter(r => r.batchId === b.batchId);
      const okPieces = batchQc.filter(r => r.result === "PASSED" || r.result === "SEMI").length;
      const found = batchQc.filter(r => r.result === "DEFECTIVE").length;
      const makingCharges = batchQc.reduce((sum, r) => sum + Number(r.makingCharge), 0);

      const seenWeavers = new Map<string, { initials: string; bg: string }>();
      b.rows.forEach(r => {
        if (r.weaverId && r.weaverInitials && !seenWeavers.has(r.weaverId)) {
          seenWeavers.set(r.weaverId, { initials: r.weaverInitials, bg: PIP_COLORS[seenWeavers.size % PIP_COLORS.length]! });
        }
      });
      const firstRow = b.rows.find(r => r.sareeTypeName || r.designCode);

      return {
        id: b.batchId,
        designCode: firstRow?.designCode ?? "—",
        sareeType: firstRow?.sareeTypeName ?? "—",
        batchSize: b.totalCount,
        weavers: Array.from(seenWeavers.values()),
        completion: b.rows.filter(r => r.sareeId).length,
        allPieces: b.totalCount,
        okPieces: batchQc.length > 0 ? okPieces : null,
        found: batchQc.length > 0 ? found : null,
        status: "Printing Completed",
        makingCharges: `₹${makingCharges.toLocaleString("en-IN")}`,
        completedOn: new Date(b.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
        bulkOrder: b.rows.find(r => r.bulkOrderRef)?.bulkOrderRef ?? undefined,
      };
    });
  }, [batches, qcRecords]);

  return { batches: historyBatches, isLoading };
}

// ── Weaver avatar pip ─────────────────────────────────────────────────────────
function Pip({ initials, bg }: { initials: string; bg: string }) {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: "50%", background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "1.5px solid rgba(255,255,255,0.6)", flexShrink: 0,
    }}>
      <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>{initials}</span>
    </div>
  );
}

// ── Batch size squares ────────────────────────────────────────────────────────
function BatchSquares({ size }: { size: number }) {
  const filled = Math.min(size, 4);
  const colors = ["#7C3AED", "#C0392B", "#0F766E", "#B45309"];
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", maxWidth: 56 }}>
      {Array.from({ length: filled }).map((_, i) => (
        <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: colors[i % colors.length], opacity: 0.85 }} />
      ))}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: BatchStatus }) {
  const map: Record<BatchStatus, { bg: string; color: string; icon: React.ReactNode }> = {
    "Printing Completed":    { bg: T.greenBg,  color: T.green,  icon: <CheckCircle2 size={11} /> },
    "Printing In Process":   { bg: T.amberBg,  color: T.amber,  icon: <Loader2 size={11} /> },
    "Challenge in Progress": { bg: T.blueBg,   color: T.blue,   icon: <TriangleAlert size={11} /> },
  };
  const cfg = map[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px",
      borderRadius: 20, background: cfg.bg, color: cfg.color,
      fontFamily: F.ui, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {cfg.icon}
      {status}
    </span>
  );
}

// ── Dropdown select button ─────────────────────────────────────────────────────
function DropBtn({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <Button variant="secondary" size="sm">
      {icon}
      {label}
      <ChevronDown size={14} style={{ color: T.taupe }} />
    </Button>
  );
}

// ── Section 1: Page header ────────────────────────────────────────────────────
function PageHeader() {
  return (
    <header style={{ background: T.darkBurgundy, padding: "18px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="8" fill="rgba(200,155,71,0.18)" />
          <rect x="8" y="10" width="20" height="3" rx="1.5" fill={T.antiqueGold} />
          <rect x="8" y="23" width="20" height="3" rx="1.5" fill={T.antiqueGold} />
          <rect x="12" y="13" width="1.5" height="10" rx="0.75" fill={T.goldLight} />
          <rect x="15.5" y="13" width="1.5" height="10" rx="0.75" fill={T.goldLight} />
          <rect x="19" y="13" width="1.5" height="10" rx="0.75" fill={T.goldLight} />
          <rect x="22.5" y="13" width="1.5" height="10" rx="0.75" fill={T.goldLight} />
        </svg>
        <div>
          <div style={{ fontFamily: F.mono, fontSize: 12, color: "rgba(255,253,249,0.45)", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 2 }}>
            SINCE 1999 · BATCH RECORDS
          </div>
          <h1 style={{ fontFamily: F.display, fontSize: 24, fontWeight: 700, color: "#FFFDF9", margin: 0, lineHeight: 1.1, letterSpacing: "-0.3px" }}>
            Production History
          </h1>
        </div>
      </div>

      <Button variant="primary">
        <Download size={15} /> Generate Production Report
      </Button>
    </header>
  );
}

// ── Section 2: Filter bar ─────────────────────────────────────────────────────
function FilterBar() {
  return (
    <div style={{
      background: "#fff", padding: "14px 40px",
      borderBottom: `1px solid ${T.borderDef}`,
      display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
    }}>
      <DropBtn label="30 Apr 2026 – 30 Apr 2026" icon={<Calendar size={14} style={{ color: T.royalBurgundy }} />} />
      <DropBtn label="All Saree Types" />
      <DropBtn label="All Weavers" icon={<Users size={14} style={{ color: T.royalBurgundy }} />} />
      <DropBtn label="All Orders" />

      <div style={{ flex: 1, minWidth: 180 }}>
        <SearchInput aria-label="Search batches..." placeholder="Search batches..." />
      </div>
    </div>
  );
}

// ── Section 3: Stats bar ──────────────────────────────────────────────────────
function StatsBar({ batches }: { batches: HistoryBatch[] }) {
  const totalMakingCharges = batches.reduce(
    (sum, b) => sum + parseInt(b.makingCharges.replace(/[₹,]/g, "") || "0", 10),
    0,
  );
  return (
    <div style={{
      background: T.silkCream, padding: "11px 40px",
      borderBottom: `1px solid ${T.borderDef}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <span style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe, fontWeight: 500 }}>
        Showing <strong style={{ color: T.luxuryBrown }}>{batches.length}</strong> of <strong style={{ color: T.luxuryBrown }}>{batches.length}</strong> completed batches
      </span>
      <div style={{ display: "flex", gap: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500 }}>Total Completed:</span>
          <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.royalBurgundy }}>{batches.length}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontWeight: 500 }}>Total Making Charges:</span>
          <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color: T.green }}>₹{totalMakingCharges.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
}

// ── Section 4: Table ──────────────────────────────────────────────────────────
function TableSection({ batches, isLoading }: { batches: HistoryBatch[]; isLoading: boolean }) {
  const columns: ColumnDef<HistoryBatch>[] = [
    {
      id: "id", header: "Batch Number", accessor: b => b.id,
      cell: (_v, b) => (
        <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 600, color: T.royalBurgundy, background: "rgba(110,15,45,0.07)", padding: "2px 7px", borderRadius: 5 }}>
          {b.id}
        </span>
      ),
    },
    {
      id: "designCode", header: "Design Code", accessor: b => b.designCode,
      cell: (_v, b) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{b.designCode}</span>,
    },
    {
      id: "sareeType", header: "Saree Type", accessor: b => b.sareeType,
      cell: (_v, b) => (
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="3" width="12" height="8" rx="1.5" stroke={T.antiqueGold} strokeWidth="1.2" fill="none" />
            <line x1="1" y1="5.5" x2="13" y2="5.5" stroke={T.antiqueGold} strokeWidth="0.8" />
            <line x1="1" y1="8.5" x2="13" y2="8.5" stroke={T.antiqueGold} strokeWidth="0.8" />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 500 }}>{b.sareeType}</span>
        </div>
      ),
    },
    {
      id: "batchSize", header: "Batch Size", accessor: b => b.batchSize, align: "center",
      cell: (_v, b) => <div style={{ display: "flex", justifyContent: "center" }}><BatchSquares size={b.batchSize} /></div>,
    },
    {
      id: "weavers", header: "Weavers", accessor: b => b.weavers,
      cell: (_v, b) => (
        <div style={{ display: "flex", gap: -4 }}>
          {b.weavers.map((w, wi) => (
            <div key={wi} style={{ marginLeft: wi > 0 ? -8 : 0 }}>
              <Pip initials={w.initials} bg={w.bg} />
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "completion", header: "Completion", accessor: b => b.completion, align: "center",
      cell: (_v, b) => <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{b.completion}</span>,
    },
    {
      id: "allPieces", header: "All Pieces", accessor: b => b.allPieces, align: "center",
      cell: (_v, b) => <span style={{ fontFamily: F.mono, fontSize: 13, color: T.taupe }}>{b.allPieces}</span>,
    },
    {
      id: "okFound", header: "OK / Found", accessor: b => b.okPieces, align: "center",
      cell: (_v, b) => b.okPieces !== null ? (
        <span style={{ fontFamily: F.mono, fontSize: 12 }}>
          <span style={{ color: T.green, fontWeight: 600 }}>{b.okPieces}</span>
          <span style={{ color: T.taupe }}> / </span>
          <span style={{ color: T.amber, fontWeight: 600 }}>{b.found}</span>
        </span>
      ) : (
        <span style={{ color: T.taupe, fontSize: 12 }}>—</span>
      ),
    },
    {
      id: "status", header: "Printing / Embossing", accessor: b => b.status, type: "status",
      cell: (_v, b) => <StatusBadge status={b.status} />,
    },
    {
      id: "makingCharges", header: "Making Charges", accessor: b => b.makingCharges, align: "end",
      cell: (_v, b) => <span style={{ fontFamily: F.mono, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>{b.makingCharges}</span>,
    },
    {
      id: "completedOn", header: "Completed On", accessor: b => b.completedOn,
      cell: (_v, b) => <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe }}>{b.completedOn}</span>,
    },
    {
      id: "bulkOrder", header: "Bulk Order", accessor: b => b.bulkOrder, align: "center",
      cell: (_v, b) => b.bulkOrder ? (
        <span style={{ fontFamily: F.mono, fontSize: 12, background: "rgba(110,15,45,0.08)", color: T.royalBurgundy, padding: "2px 7px", borderRadius: 5, fontWeight: 600 }}>{b.bulkOrder}</span>
      ) : (
        <span style={{ color: "#D1C5BC", fontSize: 12 }}>—</span>
      ),
    },
    {
      id: "actions", header: "Actions", accessor: () => null, type: "actions", align: "center",
      cell: () => <IconButton variant="secondary" size="sm" label="View batch" icon={Eye} />,
    },
  ];

  return (
    <div style={{ padding: "0 40px", background: T.warmIvory }}>
      <div style={{ overflowX: "auto", borderRadius: 10, border: `1px solid ${T.borderDef}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", marginTop: 20 }}>
        <DataTable
          columns={columns}
          data={batches}
          getRowId={b => b.id}
          loading={isLoading}
          emptyTitle="No completed batches yet"
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 24px" }}>
        <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
          Showing {batches.length} of {batches.length} entries
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {["Prev", "1", "2", "3", "Next"].map((p) => (
            <Button key={p} variant={p === "1" ? "primary" : "secondary"} size="sm">
              {p}
            </Button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>Rows per page</span>
          <DropBtn label="10" />
        </div>
      </div>
    </div>
  );
}

export function ProductionHistoryPage() {
  const { batches, isLoading } = useHistoryBatches();
  return (
    <div style={{ minHeight: "100dvh", background: T.silkCream, fontFamily: F.ui }}>
      <PageHeader />
      <FilterBar />
      <StatsBar batches={batches} />
      <TableSection batches={batches} isLoading={isLoading} />
      <ProductionHistoryFooter />
    </div>
  );
}
