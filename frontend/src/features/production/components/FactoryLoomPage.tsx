import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Plus, Edit2,
  LayoutGrid, LayoutList, FileText,
} from "lucide-react";
import { FactoryLoom, FACTORY_LOOMS_LIST } from "../data/factoryLooms";
import { T, F } from "./factory-loom/theme";
import { STATUS_CFG, LoomBatch, LoomMaterial, LoomSaree } from "./factory-loom/types";
import { SAMPLE_BATCHES, SAMPLE_MATERIALS, SAMPLE_SAREES } from "./factory-loom/sampleData";
import { AddLoomModal } from "./factory-loom/AddLoomModal";
import { LoomDetailPage } from "./factory-loom/LoomDetailPage";
import { LoomCard } from "./factory-loom/LoomCard";
import { LoomAnalytics } from "./factory-loom/LoomAnalytics";
import { FadeUp } from "./factory-loom/theme";
import { Button, SearchInput } from "../../../shared/ui/primitives";

// ── Main Page Export ──────────────────────────────────────────────────────────
export function FactoryLoomPage() {
  const [looms, setLooms] = useState<FactoryLoom[]>(FACTORY_LOOMS_LIST);
  const [view, setView] = useState<"card"|"table">("card");
  const [search, setSearch] = useState("");
  const [sf, setSf] = useState<"all"|"active"|"idle"|"maintenance">("all");
  const [showModal, setShowModal] = useState(false);
  const [editLoom, setEditLoom] = useState<FactoryLoom|null>(null);
  const [selected, setSelected] = useState<FactoryLoom|null>(null);
  const [batches] = useState<LoomBatch[]>(SAMPLE_BATCHES);
  const [materials] = useState<LoomMaterial[]>(SAMPLE_MATERIALS);
  const [sarees] = useState<LoomSaree[]>(SAMPLE_SAREES);

  const filtered = looms.filter(l => {
    const ms = !search || l.loomNumber.toLowerCase().includes(search.toLowerCase()) || l.operatorName.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase());
    return ms && (sf === "all" || l.status === sf);
  });

  const handleAddOrEdit = (l: FactoryLoom) => {
    setLooms(prev => prev.find(x => x.id === l.id) ? prev.map(x => x.id === l.id ? l : x) : [...prev, l]);
    setEditLoom(null);
  };
  const handleEdit = (l: FactoryLoom) => { setEditLoom(l); setShowModal(true); setSelected(null); };

  const TH: React.CSSProperties = { fontFamily: F.mono, fontSize: 12, fontWeight: 500, color: T.taupe, letterSpacing: "1.4px", textTransform: "uppercase" as const, padding: "13px 18px", textAlign: "left" as const, borderBottom: `1px solid ${T.borderDef}`, background: T.silkCream, whiteSpace: "nowrap" as const };
  const TD: React.CSSProperties = { padding: "13px 18px", borderBottom: "1px solid rgba(110,15,45,0.05)", verticalAlign: "middle" as const, fontFamily: F.ui, fontSize: 13 };

  if (selected) return <LoomDetailPage loom={selected} onBack={() => setSelected(null)} onEdit={handleEdit} />;

  return (
    <div style={{ fontFamily: F.ui, background: T.silkCream, minHeight: "100dvh" }}>
      <div style={{ background: T.darkBurgundy, position: "relative" as const, overflow: "hidden", minHeight: 190, display: "flex", alignItems: "stretch" }}>
        <div style={{ flex: 1, padding: "44px 56px", zIndex: 10, position: "relative" as const }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 28, height: 1, background: T.antiqueGold }} />
            <span style={{ fontFamily: F.mono, fontSize: 12, color: `${T.antiqueGold}80`, letterSpacing: "1.5px", textTransform: "uppercase" as const }}>SINCE 1999 · PEOPLE</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 42, color: "#fff", margin: "0 0 8px", lineHeight: 1.1 }}>Factory Looms</h1>
              <p style={{ fontFamily: F.ui, fontSize: 14, color: "rgba(255,255,255,0.60)", maxWidth: 560, margin: 0, lineHeight: 1.65 }}>Manage in-house factory looms, track batch assignments, materials, and production output.</p>
            </div>
            <Button onClick={() => { setEditLoom(null); setShowModal(true); }} variant="primary" size="lg" className="shrink-0">
              <Plus size={17} /> Add Factory Loom
            </Button>
          </div>
        </div>
        {[320, 460].map((sz, i) => <div key={i} style={{ position: "absolute" as const, right: -sz * 0.3, bottom: -sz * 0.4, width: sz, height: sz, borderRadius: "50%", border: `1px solid rgba(200,155,71,${0.10 - i * 0.03})`, pointerEvents: "none" as const }} />)}
      </div>

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
              <Button key={f} onClick={() => setSf(f)} variant={sf === f ? "primary" : "tertiary"} size="sm">
                {f === "all" ? "All Looms" : f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <SearchInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search loom or operator..." className="w-[200px]" />
            <div style={{ display: "flex", gap: 5 }}>
              {([["card", LayoutGrid, "Card"], ["table", LayoutList, "Table"]] as const).map(([v, Icon, label]) => (
                <Button key={v} onClick={() => setView(v as any)} variant={view === v ? "primary" : "secondary"} size="sm">
                  <Icon size={13} />{label}
                </Button>
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
                            <Button onClick={() => setSelected(l)} variant="secondary" size="sm"><FileText size={13} /> View</Button>
                            <Button onClick={() => handleEdit(l)} variant="tertiary" size="sm"><Edit2 size={13} /> Edit</Button>
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
