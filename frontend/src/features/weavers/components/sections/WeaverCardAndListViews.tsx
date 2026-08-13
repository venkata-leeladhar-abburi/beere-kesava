import { useState } from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { Eye, MapPin, Phone, Edit3, Layers3, Activity, AlertTriangle } from "lucide-react";
import { Clock, Rows3 as Rows, Eye as PhEye, MapPin as PhMapPin } from "lucide-react";
import { T, F } from "../theme";
import { STATUS_CFG } from "../types";
import { WEAVERS } from "../data";
import { FadeUp, qcColor } from "../common/primitives";
import { weaversApi, BackendWeaverStats } from "../../../../shared/api/weavers";
import { Button } from "../../../../shared/ui/primitives";
import { resolveAssetUrl } from "../../../../shared/api/uploads";
import { DataTable, type ColumnDef } from "../../../../shared/ui/data";

export function useRealWeavers(extraWeavers: typeof WEAVERS = []) {
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
      initials: w.initials || `${w.firstName.charAt(0)}${w.lastName.charAt(0)}`,
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



  const combined = [...realWeavers, ...extraWeavers];
  return Object.assign(combined, {
    isLoading: rosterLoading || (roster.length > 0 && statsLoading),
    isError: rosterError || statsError,
  });
}

export function WeaverCardGrid({ onSelect, onEdit, onBatches, extraWeavers = [] }: { onSelect: (w: typeof WEAVERS[0]) => void; onEdit: (w: typeof WEAVERS[0]) => void; onBatches: (w: typeof WEAVERS[0]) => void; extraWeavers?: typeof WEAVERS }) {
  const [showAll, setShowAll] = useState(true);
  const allWeavers = useRealWeavers(extraWeavers);
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
          const cfg = STATUS_CFG[w.status];
          return (
            <FadeUp key={w.id} delay={i * 0.05} style={{ height: "100%" }}>
              <motion.div
                whileHover={{ y: -6, boxShadow: "0 30px 70px rgba(74,6,27,0.12)" }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                style={{ background: "#FFFFFF", borderRadius: 24, border: `1px solid ${T.borderDef}`, overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}
              >
                {/* Header Banner - Full Image Height 170px */}
                <div style={{ height: 170, position: "relative", overflow: "hidden", background: T.silkCream, flexShrink: 0 }}>
                  {w.photo ? (
                    <motion.img
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.5 }}
                      src={w.photo}
                      alt={w.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${w.bg} 0%, ${T.luxuryBrown} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: F.display, fontSize: 48, fontWeight: 700, color: "#FFFDF9", letterSpacing: "1px" }}>{w.initials}</span>
                    </div>
                  )}

                  {/* Dark gradient overlay for modern look */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)", pointerEvents: "none" }} />

                  {/* Floating ID badge in top left */}
                  <div style={{ position: "absolute", top: 12, left: 12, background: "rgba(26,10,15,0.65)", backdropFilter: "blur(6px)", color: "#FFFDF9", fontFamily: F.mono, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)" }}>
                    {w.code ?? w.id}
                  </div>

                  {/* Floating gentle status pill overlay at the bottom left of the image banner */}
                  <div style={{
                    position: "absolute",
                    bottom: 12,
                    left: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 8px"
                  }}>
                    {w.status === "active" ? (
                      <Activity size={13} color="#2ECC71" style={{ flexShrink: 0 }} />
                    ) : w.status === "qc" ? (
                      <Clock size={13} color="#F1C40F" style={{ flexShrink: 0 }} />
                    ) : (
                      <AlertTriangle size={13} color="#BDC3C7" style={{ flexShrink: 0 }} />
                    )}
                    <span style={{
                      fontFamily: F.ui,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#FFFFFF",
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.5px",
                      textShadow: "0 1px 4px rgba(0,0,0,0.6)"
                    }}>
                      {w.status === "active" ? "Currently Weaving" : w.status === "qc" ? "Pending QC" : "Idle"}
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                  {/* Name and Batch beside it */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" as const, marginBottom: 8 }}>
                    <div style={{ fontFamily: F.display, fontSize: 20, color: T.luxuryBrown, fontWeight: 800, lineHeight: 1.25 }}>
                      {w.name}
                    </div>
                    {w.batch && (
                      <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: T.royalBurgundy, background: T.warmCream, border: `1px solid ${T.borderGold}`, borderRadius: 6, padding: "3px 8px", textTransform: "uppercase" }}>
                        {w.batch}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                      <MapPin size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                      <span>{w.village}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>
                      <Phone size={14} color={T.royalBurgundy} style={{ flexShrink: 0 }} />
                      <span>{w.mobile}</span>
                    </div>
                  </div>

                  <div style={{ height: 1, background: "rgba(110,15,45,0.06)", margin: "4px 0 12px 0" }} />

                  {/* Looms stat */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ background: "rgba(110,15,45,0.03)", border: `1px solid ${T.borderDef}`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(110,15,45,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Rows size={14} color={T.royalBurgundy} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 700, color: T.taupe, letterSpacing: "0.5px", textTransform: "uppercase" }}>Looms</span>
                        <span style={{ fontFamily: F.display, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{w.looms} Looms</span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 8 }}>
                    <Button
                      onClick={() => onSelect(w)}
                      variant="secondary"
                      size="sm"
                      className="flex-1 rounded-xl bg-[rgba(110,15,45,0.04)] text-[#6E0F2D] border-[1.5px] border-[rgba(110,15,45,0.15)]"
                    >
                      <Eye size={14} /> Details
                    </Button>
                    <Button
                      onClick={() => onEdit(w)}
                      variant="secondary"
                      size="sm"
                      className="flex-1 rounded-xl bg-transparent text-[#6E0F2D] border border-[#6E0F2D]"
                    >
                      <Edit3 size={13} /> Edit
                    </Button>
                    <Button
                      onClick={() => onBatches(w)}
                      variant="secondary"
                      size="sm"
                      className="flex-1 rounded-xl bg-[rgba(110,15,45,0.04)] text-[#6E0F2D] border-[1.5px] border-[rgba(110,15,45,0.15)]"
                    >
                      <Layers3 size={14} /> Batches
                    </Button>
                  </div>
                </div>
              </motion.div>
            </FadeUp>
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
export function WeaverListView({ onSelect, extraWeavers = [] }: { onSelect: (w: typeof WEAVERS[0]) => void; extraWeavers?: typeof WEAVERS }) {
  const [showAll, setShowAll] = useState(false);
  const allWeavers = useRealWeavers(extraWeavers);
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
                <span style={{ fontFamily: F.display, fontSize: 20, color: "#FFFDF9" }}>{w.initials}</span>
              </div>
            }
          </div>
          <div>
            <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 16, color: T.luxuryBrown, marginBottom: 4 }}>{w.name}</div>
            <div style={{ fontFamily: F.mono, fontSize: 13, color: T.royalBurgundy, letterSpacing: "0.4px" }}>{w.code ?? w.id}</div>
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
