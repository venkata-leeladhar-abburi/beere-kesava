import React, { useCallback, useEffect, useState, useMemo } from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus, Edit2,
  LayoutGrid, LayoutList,
  Factory, CheckCircle2, AlertTriangle, Settings2
} from "lucide-react";
import factoryLoomsHero from "../../../assets/inline/factoryLoomsHero.jpg";
import { FactoryLoom, loomLabel } from "../data/factoryLooms";
import { T, F } from "./factory-loom/theme";
import { LoomBatch, LoomMaterial, LoomSaree, LOOM_STATUS_TO_CONDITION } from "./factory-loom/types";
import { StatusPill } from "../../../shared/ui/domain";
import { AddLoomModal } from "./factory-loom/AddLoomModal";
import { LoomDetailPage } from "./factory-loom/LoomDetailPage";
import { LoomCard } from "./factory-loom/LoomCard";
import { LoomAnalytics } from "./factory-loom/LoomAnalytics";
import { SectionCard } from "./common/primitives";
import { ApiError } from "../../../shared/api/client";
import { BackendFactoryLoom, BackendLoomStatus, factoryLoomsApi } from "../../../shared/api/factory-looms";
import { batchesApi } from "../../../shared/api/batches";
import { rawMaterialsApi } from "../../../shared/api/rawMaterials";
import { qcApi } from "../../../shared/api/qc";
import { Button, IconButton, SearchInput } from "../../../shared/ui/primitives";
import { DataTable, type ColumnDef } from "../../../shared/ui/data";
import { LoadingState, ErrorState, EmptyState, FilteredEmptyState } from "../../../shared/ui/state";
import { LuxuryStatsCard } from "../../../shared/ui/LuxuryStatsCard";
import { MaterialsFooter } from "@/features/materials";

function backendLoomToFrontend(l: BackendFactoryLoom): FactoryLoom {
  return {
    id: l.id,
    // The backend-generated display code ("Loom-002") — what loomLabel() and
    // every loom badge in the UI show. Dropping it here made the detail page
    // silently fall back to the raw loomNumber/UUID.
    displayCode: l.code ?? undefined,
    loomNumber: l.loomNumber,
    location: l.location ?? "",
    operatorName: l.operatorName ?? "",
    operatorPhone: l.operatorPhone ?? "",
    status: l.status.toLowerCase() as FactoryLoom["status"],
    installedYear: l.installedYear ? String(l.installedYear) : "",
    notes: l.notes ?? "",
  };
}

const FRONTEND_TO_BACKEND_STATUS: Record<FactoryLoom["status"], BackendLoomStatus> = {
  active: "ACTIVE",
  idle: "IDLE",
  maintenance: "MAINTENANCE",
};

// ── Main Page Export ──────────────────────────────────────────────────────────
export function FactoryLoomPage() {
  const [looms, setLooms] = useState<FactoryLoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [_saveError, setSaveError] = useState<string | null>(null);
  const [view, setView] = useState<"card"|"table">("card");
  const [search, setSearch] = useState("");
  const [sf, setSf] = useState<"all"|"active"|"idle"|"maintenance">("all");
  const [showModal, setShowModal] = useState(false);
  const [editLoom, setEditLoom] = useState<FactoryLoom|null>(null);
  const [selected, setSelected] = useState<FactoryLoom|null>(null);

  const { data: batchesRes } = useQuery({
    queryKey: ["factory-loom-batches"],
    queryFn: () => batchesApi.list(),
  });

  const { data: stockRes } = useQuery({
    queryKey: ["factory-loom-materials"],
    queryFn: () => rawMaterialsApi.listStock(),
  });

  const { data: qcRes } = useQuery({
    queryKey: ["factory-loom-qc"],
    queryFn: () => qcApi.list(500),
  });

  const batches = useMemo<LoomBatch[]>(() => {
    if (!batchesRes?.items) return [];
    return batchesRes.items.map(b => {
      const completedCount = b.rows.filter(r => r.qcPassed).length;
      return {
        batchId: b.id,
        loomId: b.rows.find(r => r.recipientType === "FACTORY_LOOM")?.factoryLoomId ?? "FL-001",
        sareeCount: b.totalCount,
        completedCount,
        dueDate: new Date(b.dueDate).toLocaleDateString("en-IN"),
        designCode: b.rows[0]?.designCode ?? "Design",
        designName: b.rows[0]?.designCode ?? "Design",
        orderRef: b.id,
        status: b.status.toLowerCase() as LoomBatch["status"],
        startDate: new Date(b.createdAt).toLocaleDateString("en-IN"),
      };
    });
  }, [batchesRes]);

  const materials = useMemo<LoomMaterial[]>(() => {
    if (!stockRes?.items) return [];
    return stockRes.items.map(item => ({
      batchId: `RM-${item.id.slice(-6).toUpperCase()}`,
      loomId: "FL-001",
      mirId: `MIR-${item.id.slice(-4).toUpperCase()}`,
      date: new Date(item.updatedAt).toLocaleDateString("en-IN"),
      materialType: item.materialType === "WARP" ? "Warp" : item.materialType === "RESHAM" ? "Resham" : "Jari",
      description: item.name,
      quantity: Number(item.currentStock),
      unit: item.unit,
      grnBatch: `GRN-${item.id.slice(-6).toUpperCase()}`,
      issuedBy: "Admin",
    }));
  }, [stockRes]);

  const sarees = useMemo<LoomSaree[]>(() => {
    if (!batchesRes?.items) return [];
    const qcMap = new Map((qcRes?.items ?? []).map(q => [q.sareeId, q]));
    const list: LoomSaree[] = [];

    for (const b of batchesRes.items) {
      for (const r of b.rows) {
        if (r.recipientType === "FACTORY_LOOM" && r.sareeId) {
          const qc = qcMap.get(r.sareeId);
          list.push({
            sareeId: r.sareeId,
            loomId: r.factoryLoomId ?? "FL-001",
            batchId: b.id,
            sareeType: r.sareeTypeCode ?? r.designCode ?? "Silk Saree",
            status: qc ? "complete" : r.sareeId ? "in-progress" : "pending",
            completedDate: qc ? new Date(qc.qcDate).toLocaleDateString("en-IN") : undefined,
            qualityStatus: qc ? (qc.result === "PASSED" ? "pass" : "fail") : undefined,
          });
        }
      }
    }
    return list;
  }, [batchesRes, qcRes]);

  const loadLooms = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await factoryLoomsApi.list();
      setLooms(res.items.map(backendLoomToFrontend));
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadLooms(); }, [loadLooms]);

  const filtered = looms.filter(l => {
    const ms = !search || loomLabel(l).toLowerCase().includes(search.toLowerCase()) || l.loomNumber.toLowerCase().includes(search.toLowerCase()) || l.operatorName.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase());
    return ms && (sf === "all" || l.status === sf);
  });

  const handleAddOrEdit = async (l: FactoryLoom) => {
    setSaveError(null);
    try {
      if (editLoom) {
        const updated = await factoryLoomsApi.update(l.id, {
          location: l.location,
          operatorName: l.operatorName,
          operatorPhone: l.operatorPhone,
          status: FRONTEND_TO_BACKEND_STATUS[l.status],
          installedYear: l.installedYear ? Number(l.installedYear) : undefined,
          notes: l.notes,
        });
        setLooms(prev => prev.map(x => (x.id === l.id ? backendLoomToFrontend(updated) : x)));
      } else {
        const created = await factoryLoomsApi.create({
          loomNumber: l.loomNumber,
          location: l.location,
          operatorName: l.operatorName,
          operatorPhone: l.operatorPhone,
          installedYear: l.installedYear ? Number(l.installedYear) : undefined,
          notes: l.notes,
        });
        const final =
          l.status !== "active"
            ? await factoryLoomsApi.update(created.id, { status: FRONTEND_TO_BACKEND_STATUS[l.status] })
            : created;
        setLooms(prev => [backendLoomToFrontend(final), ...prev]);
      }
      setShowModal(false);
      setEditLoom(null);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save the loom.");
    }
  };

  return (
    <div style={{ background: "#FFFDF9", minHeight: "var(--shell-content-min-h)", display: "flex", flexDirection: "column", paddingBottom: 0 }}>
      {selected ? (
        <LoomDetailPage
          loom={selected}
          onBack={() => setSelected(null)}
          onEdit={l => { setEditLoom(l); setShowModal(true); }}
        />
      ) : (
        <>
          {/* Hero Header */}
          <header style={{ background: "#0D0207", position: "relative", overflow: "hidden", minHeight: 340, display: "flex", alignItems: "center" }}>
            <div className="px-4 md:px-7 xl:px-12 w-full" style={{ position: "relative", zIndex: 2, paddingTop: 48, paddingBottom: 110 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontFamily: F.ui, fontSize: "clamp(11px, 1.4vw, 13px)", color: "rgba(255,253,249,0.50)", letterSpacing: "1.8px", textTransform: "uppercase", fontWeight: 400 }}>
                  Since 1999 · Power Loom Management
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
                <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 400, color: "#FFFDF9", margin: 0, lineHeight: 1.1 }}>Factory Looms</h1>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(22px, 5vw, 36px)", fontStyle: "italic", color: T.antiqueGold, fontWeight: 400 }}>&amp; Production</span>
              </div>
              <p className="max-w-[600px]" style={{ fontFamily: F.ui, fontSize: "clamp(14px, 2.2vw, 16px)", color: "rgba(255,253,249,0.70)", margin: "0 0 16px", lineHeight: 1.6 }}>
                Real-time monitoring of in-house power looms, weaver assignments, production output &amp; maintenance schedules.
              </p>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ alignSelf: "flex-start", flexShrink: 0, display: "inline-block" }}>
                <Button
                  onClick={() => { setEditLoom(null); setShowModal(true); }}
                  variant="primary"
                  iconLeft={Plus}
                  className="rounded-xl bg-[linear-gradient(135deg,#C89B47,#E7C983)] text-[#2C0913] shadow-[0_4px_20px_rgba(200,155,71,0.35)] hover:bg-[linear-gradient(135deg,#C89B47,#E7C983)]"
                >
                  Register New Power Loom
                </Button>
              </motion.div>
            </div>

            <div className="hidden xl:block" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "50%", zIndex: 1 }}>
              <div style={{ position: "absolute", inset: 0, zIndex: 2, background: `linear-gradient(to right, #0D0207 0%, rgba(13,2,7,0.7) 38%, rgba(13,2,7,0.1) 100%)` }} />
              <img src={factoryLoomsHero} alt="Factory Looms" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", filter: "brightness(0.75) saturate(0.90)" }} />
            </div>
          </header>

          {/* Stats Strip */}
          <div className="px-4 md:px-7 xl:px-14 -mt-8 md:-mt-14 xl:-mt-[80px]" style={{ position: "relative", zIndex: 20 }}>
            <LuxuryStatsCard stats={[
              { label: "Total In-House Looms", value: String(looms.length), sub: "Registered units", icon: <Factory size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
              { label: "Active Looms", value: String(looms.filter(l => l.status === "active").length), sub: "Currently weaving", icon: <CheckCircle2 size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
              { label: "Idle Looms", value: String(looms.filter(l => l.status === "idle").length), sub: "Awaiting warp / weaver", icon: <AlertTriangle size={20} color="rgba(231,201,131,0.95)" />, highlight: true },
              { label: "In Maintenance", value: String(looms.filter(l => l.status === "maintenance").length), sub: "Under repair", icon: <Settings2 size={20} color="rgba(245,232,208,0.90)" />, highlight: false },
            ]} />
          </div>

          {/* Main Body */}
          <div id="loom-directory" className="px-4 md:px-7 xl:px-14" style={{ paddingTop: 32 }}>
            <SectionCard
              icon={Factory}
              title="Looms Directory"
              subtitle="Browse every registered power loom, its operator, and current status."
              actions={
                <Button
                  onClick={() => { setEditLoom(null); setShowModal(true); }}
                  variant="secondary"
                  iconLeft={Plus}
                  className="bg-white/10 text-[#FFFDF9] border-white/20 hover:bg-white/20 hover:text-white"
                >
                  Register New Loom
                </Button>
              }
            >
              {loadError && (
                <div style={{ background: "rgba(192,57,43,0.08)", border: `1px solid ${T.crimson}`, color: T.crimson, borderRadius: 12, padding: "14px 20px", marginBottom: 20, fontFamily: F.ui, fontSize: 14 }}>
                  {loadError}
                </div>
              )}

              {/* Controls */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 280 }}>
                  <div style={{ width: 280 }}>
                    <SearchInput aria-label="Search loom number or operator" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search loom #, operator..." />
                  </div>
                  {(["all", "active", "idle", "maintenance"] as const).map(st => (
                    <Button
                      key={st}
                      onClick={() => setSf(st)}
                      variant={sf === st ? "primary" : "secondary"}
                      size="sm"
                      className="capitalize"
                    >
                      {st} ({st === "all" ? looms.length : looms.filter(l => l.status === st).length})
                    </Button>
                  ))}
                </div>

                <div style={{ display: "inline-flex", alignItems: "center", background: "#FFFFFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 999, padding: 3, gap: 2 }}>
                  <button
                    type="button"
                    onClick={() => setView("card")}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 999,
                      fontFamily: F.ui, fontSize: 13, fontWeight: 600,
                      background: view === "card" ? "#6E0F2D" : "transparent",
                      color: view === "card" ? "#FFFFFF" : T.taupe,
                      border: "none",
                      boxShadow: view === "card" ? "0 2px 8px rgba(110,15,45,0.25)" : "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <LayoutGrid size={15} color={view === "card" ? "#FFFFFF" : T.taupe} />
                    Card View
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("table")}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 999,
                      fontFamily: F.ui, fontSize: 13, fontWeight: 600,
                      background: view === "table" ? "#6E0F2D" : "transparent",
                      color: view === "table" ? "#FFFFFF" : T.taupe,
                      border: "none",
                      boxShadow: view === "table" ? "0 2px 8px rgba(110,15,45,0.25)" : "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <LayoutList size={15} color={view === "table" ? "#FFFFFF" : T.taupe} />
                    Table View
                  </button>
                </div>
              </div>

              {/* Looms Listing */}
              {loading ? (
                <LoadingState variant="skeleton" rows={4} />
              ) : loadError ? (
                <ErrorState error={loadError} onRetry={() => void loadLooms()} />
              ) : filtered.length === 0 ? (
                looms.length === 0 ? (
                  <EmptyState
                    title="No power looms registered yet"
                    description="Click '+ Register New Power Loom' above to add one."
                  />
                ) : (
                  <FilteredEmptyState onClearFilters={() => { setSearch(""); setSf("all"); }} />
                )
              ) : view === "card" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map(l => (
                    <LoomCard
                      key={l.id}
                      loom={l}
                      batches={batches}
                      sarees={sarees}
                      onView={() => setSelected(l)}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}` }} className="w-full overflow-x-auto section-nav-scroll p-2">
                  <div className="min-w-[700px]">
                    <DataTable
                      responsive={false}
                      columns={[
                        {
                          id: "loomNumber", header: "Loom #", accessor: l => loomLabel(l), priority: 1,
                          cell: (_v, l) => <span style={{ fontFamily: F.ui, fontSize: 14, fontWeight: 700, color: T.luxuryBrown }}>{loomLabel(l)}</span>,
                        },
                        {
                          id: "operator", header: "Operator", accessor: l => l.operatorName,
                          cell: (_v, l) => <span style={{ fontFamily: F.ui, fontSize: 14, color: T.luxuryBrown }}>{l.operatorName || "—"}</span>,
                        },
                        {
                          id: "location", header: "Location", accessor: l => l.location, priority: 3,
                          cell: (_v, l) => <span style={{ fontFamily: F.ui, fontSize: 14, color: T.taupe }}>{l.location || "—"}</span>,
                        },
                        {
                          id: "status", header: "Status", accessor: l => l.status, type: "status",
                          cell: (_v, l) => <StatusPill taxonomy="condition" status={LOOM_STATUS_TO_CONDITION[l.status]} />,
                        },
                        {
                          id: "actions", header: "Actions", accessor: () => null, type: "actions",
                          cell: (_v, l) => (
                            <>
                              <Button onClick={() => setSelected(l)} variant="link" size="sm" className="mr-3">View Details</Button>
                              <IconButton onClick={() => { setEditLoom(l); setShowModal(true); }} icon={Edit2} label={`Edit loom ${loomLabel(l)}`} variant="ghost" size="sm" />
                            </>
                          ),
                        },
                      ] as ColumnDef<FactoryLoom>[]}
                      data={filtered}
                      getRowId={l => l.id}
                    />
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          <div id="loom-analytics">
            <LoomAnalytics looms={looms} batches={batches} materials={materials} sarees={sarees} />
          </div>
        </>
      )}

      <AddLoomModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditLoom(null); setSaveError(null); }}
        onAdd={handleAddOrEdit}
        editLoom={editLoom}
      />
      <div style={{ marginTop: "auto" }}>
        <MaterialsFooter />
      </div>
    </div>
  );
}
