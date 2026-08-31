import { Factory } from "lucide-react";
import { FactoryLoom, loomLabel } from "@/features/production";
import { BatchRecord } from "@/features/production";
import { F, STATUS_CFG, T, WeaverLite } from "./theme";
import { Button, SearchInput } from "../../../../shared/ui/primitives";
import { EntityCode } from "@/shared/ui/domain";
import { toInitials } from "@/shared/lib/initials";

export function RecipientSelector({
  recipientType, setRecipientType,
  weaverSearch, setWeaverSearch, showWeaverList, setShowWeaverList,
  selectedWeaver, setSelectedWeaverId,
  selectedLoom, setSelectedLoom,
  selectedFactoryLoom, setSelectedLoomId,
  selectedBatchId, setSelectedBatchId,
  weaverBatches, loomBatches,
  weavers, looms,
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
  weavers: WeaverLite[]; looms: FactoryLoom[];
}) {
  const filteredWeavers = weaverSearch.length >= 1
    ? weavers.filter(w => w.name.toLowerCase().includes(weaverSearch.toLowerCase()) || w.id.toLowerCase().includes(weaverSearch.toLowerCase()))
    : weavers;

  return (
    <>
      {/* Recipient type toggle */}
      <div className="grid grid-cols-2 w-full gap-2.5 mb-4">
        {(["weaver", "factoryLoom"] as const).map(type => (
          <Button
            key={type}
            onClick={() => { setRecipientType(type); setSelectedWeaverId(null); setSelectedLoomId(null); setSelectedLoom(""); setSelectedBatchId(null); setShowWeaverList(false); }}
            variant={recipientType === type ? "primary" : "secondary"}
            size="md"
            className="w-full justify-center"
            iconLeft={type === "factoryLoom" ? Factory : undefined}
          >
            {type === "weaver" ? "Weaver" : "Factory Loom"}
          </Button>
        ))}
      </div>

      {/* Weaver selection */}
      {recipientType === "weaver" && (
        !selectedWeaver ? (
          <div style={{ position: "relative" as const, marginBottom: 8 }}>
            <div style={{ position: "relative" as const }}>
              <SearchInput aria-label="Search weaver by name or ID" value={weaverSearch} onChange={e => { setWeaverSearch(e.target.value); setShowWeaverList(true); }} onFocus={() => setShowWeaverList(true)} onSearch={setWeaverSearch}
                placeholder="Search weaver by name or ID…" size="lg" />
            </div>
            {showWeaverList && (
              <div style={{ position: "absolute" as const, top: "calc(100% + 4px)", left: 0, right: 0, zIndex: "var(--z-dropdown)", background: "#FFF", border: "1px solid rgba(110,15,45,0.14)", borderRadius: 10, boxShadow: "0 10px 30px rgba(74,6,27,0.12)", overflow: "hidden" }}>
                <div style={{ padding: 8, borderBottom: `1px solid ${T.borderDef}` }}>
                  <SearchInput
                    aria-label="Filter weaver search"
                    // eslint-disable-next-line jsx-a11y/no-autofocus -- popover opens on user action; focusing the search box it contains is expected keyboard behavior
                    autoFocus
                    value={weaverSearch}
                    onChange={e => setWeaverSearch(e.target.value)}
                    onSearch={setWeaverSearch}
                    placeholder="Search weaver by name or ID…"
                    size="sm"
                    className="w-full"
                  />
                </div>
                <div style={{ maxHeight: 300, overflowY: "auto" as const }}>
                  {filteredWeavers.length === 0 ? (
                    <div style={{ padding: 16, textAlign: "center" as const, fontFamily: F.ui, fontSize: 13, color: T.taupe }}>No weavers found</div>
                  ) : filteredWeavers.map(w => {
                    const isSelected = selectedWeaver?.id === w.id;
                    return (
                      <button type="button" key={w.id} onClick={() => { setSelectedWeaverId(w.id); setSelectedBatchId(null); setShowWeaverList(false); setWeaverSearch(""); }}
                        style={{
                          width: "100%", textAlign: "left", padding: "10px 14px", borderBottom: `1px solid ${T.borderDef}`,
                          display: "flex", alignItems: "center", gap: 12, cursor: "pointer"
                        }}
                        className={`transition-colors ${isSelected ? "bg-[#F8EFE0]" : "bg-white hover:bg-[#F9F0E1]/70"}`}
                      >
                        <div style={{ width: 38, height: 38, borderRadius: "50%", background: w.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 12, color: "#FFF" }}>{toInitials(w.initials)}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: isSelected ? "#2C0913" : T.luxuryBrown, display: "flex", alignItems: "center", gap: 6 }}>{w.name} <EntityCode type="weaver" value={w.code} size="sm" /></div>
                          <div style={{ fontFamily: F.ui, fontSize: 12, color: isSelected ? "#3B2314" : T.taupe, marginTop: 2 }}>{w.village} · {w.looms} active loom{w.looms !== 1 ? "s" : ""}</div>
                        </div>
                        <span style={{ background: STATUS_CFG[w.status].bg, color: STATUS_CFG[w.status].color, borderRadius: 999, padding: "3px 10px", fontFamily: F.ui, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{STATUS_CFG[w.status].label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: "50%", background: selectedWeaver.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: "#FFF" }}>{toInitials(selectedWeaver.initials)}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 6 }}>{selectedWeaver.name} <EntityCode type="weaver" value={selectedWeaver.code} size="sm" /></div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{selectedWeaver.village} · {selectedWeaver.looms} active looms</div>
              </div>
              <span style={{ background: STATUS_CFG[selectedWeaver.status].bg, color: STATUS_CFG[selectedWeaver.status].color, borderRadius: 999, padding: "4px 12px", fontFamily: F.ui, fontSize: 12, fontWeight: 600 }}>{STATUS_CFG[selectedWeaver.status].label}</span>
              <Button onClick={() => { setSelectedWeaverId(null); setSelectedLoom(""); setSelectedBatchId(null); }} variant="link" size="sm">Change</Button>
            </div>
            {/* Loom selector */}
            <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "16px 20px", marginBottom: 12 }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 10 }}>Select Loom Number *</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {Array.from({ length: selectedWeaver.looms }, (_, idx) => idx + 1).map(loom => (
                  <Button key={loom} onClick={() => setSelectedLoom(loom)} variant={selectedLoom === loom ? "primary" : "secondary"} size="sm" className="font-code">Loom {loom}</Button>
                ))}
              </div>
            </div>
            {/* Batch selector */}
            <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "16px 20px" }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 10 }}>Select Batch Number *</div>
              {weaverBatches.length === 0 ? (
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic" }}>
                  No open production batches found for {selectedWeaver.name}.
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {weaverBatches.map(b => {
                    const sareeCount = b.rows.filter(r => r.weaverId === selectedWeaver.id && (selectedLoom === "" || r.weaverLoom === selectedLoom)).length;
                    const active = selectedBatchId === b.batchId;
                    return (
                      <Button key={b.batchId} onClick={() => setSelectedBatchId(b.batchId)} variant={active ? "primary" : "secondary"} size="md"
                        className="flex-col items-start gap-0.5 h-auto py-2">
                        <EntityCode type="batch" value={b.batchId} size="sm" />
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: active ? "rgba(255,255,255,0.75)" : T.taupe, textTransform: "capitalize" }}>{b.status} · {sareeCount} saree{sareeCount !== 1 ? "s" : ""}</span>
                      </Button>
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
            {looms.map(loom => (
              <Button key={loom.id} onClick={() => { setSelectedLoomId(loom.id); setSelectedBatchId(null); }} variant="secondary" size="lg"
                className="flex-col items-start h-auto py-3.5 px-4 text-left">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: loom.status === "active" ? T.royalBurgundy : loom.status === "maintenance" ? T.crimson : T.taupe, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Factory size={16} color="#FFF" />
                  </div>
                  <div>
                    <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown }}>{loom.loomNumber}</div>
                    <EntityCode type="loom" value={loomLabel(loom)} size="sm" />
                  </div>
                </div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>{loom.location} · {loom.operatorName}</div>
                <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 4, background: loom.status === "active" ? "rgba(30,102,64,0.10)" : loom.status === "maintenance" ? "rgba(192,57,43,0.09)" : "rgba(139,112,96,0.10)", borderRadius: 99, padding: "3px 9px" }}>
                  <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: loom.status === "active" ? T.green : loom.status === "maintenance" ? T.crimson : T.taupe }}>{loom.status.charAt(0).toUpperCase() + loom.status.slice(1)}</span>
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <>
            <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: 16, display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: T.royalBurgundy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Factory size={22} color="#FFF" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, display: "flex", alignItems: "center", gap: 6 }}>{selectedFactoryLoom.loomNumber} <EntityCode type="loom" value={loomLabel(selectedFactoryLoom)} size="sm" /></div>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 2 }}>{selectedFactoryLoom.location} · Operator: {selectedFactoryLoom.operatorName}</div>
              </div>
              <Button onClick={() => { setSelectedLoomId(null); setSelectedBatchId(null); }} variant="link" size="sm">Change</Button>
            </div>
            {/* Batch selector */}
            <div style={{ background: T.warmIvory, border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: "16px 20px" }}>
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 13, color: T.luxuryBrown, marginBottom: 10 }}>Select Batch Number *</div>
              {loomBatches.length === 0 ? (
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, fontStyle: "italic" }}>
                  No open production batches found for {selectedFactoryLoom.loomNumber}.
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {loomBatches.map(b => {
                    const sareeCount = b.rows.filter(r => r.factoryLoomId === selectedFactoryLoom.id).length;
                    const active = selectedBatchId === b.batchId;
                    return (
                      <Button key={b.batchId} onClick={() => setSelectedBatchId(b.batchId)} variant={active ? "primary" : "secondary"} size="md"
                        className="flex-col items-start gap-0.5 h-auto py-2">
                        <EntityCode type="batch" value={b.batchId} size="sm" />
                        <span style={{ fontFamily: F.ui, fontSize: 12, color: active ? "rgba(255,255,255,0.75)" : T.taupe, textTransform: "capitalize" }}>{b.status} · {sareeCount} saree{sareeCount !== 1 ? "s" : ""}</span>
                      </Button>
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
