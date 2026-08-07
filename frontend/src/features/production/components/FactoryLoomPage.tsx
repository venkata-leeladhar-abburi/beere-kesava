import React, { useCallback, useEffect, useState, useMemo } from "react";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import {
  Plus, Edit2,
  LayoutGrid, LayoutList, FileText,
} from "lucide-react";
import { FactoryLoom } from "../data/factoryLooms";
import { T, F } from "./factory-loom/theme";
import { STATUS_CFG, LoomBatch, LoomMaterial, LoomSaree } from "./factory-loom/types";
import { AddLoomModal } from "./factory-loom/AddLoomModal";
import { LoomDetailPage } from "./factory-loom/LoomDetailPage";
import { LoomCard } from "./factory-loom/LoomCard";
import { LoomAnalytics } from "./factory-loom/LoomAnalytics";
import { FadeUp } from "./factory-loom/theme";
import { ApiError } from "../../../shared/api/client";
import { BackendFactoryLoom, BackendLoomStatus, factoryLoomsApi } from "../../../shared/api/factory-looms";
import { batchesApi } from "../../../shared/api/batches";
import { rawMaterialsApi } from "../../../shared/api/rawMaterials";
import { qcApi } from "../../../shared/api/qc";
import { Button, SearchInput } from "../../../shared/ui/primitives";

function backendLoomToFrontend(l: BackendFactoryLoom): FactoryLoom {
  return {
    id: l.id,
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
  const [saveError, setSaveError] = useState<string | null>(null);
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
        status: b.status.toLowerCase() as any,
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
      quantity: item.currentStock,
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
    const ms = !search || l.loomNumber.toLowerCase().includes(search.toLowerCase()) || l.operatorName.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase());
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

  const handleStatusChange = async (loomId: string, st: FactoryLoom["status"]) => {
    try {
      const updated = await factoryLoomsApi.update(loomId, { status: FRONTEND_TO_BACKEND_STATUS[st] });
      setLooms(prev => prev.map(l => (l.id === loomId ? backendLoomToFrontend(updated) : l)));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not update status.");
    }
  };

  if (selected) {
    return (
      <LoomDetailPage
        loom={selected}
        onBack={() => setSelected(null)}
        onEdit={l => { setEditLoom(l); setShowModal(true); }}
      />
    );
  }

  return (
    <div style={{ background: "#FFFDF9", minHeight: "100vh", paddingBottom: 60 }}>
      {/* Top Banner */}
      <div style={{ background: `linear-gradient(135deg, ${T.deepWine} 0%, ${T.royalBurgundy} 100%)`, padding: "28px 56px", borderBottom: `1px solid ${T.borderDef}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: F.display, fontSize: 26, color: "#FFFDF9", margin: 0, fontWeight: 700, letterSpacing: "-0.3px" }}>
              Factory Looms & Power Loom Management
            </h1>
            <p style={{ fontFamily: F.ui, fontSize: 13, color: "rgba(255,253,249,0.70)", margin: "4px 0 0 0" }}>
              Real-time monitoring of in-house power looms, weaver assignments, production output & maintenance schedules.
            </p>
          </div>
          <Button variant="secondary" iconLeft={Plus} onClick={() => { setEditLoom(null); setShowModal(true); }}>
            Register New Power Loom
          </Button>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 24 }}>
          {[
            { label: "Total In-House Looms", val: looms.length, sub: "Registered units" },
            { label: "Active Looms", val: looms.filter(l => l.status === "active").length, sub: "Currently weaving", color: T.green },
            { label: "Idle Looms", val: looms.filter(l => l.status === "idle").length, sub: "Awaiting warp / weaver", color: T.antiqueGold },
            { label: "In Maintenance", val: looms.filter(l => l.status === "maintenance").length, sub: "Under repair", color: T.crimson },
          ].map((st, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "14px 18px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 11, color: "rgba(255,253,249,0.60)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{st.label}</div>
              <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 700, color: st.color || "#FFFDF9", marginTop: 2 }}>{st.val}</div>
              <div style={{ fontFamily: F.ui, fontSize: 11, color: "rgba(255,253,249,0.50)", marginTop: 2 }}>{st.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Body */}
      <div style={{ padding: "32px 56px 0" }}>
        {loadError && (
          <div style={{ background: "rgba(192,57,43,0.08)", border: `1px solid ${T.crimson}`, color: T.crimson, borderRadius: 12, padding: "14px 20px", marginBottom: 20, fontFamily: F.ui, fontSize: 14 }}>
            {loadError}
          </div>
        )}

        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 280 }}>
            <div style={{ width: 280 }}>
              <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search loom #, operator..." />
            </div>
            {(["all", "active", "idle", "maintenance"] as const).map(st => (
              <button
                key={st}
                onClick={() => setSf(st)}
                style={{
                  padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                  fontFamily: F.ui, fontSize: 12, fontWeight: 600, textTransform: "capitalize",
                  background: sf === st ? T.royalBurgundy : "#FFFFFF",
                  color: sf === st ? "#FFFDF9" : T.taupe,
                  boxShadow: sf === st ? "0 2px 8px rgba(110,15,45,0.20)" : "none",
                }}
              >
                {st} ({st === "all" ? looms.length : looms.filter(l => l.status === st).length})
              </button>
            ))}
          </div>

          <div style={{ display: "flex", background: "#FFFFFF", borderRadius: 10, border: `1px solid ${T.borderDef}`, padding: 3 }}>
            <button onClick={() => setView("card")} style={{ border: "none", background: view === "card" ? "rgba(110,15,45,0.08)" : "transparent", color: view === "card" ? T.royalBurgundy : T.taupe, padding: "6px 12px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, fontWeight: 600 }}>
              <LayoutGrid size={15} /> Card View
            </button>
            <button onClick={() => setView("table")} style={{ border: "none", background: view === "table" ? "rgba(110,15,45,0.08)" : "transparent", color: view === "table" ? T.royalBurgundy : T.taupe, padding: "6px 12px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 12, fontWeight: 600 }}>
              <LayoutList size={15} /> Table View
            </button>
          </div>
        </div>

        {/* Looms Listing */}
        {loading ? (
          <div style={{ padding: "60px 0", textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>Loading factory looms…</div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, padding: 48, textAlign: "center", fontFamily: F.ui, fontSize: 14, color: T.taupe }}>
            {looms.length === 0
              ? "No power looms registered in the database yet. Click '+ Register New Power Loom' above to add one."
              : "No power looms match your search criteria."}
          </div>
        ) : view === "card" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
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
          <div style={{ background: "#FFFFFF", borderRadius: 16, border: `1px solid ${T.borderDef}`, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.silkCream, borderBottom: `1px solid ${T.borderDef}`, textAlign: "left", fontFamily: F.ui, fontSize: 12, color: T.taupe, textTransform: "uppercase" }}>
                  <th style={{ padding: "14px 20px" }}>Loom #</th>
                  <th style={{ padding: "14px 20px" }}>Operator</th>
                  <th style={{ padding: "14px 20px" }}>Location</th>
                  <th style={{ padding: "14px 20px" }}>Status</th>
                  <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} style={{ borderBottom: `1px solid ${T.borderDef}`, fontFamily: F.ui, fontSize: 14 }}>
                    <td style={{ padding: "14px 20px", fontWeight: 700, color: T.luxuryBrown }}>{l.loomNumber}</td>
                    <td style={{ padding: "14px 20px", color: T.luxuryBrown }}>{l.operatorName || "—"}</td>
                    <td style={{ padding: "14px 20px", color: T.taupe }}>{l.location || "—"}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: 12, fontFamily: F.ui, fontSize: 12, fontWeight: 700, background: STATUS_CFG[l.status].bg, color: STATUS_CFG[l.status].color }}>
                        {STATUS_CFG[l.status].label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "right" }}>
                      <button onClick={() => setSelected(l)} style={{ border: "none", background: "none", color: T.royalBurgundy, cursor: "pointer", fontFamily: F.ui, fontWeight: 600, fontSize: 13, marginRight: 12 }}>View Details</button>
                      <button onClick={() => { setEditLoom(l); setShowModal(true); }} style={{ border: "none", background: "none", color: T.taupe, cursor: "pointer", fontFamily: F.ui, fontWeight: 600, fontSize: 13 }}><Edit2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LoomAnalytics looms={looms} batches={batches} materials={materials} sarees={sarees} />

      <AddLoomModal
        open={showModal}
        onClose={() => { setShowModal(false); setEditLoom(null); setSaveError(null); }}
        onAdd={handleAddOrEdit}
        editLoom={editLoom}
      />
    </div>
  );
}
