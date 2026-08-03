import React from "react";
import { Factory, Search } from "lucide-react";
import { FactoryLoom, FACTORY_LOOMS_LIST } from "../../../production/data/factoryLooms";
import { BatchRecord } from "../../../production/contexts/BatchContext";
import { F, STATUS_CFG, T, WeaverLite, WEAVERS } from "./theme";

export function RecipientSelector({
  recipientType, setRecipientType,
  weaverSearch, setWeaverSearch, showWeaverList, setShowWeaverList,
  selectedWeaver, setSelectedWeaverId,
  selectedLoom, setSelectedLoom,
  selectedFactoryLoom, setSelectedLoomId,
  selectedBatchId, setSelectedBatchId,
  weaverBatches, loomBatches,
}: {
  recipientType: "weaver" | "factoryLoom";
  setRecipientType: (t: "weaver" | "factoryLoom") => void;
  weaverSearch: string; setWeaverSearch: (v: string) => void;
  showWeaverList: boolean; setShowWeaverList: (v: boolean) => void;
  selectedWeaver: WeaverLite | null; setSelectedWeaverId: (id: string | null) => void;
  selectedLoom: number | ""; setSelectedLoom: (v: number | "") => void;
  selectedFactoryLoom: FactoryLoom | null; setSelectedLoomId: (id: string | null) => void;
  selectedBatchId: string | null; setSelectedBatchId: (id: string | null) => void;
  weaverBatches: BatchRecord[]; loomBatches: BatchRecord[];
}) {
  const filteredWeavers = weaverSearch.length >= 1
    ? WEAVERS.filter(w => w.name.toLowerCase().includes(weaverSearch.toLowerCase()) || w.id.toLowerCase().includes(weaverSearch.toLowerCase()))
    : WEAVERS;

  return (
    <>
      {/* Recipient type toggle */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {(["weaver", "factoryLoom"] as const).map(type => (
          <button
            key={type}
            onClick={() => { setRecipientType(type); setSelectedWeaverId(null); setSelectedLoomId(null); setSelectedLoom(""); setSelectedBatchId(null); setShowWeaverList(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 20px", borderRadius: 10, cursor: "pointer",
              fontFamily: F.ui, fontSize: 13.5, fontWeight: 700,
              border: `1.5px solid ${recipientType === type ? T.royalBurgundy : T.borderDef}`,
              background: recipientType === type ? T.royalBurgundy : "#FFF",
              color: recipientType === type ? "#FFF" : T.taupe,
              transition: "all 0.15s",
            }}
          >
            {type === "weaver"
              ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> Weaver</>
              : <><Factory size={15} /> Factory Loom</>
            }
          </button>
        ))}
      </div>

      {/* Weaver selection */}
      {recipientType === "weaver" && (
        !selectedWeaver ? (
          <div style={{ position: "relative" as const, marginBottom: 8 }}>
            <div style={{ position: "relative" as const }}>
              <Search size={16} color={T.taupe} style={{ position: "absolute" as const, left: 14, top: "50%", transform: "translateY(-50%)" }} />
              <input value={weaverSearch} onChange={e => { setWeaverSearch(e.target.value); setShowWeaverList(true); }} onFocus={() => setShowWeaverList(true)}
                placeholder="Search weaver by name or ID…"
                style={{ width: "100%", height: 48, borderRadius: 12, border: `1.5px solid ${showWeaverList ? T.royalBurgundy : T.borderDef}`, padding: "0 14px 0 42px", fontFamily: F.ui, fontSize: 14, outline: "none", boxSizing: "border-box" as const }} />
            </div>
            {showWeaverList && (
              <div style={{ position: "absolute" as const, top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 40, background: "#FFF", border: `1px solid ${T.royalBurgundy}`, borderRadius: 14, boxShadow: "0 8px 28px rgba(74,6,27,0.16)", maxHeight: 320, overflowY: "auto" as const }}>
                {filteredWeavers.length === 0 ? (
                  <div style={{ padding: 16, textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No weavers found</div>
                ) : filteredWeavers.map(w => (
                  <button key={w.id} onClick={() => { setSelectedWeaverId(w.id); setSelectedBatchId(null); setShowWeaverList(false); setWeaverSearch(""); }} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", border: "none",
                    borderBottom: `1px solid ${T.borderDef}`, background: "#FFF", cursor: "pointer", textAlign: "left" as const,
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: w.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 12, color: "#FFF" }}>{w.initials}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13.5, color: T.luxuryBrown }}>{w.name} <span style={{ fontFamily: F.mono, fontSize: 11, color: T.taupe, fontWeight: 400 }}>· {w.id}</span></div>
                      <div style={{ fontFamily: F.ui, fontSize: 11.5, color: T.taupe }}>{w.village} · {w.looms} active loom{w.looms !== 1 ? "s" : ""}</div>
                    </div>
                    <span style={{ background: STATUS_CFG[w.status].bg, color: STATUS_CFG[w.status].color, borderRadius: 999, padding: "3px 10px", fontFamily: F.ui, fontSize: 11, fontWeight: 600 }}>{STATUS_CFG[w.status].label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: selectedWeaver.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: "#FFF" }}>{selectedWeaver.initials}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>{selectedWeaver.name} <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, fontWeight: 400 }}>· {selectedWeaver.id}</span></div>
                <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, marginTop: 2 }}>{selectedWeaver.village} · {selectedWeaver.looms} active looms</div>
              </div>
              <span style={{ background: STATUS_CFG[selectedWeaver.status].bg, color: STATUS_CFG[selectedWeaver.status].color, borderRadius: 999, padding: "4px 12px", fontFamily: F.ui, fontSize: 12, fontWeight: 600 }}>{STATUS_CFG[selectedWeaver.status].label}</span>
              <button onClick={() => { setSelectedWeaverId(null); setSelectedLoom(""); setSelectedBatchId(null); }} style={{ background: "none", border: "none", fontFamily: F.ui, fontSize: 12.5, color: T.royalBurgundy, cursor: "pointer", textDecoration: "underline" }}>Change</button>
            </div>
            {/* Loom selector */}
            <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "16px 20px", marginBottom: 12 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 10 }}>Select Loom Number *</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {Array.from({ length: selectedWeaver.looms }, (_, idx) => idx + 1).map(loom => (
                  <button key={loom} onClick={() => setSelectedLoom(loom)} style={{ padding: "8px 20px", borderRadius: 8, cursor: "pointer", border: `1.5px solid ${selectedLoom === loom ? T.royalBurgundy : T.borderDef}`, background: selectedLoom === loom ? T.royalBurgundy : "#FFF", color: selectedLoom === loom ? "#FFF" : T.luxuryBrown, fontFamily: F.mono, fontSize: 13, fontWeight: 700, transition: "all 0.15s ease" }}>Loom {loom}</button>
                ))}
              </div>
            </div>
            {/* Batch selector */}
            <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "16px 20px" }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 10 }}>Select Batch Number *</div>
              {weaverBatches.length === 0 ? (
                <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, fontStyle: "italic" }}>
                  No open production batches found for {selectedWeaver.name}.
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {weaverBatches.map(b => {
                    const sareeCount = b.rows.filter(r => r.weaverId === selectedWeaver.id).length;
                    const active = selectedBatchId === b.batchId;
                    return (
                      <button key={b.batchId} onClick={() => setSelectedBatchId(b.batchId)} style={{
                        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                        padding: "8px 16px", borderRadius: 10, cursor: "pointer",
                        border: `1.5px solid ${active ? T.royalBurgundy : T.borderDef}`,
                        background: active ? T.royalBurgundy : "#FFF",
                        color: active ? "#FFF" : T.luxuryBrown, transition: "all 0.15s ease",
                      }}>
                        <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700 }}>{b.batchId}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 10.5, color: active ? "rgba(255,255,255,0.75)" : T.taupe, textTransform: "capitalize" }}>{b.status} · {sareeCount} saree{sareeCount !== 1 ? "s" : ""}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )
      )}

      {/* Factory Loom selection */}
      {recipientType === "factoryLoom" && (
        !selectedFactoryLoom ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {FACTORY_LOOMS_LIST.map(loom => (
              <button key={loom.id} onClick={() => { setSelectedLoomId(loom.id); setSelectedBatchId(null); }} style={{
                background: "#FFF", border: `1.5px solid ${T.borderDef}`, borderRadius: 14, padding: "14px 16px",
                cursor: "pointer", textAlign: "left" as const, transition: "all 0.15s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: loom.status === "active" ? T.royalBurgundy : loom.status === "maintenance" ? T.crimson : T.taupe, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Factory size={16} color="#FFF" />
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13.5, color: T.luxuryBrown }}>{loom.loomNumber}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 10.5, color: T.taupe }}>{loom.id}</div>
                  </div>
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{loom.location} · {loom.operatorName}</div>
                <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4, background: loom.status === "active" ? "rgba(30,102,64,0.10)" : loom.status === "maintenance" ? "rgba(192,57,43,0.09)" : "rgba(139,112,96,0.10)", borderRadius: 99, padding: "3px 9px" }}>
                  <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 600, color: loom.status === "active" ? T.green : loom.status === "maintenance" ? T.crimson : T.taupe }}>{loom.status.charAt(0).toUpperCase() + loom.status.slice(1)}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: T.royalBurgundy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Factory size={22} color="#FFF" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 15, color: T.luxuryBrown }}>{selectedFactoryLoom.loomNumber} <span style={{ fontFamily: F.mono, fontSize: 12, color: T.taupe, fontWeight: 400 }}>· {selectedFactoryLoom.id}</span></div>
                <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, marginTop: 2 }}>{selectedFactoryLoom.location} · Operator: {selectedFactoryLoom.operatorName}</div>
              </div>
              <button onClick={() => { setSelectedLoomId(null); setSelectedBatchId(null); }} style={{ background: "none", border: "none", fontFamily: F.ui, fontSize: 12.5, color: T.royalBurgundy, cursor: "pointer", textDecoration: "underline" }}>Change</button>
            </div>
            {/* Batch selector */}
            <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "16px 20px" }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 10 }}>Select Batch Number *</div>
              {loomBatches.length === 0 ? (
                <div style={{ fontFamily: F.ui, fontSize: 12.5, color: T.taupe, fontStyle: "italic" }}>
                  No open production batches found for {selectedFactoryLoom.loomNumber}.
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {loomBatches.map(b => {
                    const sareeCount = b.rows.filter(r => r.factoryLoomId === selectedFactoryLoom.id).length;
                    const active = selectedBatchId === b.batchId;
                    return (
                      <button key={b.batchId} onClick={() => setSelectedBatchId(b.batchId)} style={{
                        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
                        padding: "8px 16px", borderRadius: 10, cursor: "pointer",
                        border: `1.5px solid ${active ? T.royalBurgundy : T.borderDef}`,
                        background: active ? T.royalBurgundy : "#FFF",
                        color: active ? "#FFF" : T.luxuryBrown, transition: "all 0.15s ease",
                      }}>
                        <span style={{ fontFamily: F.mono, fontSize: 13, fontWeight: 700 }}>{b.batchId}</span>
                        <span style={{ fontFamily: F.ui, fontSize: 10.5, color: active ? "rgba(255,255,255,0.75)" : T.taupe, textTransform: "capitalize" }}>{b.status} · {sareeCount} saree{sareeCount !== 1 ? "s" : ""}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )
      )}
    </>
  );
}
