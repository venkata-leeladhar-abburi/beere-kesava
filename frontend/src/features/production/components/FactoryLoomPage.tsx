import React, { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Plus, Search, Edit2,
  LayoutGrid, LayoutList, FileText,
} from "lucide-react";
import { FactoryLoom } from "../data/factoryLooms";
import { T, F } from "./factory-loom/theme";
import { STATUS_CFG, LoomBatch, LoomMaterial, LoomSaree } from "./factory-loom/types";
import { SAMPLE_BATCHES, SAMPLE_MATERIALS, SAMPLE_SAREES } from "./factory-loom/sampleData";
import { AddLoomModal } from "./factory-loom/AddLoomModal";
import { LoomDetailPage } from "./factory-loom/LoomDetailPage";
import { LoomCard } from "./factory-loom/LoomCard";
import { LoomAnalytics } from "./factory-loom/LoomAnalytics";
import { FadeUp } from "./factory-loom/theme";
import { ApiError } from "../../../shared/api/client";
import { BackendFactoryLoom, BackendLoomStatus, factoryLoomsApi } from "../../../shared/api/factory-looms";

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
  const [batches] = useState<LoomBatch[]>(SAMPLE_BATCHES);
  const [materials] = useState<LoomMaterial[]>(SAMPLE_MATERIALS);
  const [sarees] = useState<LoomSaree[]>(SAMPLE_SAREES);

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
        // create() always defaults to ACTIVE server-side; patch if a different status was chosen.
        const final =
          l.status !== "active"
            ? await factoryLoomsApi.update(created.id, { status: FRONTEND_TO_BACKEND_STATUS[l.status] })
            : created;
        setLooms(prev => [backendLoomToFrontend(final), ...prev]);
      }
      setEditLoom(null);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save this loom. Please try again.");
    }
  };
  const handleEdit = (l: FactoryLoom) => { setEditLoom(l); setShowModal(true); setSelected(null); };

  const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 11, fontWeight: 500, color: T.taupe, letterSpacing: "1.4px", textTransform: "uppercase" as const, padding: "13px 18px", textAlign: "left" as const, borderBottom: `1px solid ${T.borderDef}`, background: T.silkCream, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { padding: "13px 18px", borderBottom: "1px solid rgba(110,15,45,0.05)", verticalAlign: "middle" as const, fontFamily: F.ui, fontSize: 13.5 };

  if (selected) return <LoomDetailPage loom={selected} onBack={() => setSelected(null)} onEdit={handleEdit} />;

  return (
    <div style={{ fontFamily: F.ui, background: T.silkCream, minHeight: "100vh" }}>
      <div style={{ background: T.darkBurgundy, position: "relative" as const, overflow: "hidden", minHeight: 190, display: "flex", alignItems: "stretch" }}>
        <div style={{ flex: 1, padding: "44px 56px", zIndex: 10, position: "relative" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 28, height: 1, background: T.antiqueGold }} />
            <span style={{ fontFamily: F.mono, fontSize: 9, color: `${T.antiqueGold}80`, letterSpacing: "1.5px", textTransform: "uppercase" as const }}>SINCE 1999 · PEOPLE</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 42, color: "#fff", margin: "0 0 8px", lineHeight: 1.1 }}>Factory Looms</h1>
              <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.60)", maxWidth: 560, margin: 0, lineHeight: 1.65 }}>Manage in-house factory looms, track batch assignments, materials, and production output.</p>
            </div>
            <motion.button onClick={() => { setEditLoom(null); setShowModal(true); }} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              style={{ display: "flex", alignItems: "center", gap: 8, background: T.antiqueGold, color: T.darkBurgundy, border: "none", borderRadius: 12, padding: "12px 22px", fontFamily: F.ui, fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
              <Plus size={17} /> Add Factory Loom
            </motion.button>
          </div>
        </div>
        {[320, 460].map((sz, i) => <div key={i} style={{ position: "absolute" as const, right: -sz * 0.3, bottom: -sz * 0.4, width: sz, height: sz, borderRadius: "50%", border: `1px solid rgba(200,155,71,${0.10 - i * 0.03})`, pointerEvents: "none" as const }} />)}
      </div>

      {(loadError || saveError) && (
        <div style={{ background: "rgba(192,57,43,0.08)", border: "1px solid rgba(192,57,43,0.25)", padding: "12px 56px", fontFamily: F.ui, fontSize: 13, color: T.crimson, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{loadError ? `Could not load factory looms: ${loadError}` : saveError}</span>
          {loadError && <button onClick={() => void loadLooms()} style={{ background: "transparent", border: `1px solid ${T.crimson}`, borderRadius: 8, padding: "4px 12px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: T.crimson, cursor: "pointer" }}>Retry</button>}
        </div>
      )}
      {loading && !loadError && (
        <div style={{ padding: "10px 56px", fontFamily: F.ui, fontSize: 13, color: T.taupe, background: "#FFF" }}>Loading factory looms…</div>
      )}

      {/* Stats */}
      <div style={{ background: "#FFF", borderBottom: `1px solid ${T.borderDef}`, padding: "14px 56px", display: "flex", gap: 28 }}>
        {[{ l: "Total Looms", v: looms.length, c: T.luxuryBrown }, { l: "Active", v: looms.filter(l => l.status === "active").length, c: T.green }, { l: "Idle", v: looms.filter(l => l.status === "idle").length, c: T.antiqueGold }, { l: "Maintenance", v: looms.filter(l => l.status === "maintenance").length, c: T.crimson }].map(s => (
          <div key={s.l} style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24, color: s.c }}>{s.v}</div>
            <div style={{ fontFamily: F.ui, fontSize: 13, color: T.taupe }}>{s.l}</div>
          </div>
        ))}
      </div>

      <LoomAnalytics looms={looms} batches={batches} materials={materials} sarees={sarees} />

      <div style={{ padding: "26px 56px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {(["all", "active", "idle", "maintenance"] as const).map(f => (
              <button key={f} onClick={() => setSf(f)} style={{ padding: "7px 16px", borderRadius: 99, cursor: "pointer", fontFamily: F.ui, fontSize: 13, fontWeight: 600, background: sf === f ? T.royalBurgundy : "transparent", color: sf === f ? "#FFF" : T.taupe, border: sf === f ? "none" : `1px solid rgba(110,15,45,0.16)` }}>
                {f === "all" ? "All Looms" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 10, padding: "8px 14px" }}>
              <Search size={14} color={T.taupe} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search loom or operator..."
                style={{ border: "none", outline: "none", fontFamily: F.ui, fontSize: 13, color: T.luxuryBrown, background: "transparent", width: 200 }} />
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {([["card", LayoutGrid, "Card"], ["table", LayoutList, "Table"]] as const).map(([v, Icon, label]) => (
                <motion.button key={v} onClick={() => setView(v as any)} whileHover={{ scale: 1.04 }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 13px", borderRadius: 10, cursor: "pointer", fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, background: view === v ? T.royalBurgundy : "#FFF", color: view === v ? "#FFF" : T.taupe, border: view === v ? "none" : `1px solid ${T.borderDef}` }}>
                  <Icon size={13} />{label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0
          ? <div style={{ textAlign: "center" as const, padding: "80px 0", fontFamily: F.ui, color: T.taupe }}>No looms found.</div>
          : view === "card"
          ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20, paddingBottom: 60 }}>
              {filtered.map((l, i) => <FadeUp key={l.id} delay={i * 0.05}><LoomCard loom={l} batches={batches} sarees={sarees} onView={() => setSelected(l)} /></FadeUp>)}
            </div>
          ) : (
            <div style={{ background: "#FFF", borderRadius: 18, border: `1px solid ${T.borderDef}`, overflow: "hidden", marginBottom: 60 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>{["ID","Loom","Location","Operator","Status","Active Batches","Sarees Done","Actions"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {filtered.map((l, i) => {
                    const sc = STATUS_CFG[l.status];
                    const ab = batches.filter(b => b.loomId === l.id && b.status === "active").length;
                    const done = sarees.filter(s => s.loomId === l.id && s.status === "complete").length;
                    return (
                      <tr key={l.id} style={{ background: i % 2 === 0 ? "#FFF" : T.warmIvory }}>
                        <td style={{ ...TD, fontFamily: F.mono, fontSize: 12, color: T.royalBurgundy, fontWeight: 700 }}>{l.id}</td>
                        <td style={{ ...TD, fontWeight: 700, color: T.luxuryBrown }}>{l.loomNumber}</td>
                        <td style={{ ...TD, fontSize: 13, color: T.taupe }}>{l.location}</td>
                        <td style={{ ...TD }}>{l.operatorName}</td>
                        <td style={TD}><span style={{ background: sc.bg, color: sc.color, borderRadius: 7, padding: "4px 10px", fontFamily: F.ui, fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>{sc.icon}{sc.label}</span></td>
                        <td style={{ ...TD, textAlign: "center" as const, fontWeight: 700, color: T.royalBurgundy }}>{ab}</td>
                        <td style={{ ...TD, textAlign: "center" as const, fontWeight: 700, color: T.green }}>{done}</td>
                        <td style={TD}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <motion.button onClick={() => setSelected(l)} whileHover={{ scale: 1.04 }} style={{ height: 34, padding: "0 12px", borderRadius: 8, border: `1px solid ${T.royalBurgundy}`, background: "transparent", color: T.royalBurgundy, fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><FileText size={13} /> View</motion.button>
                            <motion.button onClick={() => handleEdit(l)} whileHover={{ scale: 1.04 }} style={{ height: 34, padding: "0 12px", borderRadius: 8, border: `1px solid ${T.borderDef}`, background: "transparent", color: T.taupe, fontFamily: F.ui, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Edit2 size={13} /> Edit</motion.button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
      <AddLoomModal open={showModal} onClose={() => { setShowModal(false); setEditLoom(null); }} onAdd={handleAddOrEdit} editLoom={editLoom} />
    </div>
  );
}
