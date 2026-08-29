import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rows3 as Rows, Eye as PhEye, MapPin as PhMapPin } from "lucide-react";
import { T, F } from "../theme";
import { STATUS_CFG } from "../types";
import { WEAVERS } from "../data";
import { qcColor, getTwoLetterInitials } from "../common/primitives";
import { weaversApi, BackendWeaverStats } from "../../../../shared/api/weavers";
import { Button } from "../../../../shared/ui/primitives";
import { resolveAssetUrl } from "../../../../shared/api/uploads";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";
import { WeaverCardMockupStyle } from "./WeaverCardMockupStyle";
import { toInitials } from "@/shared/lib/initials";

export function useRealWeavers() {
  const { data: weaversRes, isLoading: rosterLoading, isError: rosterError } = useQuery({
    queryKey: ["weavers-card-roster"],
    queryFn: () => weaversApi.list(),
  });
  const roster = weaversRes?.items ?? [];
  const { data: statsList, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ["weavers-card-stats", roster.map(w => w.id)],
    queryFn: () => Promise.all(roster.map(w => weaversApi.getStats(w.id))),
    enabled: roster.length > 0,
  });
  const statsById = new Map((statsList ?? []).map(s => [s.weaverId, s]));

  const realWeavers = roster.map(w => {
    const s: BackendWeaverStats | undefined = statsById.get(w.id);
    const status = (s && s.activeBatchRowsCount > 0 ? "active" : "idle") as "active" | "idle" | "qc";
    return {
      id: w.id,
      code: w.code,
      name: w.name,
      initials: getTwoLetterInitials(w.name),
      bg: T.royalBurgundy,
      village: w.village || "—",
      cluster: w.cluster || "—",
      mobile: w.phone || "—",
      looms: w.looms,
      status,
      batch: s && s.activeBatchRowsCount > 0 ? `${s.activeBatchRowsCount} active` : "",
      design: "—",
      photo: resolveAssetUrl(w.photoUrl),
      thisMonth: s?.totalSareesWoven ?? 0,
      passRate: s?.qcPassRate ?? 0,
      totalEver: s?.totalSareesWoven ?? 0,
      totalPaid: "—",
      lastActive: "—",
    };
  });



  const combined = realWeavers;
  return Object.assign(combined, {
    isLoading: rosterLoading || (roster.length > 0 && statsLoading),
    isError: rosterError || statsError,
  });
}

export function WeaverCardGrid({ onSelect, onEdit, onBatches }: { onSelect: (w: typeof WEAVERS[0]) => void; onEdit: (w: typeof WEAVERS[0]) => void; onBatches: (w: typeof WEAVERS[0]) => void }) {
  const [showAll, setShowAll] = useState(true);
  const allWeavers = useRealWeavers();
  const visible = showAll ? allWeavers : allWeavers.slice(0, 4);

  if (allWeavers.isLoading) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
        Loading weavers…
      </div>
    );
  }
  if (allWeavers.isError) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.crimson }}>
        Couldn't load weavers.
      </div>
    );
  }
  if (allWeavers.length === 0) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe, fontStyle: "italic" }}>
        No weavers yet.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, alignItems: "stretch" }}>
        {visible.map((w, i) => {
          return (
            <div key={w.id}>
              <WeaverCardMockupStyle
                weaver={{
                  id: w.id,
                  name: w.name,
                  initials: w.initials,
                  code: w.code,
                  village: w.village || undefined,
                  mobile: w.mobile,
                  looms: w.looms,
                  status: w.status,
                  photo: w.photo,
                }}
                index={i}
                onNavigateDetails={() => onSelect(w)}
                onNavigateEdit={() => onEdit(w)}
                onNavigateBatches={() => onBatches(w)}
              />
            </div>
          );
        })}
      </div>
      {!showAll && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
          <Button
            onClick={() => setShowAll(true)}
            variant="secondary"
            size="lg"
            className="rounded-[14px] bg-white text-[#6E0F2D] border-[1.5px] border-[rgba(110,15,45,0.20)] shadow-[0_4px_12px_rgba(74,6,27,0.07)]"
          >
            Load More Weavers
          </Button>
        </div>
      )}
    </div>
  );
}
export function WeaverListView({ onSelect }: { onSelect: (w: typeof WEAVERS[0]) => void }) {
  const [showAll, setShowAll] = useState(false);
  const allWeavers = useRealWeavers();
  const visible = showAll ? allWeavers : allWeavers.slice(0, 5);

  if (allWeavers.isLoading) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
        Loading weavers…
      </div>
    );
  }
  if (allWeavers.isError) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.crimson }}>
        Couldn't load weavers.
      </div>
    );
  }
  if (allWeavers.length === 0) {
    return (
      <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, padding: "60px 20px", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe, fontStyle: "italic" }}>
        No weavers yet.
      </div>
    );
  }

  type VisibleWeaver = (typeof visible)[number];

  const columns: ColumnDef<VisibleWeaver>[] = [
    {
      id: "weaver", header: "Weaver", accessor: w => w.name, priority: 1,
      cell: (_v, w) => (
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 54, height: 54, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${T.antiqueGold}`, flexShrink: 0 }}>
            {w.photo
              ? <img src={w.photo} alt={w.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: w.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F.display, fontSize: 20, color: "#FFFDF9" }}>{toInitials(w.initials)}</span>
              </div>
            }
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: T.luxuryBrown, marginBottom: 4 }}>{w.name}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: T.royalBurgundy, letterSpacing: "0.4px" }}>{w.code ?? w.id}</div>
          </div>
        </div>
      ),
    },
    {
      id: "village", header: "Village / Area", accessor: w => w.village, priority: 3,
      cell: (_v, w) => (
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <PhMapPin size={15} color={T.taupe} />
          <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>{w.village}</span>
        </div>
      ),
    },
    {
      id: "status", header: "Status", accessor: w => w.status,
      cell: (_v, w) => {
        const cfg = STATUS_CFG[w.status];
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 13, fontWeight: 700, color: cfg.color, background: cfg.badge, borderRadius: 99, padding: "6px 14px", whiteSpace: "nowrap" }}>
            {w.status === "active" ? "● Weaving" : w.status === "qc" ? "● QC Check" : "○ Idle"}
          </span>
        );
      },
    },
    {
      id: "thisMonth", header: "This Month", accessor: w => w.thisMonth, type: "number", sortable: true,
      cell: (_v, w) => <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: T.antiqueGold }}>{w.thisMonth} <span style={{ fontSize: 13, fontFamily: F.ui, color: T.taupe }}>sarees</span></div>,
    },
    {
      id: "passRate", header: "Pass Rate", accessor: w => w.passRate, type: "number", sortable: true,
      cell: (_v, w) => <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 700, color: qcColor(w.passRate) }}>{w.passRate}%</div>,
    },
    {
      id: "looms", header: "Looms", accessor: w => w.looms, type: "number", priority: 3,
      cell: (_v, w) => (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Rows size={16} color={T.taupe} />
          <span style={{ fontFamily: F.ui, fontSize: 16, fontWeight: 600, color: T.luxuryBrown }}>{w.looms}</span>
        </div>
      ),
    },
    {
      id: "action", header: "Action", accessor: () => null, type: "actions", exportable: false,
      cell: (_v, w) => (
        <Button
          onClick={() => onSelect(w)}
          variant="secondary"
          size="sm"
          className="rounded-[10px] bg-[rgba(110,15,45,0.05)] text-[#6E0F2D] border-[1.5px] border-[rgba(110,15,45,0.18)]"
        >
          <PhEye size={18} /> View
        </Button>
      ),
    },
  ];

  return (
    <div style={{ background: "#FFFFFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, overflow: "hidden", boxShadow: "0 4px 18px rgba(74,6,27,0.06)" }}>
      <DataTable
        responsive
        columns={columns}
        data={visible}
        getRowId={w => w.id}
      />
      {!showAll && (
        <div style={{ padding: "22px 26px", textAlign: "center", borderTop: `1px solid ${T.borderDef}` }}>
          <Button onClick={() => setShowAll(true)} variant="link" className="text-[16px] font-bold text-[#6E0F2D] underline decoration-[rgba(110,15,45,0.35)]">Load More Weavers</Button>
        </div>
      )}
    </div>
  );
}
