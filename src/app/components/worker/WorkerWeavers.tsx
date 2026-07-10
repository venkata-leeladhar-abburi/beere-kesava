import React, { useState } from "react";
import {
  ChevronRight, ChevronLeft, Camera, UploadCloud, CheckCircle2, AlertTriangle,
  Search, QrCode, Plus, Printer, Layers, Sparkles, Scissors,
  Building2, Users, PenLine, Send, Clock, X, Palette,
} from "lucide-react";
import { C, F, card, inputStyle, btnPrimary, btnGhost } from "./tokens";

type WeaversPage = "menu" | "design" | "issue" | "receive";
type IssueSource = "own" | "outsourced" | null;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 5 }}>{children}</div>;
}

function SectionLabel({ step, title }: { step: number; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 16px 8px" }}>
      <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ fontFamily: F.m, fontSize: 9, fontWeight: 700, color: "#FFF" }}>{step}</span>
      </div>
      <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.burg }}>{title}</span>
    </div>
  );
}

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ height: 48, background: C.burg, display: "flex", alignItems: "center", padding: "0 14px", gap: 10 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}>
        <ChevronLeft size={18} color="rgba(255,255,255,0.85)" />
      </button>
      <span style={{ fontFamily: F.d, fontSize: 15, fontWeight: 600, color: "#FFF", flex: 1 }}>{title}</span>
    </div>
  );
}

// ─── Design Planning Page ────────────────────────────────────────────────────
function DesignPlanningPage({ onBack }: { onBack: () => void }) {
  const [designCode, setDesignCode] = useState("BKB-045");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <>
        <PageHeader title="Design Planning" onBack={onBack} />
        <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={30} color={C.green} />
          </div>
          <div style={{ fontFamily: F.d, fontSize: 20, fontWeight: 700, color: C.text, textAlign: "center" }}>Design Saved</div>
          <div style={{ fontFamily: F.m, fontSize: 15, color: C.burg }}>{designCode}</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center" }}>Color slip has been linked to the design.</div>
          <button onClick={() => setSaved(false)} style={{ ...btnGhost, width: "auto", padding: "0 28px" }}>Back to Design Planning</button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Design Planning" onBack={onBack} />
      <div style={{ paddingBottom: 28 }}>
        {/* Context */}
        <div style={{ margin: "12px 16px 4px", background: "rgba(107,26,42,0.04)", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 14px" }}>
          <p style={{ fontFamily: F.u, fontSize: 13, color: C.muted, lineHeight: 1.5, margin: 0 }}>
            Upload the color slip for a design. Link it to a batch so weavers can see it.
          </p>
        </div>

        {/* Step 1 — Design Code */}
        <SectionLabel step={1} title="Select or Create Design Code" />
        <div style={{ margin: "0 16px" }}>
          <div style={{ position: "relative" }}>
            <input value={designCode} onChange={e => setDesignCode(e.target.value)} placeholder="Type design code..."
              style={{ ...inputStyle, paddingLeft: 38, height: 46 }} />
            <Search size={14} color={C.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          </div>
          {designCode && (
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "inline-flex", background: "rgba(196,146,58,0.12)", padding: "5px 10px", borderRadius: 7 }}>
                <span style={{ fontFamily: F.m, fontSize: 12, color: C.burg }}>{designCode} · Cream Zari Border Saree</span>
              </div>
              <button style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 12, color: C.gold, cursor: "pointer", padding: 0 }}>+ New Code</button>
            </div>
          )}
        </div>

        {/* Step 2 — Photo */}
        <SectionLabel step={2} title="Take Photo of Color Slip" />
        <div style={{ margin: "0 16px" }}>
          {!hasPhoto ? (
            <div style={{ background: "#FFF", border: "1px dashed rgba(139,26,46,0.25)", borderRadius: 12, padding: "20px 16px" }}>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <Camera size={36} color={C.gold} style={{ margin: "0 auto 8px" }} />
                <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 4 }}>Take a clear photo of the color slip paper</div>
                <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>Must show: border color, body design, pallu details</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setHasPhoto(true)} style={{ flex: 1, height: 44, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontSize: 13, fontWeight: 600, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Camera size={14} /> Camera
                </button>
                <button onClick={() => setHasPhoto(true)} style={{ flex: 1, height: 44, background: "#FFF", border: `1px solid ${C.burg}`, borderRadius: 999, fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.burg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <UploadCloud size={14} /> Gallery
                </button>
              </div>
            </div>
          ) : (
            <div style={{ ...card, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 72, height: 72, background: "linear-gradient(135deg, #F0E8D0, #E8D5A0)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${C.bdr}`, flexShrink: 0 }}>
                <span style={{ fontSize: 28 }}>🎨</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <CheckCircle2 size={13} color={C.green} />
                  <span style={{ fontFamily: F.u, fontSize: 13, color: C.green, fontWeight: 500 }}>Photo looks good</span>
                </div>
                <button onClick={() => setHasPhoto(false)} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 12, color: C.burg, cursor: "pointer", textDecoration: "underline", padding: 0 }}>Retake Photo</button>
              </div>
            </div>
          )}
        </div>

        {/* Step 3 — Link Batch */}
        <SectionLabel step={3} title="Link to Batch (Optional)" />
        <div style={{ margin: "0 16px" }}>
          <div style={{ position: "relative" }}>
            <select style={{ ...inputStyle, appearance: "none", cursor: "pointer", height: 46 }}>
              <option value="">Select batch to link...</option>
              <option>BATCH-086 · Padma Veni · Active</option>
              <option>BATCH-089 · Ravi Kumar · Active</option>
              <option>BATCH-081 · Suresh Murti · Active</option>
            </select>
            <ChevronRight size={14} color={C.muted} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%) rotate(90deg)", pointerEvents: "none" }} />
          </div>
        </div>

        <div style={{ padding: "18px 16px 0" }}>
          <button onClick={() => setSaved(true)} style={{ ...btnPrimary, height: 50, gap: 8 }}>
            💾 Save Design and Color Slip
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Issue Material Page ─────────────────────────────────────────────────────
const WEAVERS = [
  { name: "Padma Veni", code: "WV-002", looms: 2, avatar: "PV" },
  { name: "Ravi Kumar", code: "WV-001", looms: 3, avatar: "RK" },
  { name: "Suresh Murti", code: "WV-007", looms: 1, avatar: "SM" },
];

function IssueColors({ label, compact }: { label: string; compact?: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [qty, setQty] = useState<Record<string, string>>({});
  const colors = [
    { name: "Gold", hex: "#C4923A" }, { name: "Silver", hex: "#9E9E9E" },
    { name: "Copper", hex: "#B87333" }, { name: "Pink", hex: "#E91E8C" },
    { name: "Blue", hex: "#1565C0" }, { name: "Green", hex: "#1E6640" },
  ];
  const toggle = (name: string) => setSelected(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);
  const swatchSize = compact ? 24 : 28;
  return (
    <div>
      {!compact && <FieldLabel>{label} Colors</FieldLabel>}
      <div style={{ display: "flex", gap: compact ? 5 : 7, marginBottom: selected.length > 0 ? 8 : 4, flexWrap: "wrap" }}>
        {colors.map(c => (
          <button key={c.name} title={c.name} onClick={() => toggle(c.name)}
            style={{ width: swatchSize, height: swatchSize, borderRadius: "50%", background: c.hex, border: selected.includes(c.name) ? "3px solid #1A0A0F" : "3px solid transparent", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.15)", flexShrink: 0 }} />
        ))}
      </div>
      {selected.map(cl => (
        <div key={cl} style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: colors.find(c => c.name === cl)?.hex, flexShrink: 0 }} />
          <span style={{ fontFamily: F.u, fontSize: compact ? 10 : 12, color: C.muted, flexShrink: 0, width: compact ? 36 : 48 }}>{cl}:</span>
          <div style={{ position: "relative", flex: 1 }}>
            <input type="number" value={qty[cl] || ""} onChange={e => setQty(p => ({ ...p, [cl]: e.target.value }))} placeholder="0"
              style={{ ...inputStyle, height: compact ? 34 : 38, fontFamily: F.m, fontSize: compact ? 12 : 14, paddingRight: 30 }} />
            <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: F.u, fontSize: 10, color: C.muted }}>kg</span>
          </div>
        </div>
      ))}
      <button style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: `1px dashed rgba(196,146,58,0.40)`, borderRadius: 7, padding: compact ? "4px 8px" : "6px 12px", fontFamily: F.u, fontSize: compact ? 10 : 12, color: C.gold, cursor: "pointer" }}>
        <Plus size={compact ? 10 : 12} /> Add Color
      </button>
    </div>
  );
}

function IssueMaterialPage({ onBack }: { onBack: () => void }) {
  const [source, setSource] = useState<IssueSource>(null);
  const [loomNum, setLoomNum] = useState("");
  const [selectedWeaver, setSelectedWeaver] = useState<typeof WEAVERS[0] | null>(null);
  const [weaverSearch, setWeaverSearch] = useState("");
  const [showWeaverList, setShowWeaverList] = useState(false);
  const [jariUnit, setJariUnit] = useState<"Reels" | "Buns">("Reels");
  const [jariQty, setJariQty] = useState("");
  const [jariType, setJariType] = useState("Polyester");
  const [jariGrade, setJariGrade] = useState("2G");
  const [warpQty, setWarpQty] = useState("");
  const [sigMethod, setSigMethod] = useState<"none" | "here" | "remote">("none");
  const [signed, setSigned] = useState(false);
  const [remoteSent, setRemoteSent] = useState(false);
  const [remoteConfirmed, setRemoteConfirmed] = useState(false);
  const [done, setDone] = useState(false);

  const batchId = source === "own" && loomNum ? `BKB-L${loomNum}-001` :
    source === "outsourced" && selectedWeaver ? `${selectedWeaver.name.split(" ")[0].toUpperCase()}-L${selectedWeaver.looms}-001` : "—";

  if (done) {
    return (
      <>
        <PageHeader title="Issue Material" onBack={onBack} />
        <div style={{ padding: "40px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={30} color={C.green} />
          </div>
          <div style={{ fontFamily: F.d, fontSize: 20, fontWeight: 700, color: C.text, textAlign: "center" }}>Batch Opened</div>
          <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center" }}>Weaver notified on WhatsApp</div>
          <div style={{ fontFamily: F.m, fontSize: 20, fontWeight: 600, color: C.burg }}>{batchId}</div>
          <button onClick={onBack} style={{ ...btnGhost, width: "auto", padding: "0 28px" }}>Back to Weavers</button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Issue Material" onBack={onBack} />
      <div style={{ paddingBottom: 28 }}>
        {/* Step 1 — Source */}
        <SectionLabel step={1} title="Who is producing?" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 16px" }}>
          {[
            { key: "own" as IssueSource, Icon: Building2, title: "Own Factory", sub: "Our looms", color: C.burg },
            { key: "outsourced" as IssueSource, Icon: Users, title: "Outsourced", sub: "External weaver", color: C.green },
          ].map(opt => (
            <button key={String(opt.key)} onClick={() => setSource(opt.key)}
              style={{ padding: "14px 12px", background: source === opt.key ? "rgba(107,26,42,0.05)" : "#FFF", border: `${source === opt.key ? 2 : 1}px solid ${source === opt.key ? C.burg : C.bdr}`, borderRadius: 12, cursor: "pointer", textAlign: "center", position: "relative" }}>
              {source === opt.key && <div style={{ position: "absolute", top: 7, right: 7, width: 16, height: 16, background: C.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={10} color="#FFF" /></div>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: source === opt.key ? "rgba(107,26,42,0.10)" : "rgba(107,26,42,0.05)", margin: "0 auto 8px" }}>
                <opt.Icon size={22} color={source === opt.key ? C.burg : C.muted} />
              </div>
              <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{opt.title}</div>
              <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted }}>{opt.sub}</div>
            </button>
          ))}
        </div>

        {/* Source sub-fields */}
        {source === "own" && (
          <div style={{ margin: "10px 16px 0" }}>
            <FieldLabel>Loom Number</FieldLabel>
            <input type="number" value={loomNum} onChange={e => setLoomNum(e.target.value)} placeholder="e.g. 3"
              style={{ ...inputStyle, fontFamily: F.m, fontSize: 15, height: 46 }} />
            {loomNum && (
              <div style={{ marginTop: 8, display: "inline-flex", background: "rgba(107,26,42,0.10)", padding: "5px 10px", borderRadius: 7 }}>
                <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 600, color: C.burg }}>BKB-L{loomNum}-001</span>
              </div>
            )}
          </div>
        )}

        {source === "outsourced" && (
          <div style={{ margin: "10px 16px 0" }}>
            <FieldLabel>Select Weaver</FieldLabel>
            <div style={{ position: "relative" }}>
              <input value={weaverSearch} onChange={e => { setWeaverSearch(e.target.value); setShowWeaverList(true); }}
                onFocus={() => setShowWeaverList(true)} placeholder="Search weaver..."
                style={{ ...inputStyle, paddingLeft: 36, height: 46 }} />
              <Search size={14} color={C.muted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              {showWeaverList && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(107,26,42,0.12)", zIndex: 50, marginTop: 4 }}>
                  {WEAVERS.filter(w => w.name.toLowerCase().includes(weaverSearch.toLowerCase())).map(w => (
                    <button key={w.code} onClick={() => { setSelectedWeaver(w); setWeaverSearch(w.name); setShowWeaverList(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", borderBottom: `1px solid ${C.bdr}`, cursor: "pointer" }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: F.d, fontSize: 11, fontWeight: 700, color: "#FFF" }}>{w.avatar}</span>
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text }}>{w.name}</div>
                        <div style={{ fontFamily: F.m, fontSize: 10, color: C.muted }}>{w.code} · {w.looms} Looms</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedWeaver && (
              <div style={{ ...card, padding: 12, marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: F.d, fontSize: 13, fontWeight: 700, color: "#FFF" }}>{selectedWeaver.avatar}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text }}>{selectedWeaver.name}</div>
                  <div style={{ fontFamily: F.m, fontSize: 10, color: C.muted }}>{selectedWeaver.code} · {selectedWeaver.looms} looms</div>
                </div>
                <div style={{ display: "inline-flex", background: "rgba(107,26,42,0.10)", padding: "4px 9px", borderRadius: 6 }}>
                  <span style={{ fontFamily: F.m, fontSize: 11, fontWeight: 600, color: C.burg }}>{selectedWeaver.name.split(" ")[0].toUpperCase()}-L{selectedWeaver.looms}-001</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Design */}
        <SectionLabel step={2} title="Link Design Code" />
        <div style={{ margin: "0 16px" }}>
          <div style={{ position: "relative" }}>
            <select style={{ ...inputStyle, appearance: "none", cursor: "pointer", height: 46 }}>
              <option value="">Search design codes...</option>
              <option>BKB-045 · Cream Zari Border Saree</option>
              <option>BKB-046 · Royal Blue Kanjeevaram</option>
              <option>BKB-047 · Red Temple Border</option>
            </select>
            <ChevronRight size={14} color={C.muted} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%) rotate(90deg)", pointerEvents: "none" }} />
          </div>
        </div>

        {/* Step 3 — Materials */}
        <SectionLabel step={3} title="Materials Being Given" />

        {/* Warp + Resham side by side (matches Receive Stock layout) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 16px 10px" }}>
          {/* Warp */}
          <div style={{ ...card, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
              <Layers size={13} color={C.burg} />
              <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text }}>Warp</span>
            </div>
            <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, width: "100%", height: 34, background: "#FFF", border: `1px solid ${C.gold}`, borderRadius: 8, fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.gold, cursor: "pointer", marginBottom: 8 }}>
              <QrCode size={12} /> Scan Barcode
            </button>
            <div style={{ position: "relative" }}>
              <input type="number" value={warpQty} onChange={e => setWarpQty(e.target.value)} placeholder="0"
                style={{ ...inputStyle, fontFamily: F.m, fontSize: 14, paddingRight: 32, height: 40 }} />
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontFamily: F.u, fontSize: 11, color: C.muted }}>kg</span>
            </div>
          </div>

          {/* Resham with IssueColors */}
          <div style={{ ...card, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
              <Scissors size={13} color={C.burg} />
              <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text }}>Resham</span>
            </div>
            <IssueColors label="Resham" compact />
          </div>
        </div>

        {/* Jari — full width with expanded controls */}
        <div style={{ ...card, margin: "0 16px 10px", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
            <Sparkles size={14} color={C.gold} />
            <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text }}>Jari</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text, marginBottom: 5 }}>Type</div>
              <div style={{ display: "flex", gap: 6 }}>
                {["Poly", "Silk"].map((t, i) => (
                  <button key={t} onClick={() => setJariType(i === 0 ? "Polyester" : "Silk Fast")}
                    style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: `1px solid ${jariType === (i === 0 ? "Polyester" : "Silk Fast") ? C.burg : C.bdr}`, background: jariType === (i === 0 ? "Polyester" : "Silk Fast") ? C.burg : "#FFF", color: jariType === (i === 0 ? "Polyester" : "Silk Fast") ? "#FFF" : C.text, fontFamily: F.u, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text, marginBottom: 5 }}>Unit</div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["Reels", "Buns"] as const).map(u => (
                  <button key={u} onClick={() => setJariUnit(u)}
                    style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: `1px solid ${jariUnit === u ? C.burg : C.bdr}`, background: jariUnit === u ? C.burg : "#FFF", color: jariUnit === u ? "#FFF" : C.text, fontFamily: F.u, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text, marginBottom: 5 }}>Grade</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["1G", "2G", "3G", "4G"].map(g => (
                  <button key={g} onClick={() => setJariGrade(g)}
                    style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${jariGrade === g ? C.burg : C.bdr}`, background: jariGrade === g ? C.burg : "#FFF", color: jariGrade === g ? "#FFF" : C.text, fontFamily: F.u, fontSize: 10, cursor: "pointer" }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text, marginBottom: 5 }}>Qty ({jariUnit})</div>
              <div style={{ position: "relative" }}>
                <input type="number" value={jariQty} onChange={e => setJariQty(e.target.value)} placeholder="0"
                  style={{ ...inputStyle, fontFamily: F.m, fontSize: 14, height: 44 }} />
              </div>
              {jariQty && <div style={{ marginTop: 4, fontFamily: F.m, fontSize: 10, color: C.gold }}>= {jariUnit === "Reels" ? `${Math.round(parseFloat(jariQty) / 4)} Buns` : `${Math.round(parseFloat(jariQty) * 4)} Reels`}</div>}
            </div>
          </div>

          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text, marginBottom: 7 }}>Color</div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {[{ name: "Gold", hex: "#C4923A" }, { name: "Silver", hex: "#9E9E9E" }, { name: "Copper", hex: "#B87333" }, { name: "Pink", hex: "#E91E8C" }, { name: "Blue", hex: "#1565C0" }, { name: "Green", hex: "#1E6640" }].map(cl => (
              <button key={cl.name} title={cl.name}
                style={{ width: 26, height: 26, borderRadius: "50%", background: cl.hex, border: "3px solid transparent", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }} />
            ))}
          </div>
        </div>

        {/* Step 4 — Signature */}
        <SectionLabel step={4} title="Collect Weaver Signature" />
        <div style={{ margin: "0 16px 10px", background: "rgba(107,26,42,0.04)", borderRadius: 8, padding: "8px 12px" }}>
          <p style={{ fontFamily: F.u, fontSize: 12, color: C.muted, lineHeight: 1.5, margin: 0 }}>
            Weaver must sign to confirm receipt. Choose method:
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 16px" }}>
          <button onClick={() => { setSigMethod(sigMethod === "here" ? "none" : "here"); setSigned(false); setRemoteSent(false); setRemoteConfirmed(false); }}
            style={{ padding: "14px 12px", background: sigMethod === "here" ? "rgba(107,26,42,0.05)" : "#FFF", border: `${sigMethod === "here" ? 2 : 1}px solid ${sigMethod === "here" ? C.burg : C.bdr}`, borderRadius: 12, cursor: "pointer", textAlign: "center", position: "relative" }}>
            {sigMethod === "here" && <div style={{ position: "absolute", top: 6, right: 6, width: 14, height: 14, background: C.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={9} color="#FFF" /></div>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: sigMethod === "here" ? "rgba(107,26,42,0.10)" : "rgba(107,26,42,0.05)", margin: "0 auto 8px" }}>
              <PenLine size={20} color={sigMethod === "here" ? C.burg : C.muted} />
            </div>
            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>Sign Here</div>
            <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>On this phone</div>
          </button>

          <button onClick={() => { setSigMethod(sigMethod === "remote" ? "none" : "remote"); setSigned(false); setRemoteSent(false); setRemoteConfirmed(false); }}
            style={{ padding: "14px 12px", background: sigMethod === "remote" ? "rgba(107,26,42,0.05)" : "#FFF", border: `${sigMethod === "remote" ? 2 : 1}px solid ${sigMethod === "remote" ? C.burg : C.bdr}`, borderRadius: 12, cursor: "pointer", textAlign: "center", position: "relative" }}>
            {sigMethod === "remote" && <div style={{ position: "absolute", top: 6, right: 6, width: 14, height: 14, background: C.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={9} color="#FFF" /></div>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: sigMethod === "remote" ? "rgba(107,26,42,0.10)" : "rgba(107,26,42,0.05)", margin: "0 auto 8px" }}>
              <Send size={20} color={sigMethod === "remote" ? C.burg : C.muted} />
            </div>
            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>Send Request</div>
            <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>Weaver's phone</div>
          </button>
        </div>

        {/* Sign on this phone */}
        {sigMethod === "here" && (
          <div style={{ margin: "10px 16px 0" }}>
            <div style={{ background: "#FFF", border: `1px solid ${signed ? "rgba(30,102,64,0.30)" : "rgba(139,26,46,0.25)"}`, borderRadius: 12, height: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", cursor: "crosshair" }}
              onClick={() => setSigned(true)}>
              {!signed ? (
                <>
                  <PenLine size={26} color={C.muted} style={{ marginBottom: 8 }} />
                  <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Weaver signs here</span>
                  <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 4 }}>Tap to sign</span>
                </>
              ) : (
                <div style={{ padding: 14, textAlign: "center" }}>
                  <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: 26, color: C.dark }}>
                    {selectedWeaver ? selectedWeaver.name : "Weaver"}
                  </div>
                  <div style={{ fontFamily: F.u, fontSize: 11, color: C.green, marginTop: 5, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                    <CheckCircle2 size={11} /> Signature captured
                  </div>
                </div>
              )}
              {signed && (
                <button onClick={e => { e.stopPropagation(); setSigned(false); }} style={{ position: "absolute", bottom: 7, right: 10, background: "none", border: "none", fontFamily: F.u, fontSize: 11, color: C.gold, cursor: "pointer" }}>
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Send to weaver's phone */}
        {sigMethod === "remote" && (
          <div style={{ margin: "10px 16px 0", background: "#FFF", border: `1px solid rgba(139,26,46,0.15)`, borderRadius: 12, padding: 14 }}>
            {remoteConfirmed ? (
              <div style={{ background: "rgba(30,102,64,0.10)", border: `1px solid ${C.green}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                <CheckCircle2 size={22} color={C.green} style={{ margin: "0 auto 8px" }} />
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.green, marginBottom: 4 }}>Signature Received!</div>
                <div style={{ fontFamily: F.m, fontSize: 10, color: C.muted }}>Signed: 11:45 AM · 11 Jun 2026</div>
              </div>
            ) : remoteSent ? (
              <div style={{ background: "rgba(196,146,58,0.10)", border: `1px solid ${C.gold}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                <Clock size={22} color={C.gold} style={{ margin: "0 auto 6px" }} />
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 4 }}>Waiting for Signature…</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <button style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 11, color: C.gold, cursor: "pointer" }}>Resend</button>
                  <button onClick={() => setRemoteConfirmed(true)} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 11, color: C.muted, cursor: "pointer", textDecoration: "underline" }}>Demo: Signed →</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>Sending to: {selectedWeaver ? selectedWeaver.name : "Weaver"}</div>
                  <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 13, color: C.text }}>+91 98765 43210</div>
                </div>
                <button onClick={() => setRemoteSent(true)} style={{ ...btnPrimary, height: 44, gap: 7, fontSize: 13 }}>
                  <Send size={14} /> Send Signature Request
                </button>
              </>
            )}
          </div>
        )}

        {/* Confirm */}
        <div style={{ padding: "14px 16px 0" }}>
          {(() => {
            const canConfirm = (sigMethod === "here" && signed) || (sigMethod === "remote" && remoteConfirmed);
            return (
              <button
                onClick={() => canConfirm && setDone(true)}
                style={{ ...btnPrimary, height: 52, gap: 8, background: canConfirm ? C.green : "#E0D5CC", color: canConfirm ? "#FFF" : C.muted, cursor: canConfirm ? "pointer" : "not-allowed" }}>
                <CheckCircle2 size={17} /> Confirm — Open Batch
              </button>
            );
          })()}
        </div>
      </div>
    </>
  );
}

// ─── Weaver Signature Block ───────────────────────────────────────────────────
interface SigBlockProps {
  weaverName: string;
  sigMethod: "none" | "here" | "remote";
  setSigMethod: (m: "none" | "here" | "remote") => void;
  signed: boolean;
  setSigned: (v: boolean) => void;
  remoteSent: boolean;
  setRemoteSent: (v: boolean) => void;
  remoteConfirmed: boolean;
  setRemoteConfirmed: (v: boolean) => void;
}

function WeaverSigBlock({ weaverName, sigMethod, setSigMethod, signed, setSigned, remoteSent, setRemoteSent, remoteConfirmed, setRemoteConfirmed }: SigBlockProps) {
  const reset = (method: "none" | "here" | "remote") => {
    setSigMethod(sigMethod === method ? "none" : method);
    setSigned(false);
    setRemoteSent(false);
    setRemoteConfirmed(false);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 16px 6px" }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <PenLine size={10} color="#FFF" />
        </div>
        <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.burg }}>Weaver Signature</span>
        <span style={{ fontFamily: F.u, fontSize: 10, color: "#FFF", background: C.crim, padding: "2px 7px", borderRadius: 999 }}>Required</span>
      </div>

      <div style={{ margin: "0 16px 4px", background: "rgba(107,26,42,0.04)", borderRadius: 8, padding: "8px 12px" }}>
        <p style={{ fontFamily: F.u, fontSize: 12, color: C.muted, lineHeight: 1.5, margin: 0 }}>
          Weaver must sign to confirm saree handover. Choose method:
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 16px" }}>
        <button onClick={() => reset("here")}
          style={{ padding: "14px 12px", background: sigMethod === "here" ? "rgba(107,26,42,0.05)" : "#FFF", border: `${sigMethod === "here" ? 2 : 1}px solid ${sigMethod === "here" ? C.burg : C.bdr}`, borderRadius: 12, cursor: "pointer", textAlign: "center", position: "relative" }}>
          {sigMethod === "here" && <div style={{ position: "absolute", top: 6, right: 6, width: 14, height: 14, background: C.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={9} color="#FFF" /></div>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: sigMethod === "here" ? "rgba(107,26,42,0.10)" : "rgba(107,26,42,0.05)", margin: "0 auto 8px" }}>
            <PenLine size={20} color={sigMethod === "here" ? C.burg : C.muted} />
          </div>
          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>Sign Here</div>
          <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>On this device</div>
        </button>

        <button onClick={() => reset("remote")}
          style={{ padding: "14px 12px", background: sigMethod === "remote" ? "rgba(107,26,42,0.05)" : "#FFF", border: `${sigMethod === "remote" ? 2 : 1}px solid ${sigMethod === "remote" ? C.burg : C.bdr}`, borderRadius: 12, cursor: "pointer", textAlign: "center", position: "relative" }}>
          {sigMethod === "remote" && <div style={{ position: "absolute", top: 6, right: 6, width: 14, height: 14, background: C.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={9} color="#FFF" /></div>}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: sigMethod === "remote" ? "rgba(107,26,42,0.10)" : "rgba(107,26,42,0.05)", margin: "0 auto 8px" }}>
            <Send size={20} color={sigMethod === "remote" ? C.burg : C.muted} />
          </div>
          <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>Send Request</div>
          <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>Weaver's mobile</div>
        </button>
      </div>

      {sigMethod === "here" && (
        <div style={{ margin: "10px 16px 0" }}>
          <div
            style={{ background: "#FFF", border: `1px solid ${signed ? "rgba(30,102,64,0.30)" : "rgba(139,26,46,0.25)"}`, borderRadius: 12, height: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", cursor: "crosshair" }}
            onClick={() => setSigned(true)}>
            {!signed ? (
              <>
                <PenLine size={26} color={C.muted} style={{ marginBottom: 8 }} />
                <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Weaver signs here</span>
                <span style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 4 }}>Tap to sign</span>
              </>
            ) : (
              <div style={{ padding: 14, textAlign: "center" }}>
                <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: 26, color: C.dark }}>{weaverName}</div>
                <div style={{ fontFamily: F.u, fontSize: 11, color: C.green, marginTop: 5, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                  <CheckCircle2 size={11} /> Signature captured
                </div>
              </div>
            )}
            {signed && (
              <button onClick={e => { e.stopPropagation(); setSigned(false); }} style={{ position: "absolute", bottom: 7, right: 10, background: "none", border: "none", fontFamily: F.u, fontSize: 11, color: C.gold, cursor: "pointer" }}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {sigMethod === "remote" && (
        <div style={{ margin: "10px 16px 0", background: "#FFF", border: `1px solid rgba(139,26,46,0.15)`, borderRadius: 12, padding: 14 }}>
          {remoteConfirmed ? (
            <div style={{ background: "rgba(30,102,64,0.10)", border: `1px solid ${C.green}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
              <CheckCircle2 size={22} color={C.green} style={{ margin: "0 auto 8px" }} />
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.green, marginBottom: 4 }}>Signature Received!</div>
              <div style={{ fontFamily: F.m, fontSize: 10, color: C.muted }}>Signed by {weaverName} · Just now</div>
            </div>
          ) : remoteSent ? (
            <div style={{ background: "rgba(196,146,58,0.10)", border: `1px solid ${C.gold}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
              <Clock size={22} color={C.gold} style={{ margin: "0 auto 6px" }} />
              <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 2 }}>Waiting for Signature…</div>
              <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginBottom: 10 }}>Request sent to {weaverName}'s mobile</div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 11, color: C.gold, cursor: "pointer" }}>Resend</button>
                <button onClick={() => setRemoteConfirmed(true)} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 11, color: C.muted, cursor: "pointer", textDecoration: "underline" }}>Demo: Signed →</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>Sending to: {weaverName}</div>
                <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 13, color: C.text }}>+91 98765 43210</div>
              </div>
              <button onClick={() => setRemoteSent(true)} style={{ ...btnPrimary, height: 44, gap: 7, fontSize: 13 }}>
                <Send size={14} /> Send Signature Request
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

// ─── Receive Sarees Page ─────────────────────────────────────────────────────
interface RejectedSaree {
  id: string;
  weaver: string;
  weight: string;
  date: string;
  photoUrl: string;
}

function DefectPhotoPrompt({ onCapture, onCancel }: { onCapture: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(27,12,8,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#FFF", borderRadius: 16, padding: 20, width: "min(92vw, 340px)", boxShadow: "0 24px 60px rgba(27,12,8,0.30)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <AlertTriangle size={18} color={C.crim} />
          <span style={{ fontFamily: F.d, fontSize: 15, fontWeight: 700, color: C.text }}>Photo Required</span>
        </div>
        <div style={{ fontFamily: F.u, fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
          Take a photo of the defect as proof. This is required to complete the rejection.
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button onClick={onCapture} style={{ flex: 1, height: 44, background: C.burg, border: "none", borderRadius: 999, fontFamily: F.u, fontSize: 12.5, fontWeight: 600, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <Camera size={13} /> Take Photo
          </button>
          <button onClick={onCapture} style={{ flex: 1, height: 44, background: "#FFF", border: `1px solid ${C.burg}`, borderRadius: 999, fontFamily: F.u, fontSize: 12.5, fontWeight: 600, color: C.burg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <UploadCloud size={13} /> Upload from Gallery
          </button>
        </div>
        <button onClick={onCancel} style={{ width: "100%", background: "none", border: "none", fontFamily: F.u, fontSize: 12, color: C.muted, cursor: "pointer", padding: 8 }}>Cancel</button>
      </div>
    </div>
  );
}

function ReceiveSareesPage({ onBack }: { onBack: () => void }) {
  const [activeSection, setActiveSection] = useState<"outsourced" | "own">("outsourced");
  const [selectedWeaver, setSelectedWeaver] = useState<typeof WEAVERS[0] | null>(WEAVERS[0]);
  const [sareeWeight, setSareeWeight] = useState("");
  const [hasPhoto, setHasPhoto] = useState(false);
  const [sareeCount, setSareeCount] = useState(4);
  const [showTagPrint, setShowTagPrint] = useState(false);
  const [loomNum, setLoomNum] = useState("");
  const [ownWeight, setOwnWeight] = useState("");
  const [ownPhoto, setOwnPhoto] = useState(false);
  // defective-at-receipt tracking
  const [rejectedSarees, setRejectedSarees] = useState<RejectedSaree[]>([]);
  const [showDefectPrompt, setShowDefectPrompt] = useState(false);
  // outsourced signature
  const [sigMethod, setSigMethod] = useState<"none" | "here" | "remote">("none");
  const [signed, setSigned] = useState(false);
  const [remoteSent, setRemoteSent] = useState(false);
  const [remoteConfirmed, setRemoteConfirmed] = useState(false);
  // own factory signature
  const [ownSigMethod, setOwnSigMethod] = useState<"none" | "here" | "remote">("none");
  const [ownSigned, setOwnSigned] = useState(false);
  const [ownRemoteSent, setOwnRemoteSent] = useState(false);
  const [ownRemoteConfirmed, setOwnRemoteConfirmed] = useState(false);

  const weightNum = sareeWeight ? parseFloat(sareeWeight) : null;
  const weightOk = weightNum !== null && weightNum >= 600;
  const sareeId = selectedWeaver ? `${selectedWeaver.name.split(" ")[0].toUpperCase()}-L${selectedWeaver.looms}-00${sareeCount}` : "—";
  const ownSareeId = loomNum ? `BKB-L${loomNum}-00${sareeCount}` : "—";

  if (showTagPrint) {
    return (
      <>
        <PageHeader title="Tag Preview" onBack={() => setShowTagPrint(false)} />
        <div style={{ paddingBottom: 28 }}>
          <div style={{ margin: "14px 16px", border: `1px solid rgba(139,26,46,0.20)`, borderRadius: 12, padding: 16, background: "#FFF" }}>
            <div style={{ fontFamily: F.u, fontSize: 9, color: C.muted, textAlign: "center", marginBottom: 8 }}>Beere Kesava & Brothers Silks · Est. 1999</div>
            <div style={{ background: "#000", height: 36, borderRadius: 4, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: F.m, fontSize: 7, color: "#FFF", letterSpacing: 3 }}>||| | || ||| || |</span>
            </div>
            <div style={{ fontFamily: F.m, fontSize: 14, fontWeight: 700, textAlign: "center", color: C.text, marginBottom: 10 }}>{sareeId}</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div><span style={{ fontFamily: F.u, fontSize: 10, color: C.gold }}>Weaver: </span><span style={{ fontFamily: F.u, fontSize: 10, color: C.text }}>{selectedWeaver?.name}</span></div>
              <div><span style={{ fontFamily: F.u, fontSize: 10, color: C.gold }}>Date: </span><span style={{ fontFamily: F.u, fontSize: 10, color: C.text }}>13 Jun 2026</span></div>
            </div>
          </div>
          <div style={{ padding: "0 16px" }}>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 8 }}>Printer: TSC TE244 &nbsp;🔒</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontFamily: F.u, fontSize: 13, color: C.text }}>Copies:</span>
              <input type="number" defaultValue={1} style={{ ...inputStyle, width: 65, height: 38, textAlign: "center", fontFamily: F.m }} />
            </div>
            <button style={{ ...btnPrimary, height: 50, gap: 7, marginBottom: 10 }}><Printer size={16} /> Print Now</button>
            <button onClick={() => setShowTagPrint(false)} style={{ display: "block", width: "100%", background: "none", border: "none", fontFamily: F.u, fontSize: 13, color: C.muted, cursor: "pointer", padding: 10 }}>Skip Printing</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Receive Sarees" onBack={onBack} />
      <div style={{ paddingBottom: 28 }}>
        {/* Tab switcher */}
        <div style={{ display: "flex", margin: "12px 16px 4px", background: "#F5F0F2", borderRadius: 10, padding: 3 }}>
          {[["outsourced", "Outsourced"], ["own", "Own Factory"]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveSection(key as "outsourced" | "own")}
              style={{ flex: 1, padding: "9px 8px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: F.u, fontSize: 12, fontWeight: 600, background: activeSection === key ? C.burg : "transparent", color: activeSection === key ? "#FFF" : C.muted }}>
              {label}
            </button>
          ))}
        </div>

        {activeSection === "outsourced" && (
          <>
            {/* Weaver selector */}
            <div style={{ margin: "10px 16px 0" }}>
              <FieldLabel>Select Weaver</FieldLabel>
              <div style={{ position: "relative" }}>
                <select style={{ ...inputStyle, appearance: "none", cursor: "pointer", height: 46 }} onChange={e => setSelectedWeaver(WEAVERS.find(w => w.name === e.target.value) || null)}>
                  {WEAVERS.map(w => <option key={w.code}>{w.name}</option>)}
                </select>
                <ChevronRight size={14} color={C.muted} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%) rotate(90deg)", pointerEvents: "none" }} />
              </div>
            </div>

            {/* Batch progress */}
            {selectedWeaver && (
              <div style={{ ...card, margin: "8px 16px 0", padding: "10px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg }}>BATCH-086</div>
                    <div style={{ fontFamily: F.u, fontSize: 11, color: C.muted, marginTop: 1 }}>3 of 5 sarees done</div>
                  </div>
                  <span style={{ fontFamily: F.u, fontSize: 10, color: C.green, background: "rgba(30,102,64,0.10)", padding: "2px 7px", borderRadius: 999 }}>Active</span>
                </div>
                <div style={{ background: "#F0F0F0", borderRadius: 999, height: 5, overflow: "hidden" }}>
                  <div style={{ width: "60%", height: "100%", background: C.gold, borderRadius: 999 }} />
                </div>
              </div>
            )}

            {/* Saree entry */}
            <div style={{ ...card, margin: "10px 16px 10px", padding: 14 }}>
              <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>
                Saree #{sareeCount} — BATCH-086
              </div>

              {/* Weight + Photo in a 2-col layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <FieldLabel>Weight (grams)</FieldLabel>
                  <div style={{ position: "relative" }}>
                    <input type="number" value={sareeWeight} onChange={e => setSareeWeight(e.target.value)} placeholder="0"
                      style={{ ...inputStyle, height: 52, fontFamily: F.m, fontSize: 18, paddingRight: 10 }} />
                  </div>
                  {weightNum !== null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                      {weightOk ? <CheckCircle2 size={11} color={C.green} /> : <AlertTriangle size={11} color={C.crim} />}
                      <span style={{ fontFamily: F.u, fontSize: 10, color: weightOk ? C.green : C.crim }}>
                        {weightOk ? "OK" : "Too low"}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <FieldLabel>Photo</FieldLabel>
                  {!hasPhoto ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <button onClick={() => setHasPhoto(true)} style={{ height: 38, background: C.burg, border: "none", borderRadius: 8, fontFamily: F.u, fontSize: 11, fontWeight: 600, color: "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <Camera size={12} /> Camera
                      </button>
                      <button onClick={() => setHasPhoto(true)} style={{ height: 38, background: "#FFF", border: `1px solid ${C.burg}`, borderRadius: 8, fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.burg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <UploadCloud size={12} /> Gallery
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 82, background: "linear-gradient(135deg,#F0E8D0,#C4923A)", borderRadius: 8, border: `1px solid ${C.bdr}`, position: "relative" }}>
                      <Camera size={20} color="rgba(255,255,255,0.85)" />
                      <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, background: C.green, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <CheckCircle2 size={10} color="#FFF" />
                      </div>
                      <button onClick={() => setHasPhoto(false)} style={{ position: "absolute", bottom: 3, right: 5, background: "none", border: "none", fontFamily: F.u, fontSize: 9, color: "rgba(0,0,0,0.5)", cursor: "pointer" }}>Retake</button>
                    </div>
                  )}
                </div>
              </div>

              {sareeWeight && hasPhoto && (
                <div style={{ textAlign: "center", marginBottom: 10 }}>
                  <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted, marginBottom: 2 }}>Saree ID</div>
                  <div style={{ fontFamily: F.m, fontSize: 16, fontWeight: 600, color: C.burg }}>{sareeId}</div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <button onClick={() => setShowTagPrint(true)} style={{ flex: 1, height: 42, background: "#FFF", border: `1px solid ${C.gold}`, borderRadius: 999, fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.gold, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Printer size={12} /> Print Tag
                </button>
                <button onClick={() => { setSareeCount(p => p + 1); setSareeWeight(""); setHasPhoto(false); }}
                  style={{ flex: 1, height: 42, background: "#FFF", border: `1px solid ${C.burg}`, borderRadius: 999, fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.burg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Plus size={12} /> Next Saree
                </button>
              </div>
              <button onClick={() => setShowDefectPrompt(true)}
                style={{ width: "100%", height: 38, background: "rgba(220,53,69,0.06)", border: `1px solid rgba(220,53,69,0.25)`, borderRadius: 999, fontFamily: F.u, fontSize: 11.5, fontWeight: 600, color: C.crim, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <AlertTriangle size={12} /> Mark as Defective
              </button>
            </div>

            {showDefectPrompt && (
              <DefectPhotoPrompt
                onCancel={() => setShowDefectPrompt(false)}
                onCapture={() => {
                  setRejectedSarees(prev => [
                    {
                      id: sareeId,
                      weaver: selectedWeaver?.name ?? "Weaver",
                      weight: sareeWeight ? `${sareeWeight}g` : "—",
                      date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
                      photoUrl: "captured-defect-photo",
                    },
                    ...prev,
                  ]);
                  setShowDefectPrompt(false);
                  setSareeCount(p => p + 1);
                  setSareeWeight("");
                  setHasPhoto(false);
                }}
              />
            )}

            {rejectedSarees.length > 0 && (
              <div style={{ margin: "0 16px 10px" }}>
                <div style={{ fontFamily: F.u, fontSize: 11, fontWeight: 700, color: C.crim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                  Rejected at Receipt ({rejectedSarees.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {rejectedSarees.map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(220,53,69,0.04)", border: "1px solid rgba(220,53,69,0.18)", borderRadius: 10, padding: "8px 10px" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#F0E8D0,#C0392B)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Camera size={14} color="rgba(255,255,255,0.85)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: F.m, fontSize: 11, fontWeight: 600, color: C.text }}>{r.id}</div>
                        <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted }}>{r.weaver} · {r.weight} · {r.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <WeaverSigBlock
              weaverName={selectedWeaver?.name ?? "Weaver"}
              sigMethod={sigMethod} setSigMethod={setSigMethod}
              signed={signed} setSigned={setSigned}
              remoteSent={remoteSent} setRemoteSent={setRemoteSent}
              remoteConfirmed={remoteConfirmed} setRemoteConfirmed={setRemoteConfirmed}
            />

            {(() => {
              const sigOk = (sigMethod === "here" && signed) || (sigMethod === "remote" && remoteConfirmed);
              return (
                <div style={{ padding: "14px 16px 0" }}>
                  {!sigOk && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "8px 12px", background: "rgba(220,53,69,0.08)", border: "1px solid rgba(220,53,69,0.20)", borderRadius: 8 }}>
                      <AlertTriangle size={13} color={C.crim} />
                      <span style={{ fontFamily: F.u, fontSize: 12, color: C.crim }}>Weaver signature required to complete batch</span>
                    </div>
                  )}
                  <button
                    onClick={() => sigOk ? undefined : undefined}
                    style={{ ...btnPrimary, height: 50, gap: 7, background: sigOk ? C.green : "#E0D5CC", color: sigOk ? "#FFF" : C.muted, cursor: sigOk ? "pointer" : "not-allowed" }}>
                    <CheckCircle2 size={16} /> Mark Batch Complete
                  </button>
                </div>
              );
            })()}
          </>
        )}

        {activeSection === "own" && (
          <>
            <div style={{ margin: "10px 16px 0" }}>
              <FieldLabel>Which loom?</FieldLabel>
              <input type="number" value={loomNum} onChange={e => setLoomNum(e.target.value)} placeholder="Loom Number"
                style={{ ...inputStyle, fontFamily: F.m, fontSize: 15, height: 46 }} />
            </div>

            <div style={{ ...card, margin: "10px 16px 10px", padding: 14 }}>
              <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>
                Saree #{sareeCount} {loomNum ? `· Loom ${loomNum}` : ""}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <FieldLabel>Weight (grams)</FieldLabel>
                  <div style={{ position: "relative" }}>
                    <input type="number" value={ownWeight} onChange={e => setOwnWeight(e.target.value)} placeholder="0"
                      style={{ ...inputStyle, height: 52, fontFamily: F.m, fontSize: 18 }} />
                  </div>
                  {ownWeight && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                      {parseFloat(ownWeight) >= 600 ? <CheckCircle2 size={11} color={C.green} /> : <AlertTriangle size={11} color={C.crim} />}
                      <span style={{ fontFamily: F.u, fontSize: 10, color: parseFloat(ownWeight) >= 600 ? C.green : C.crim }}>
                        {parseFloat(ownWeight) >= 600 ? "OK" : "Too low"}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <FieldLabel>Photo</FieldLabel>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <button onClick={() => setOwnPhoto(true)} style={{ height: 38, background: ownPhoto ? "#F5F5F5" : C.burg, border: ownPhoto ? `1px solid ${C.bdr}` : "none", borderRadius: 8, fontFamily: F.u, fontSize: 11, fontWeight: 600, color: ownPhoto ? C.green : "#FFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <Camera size={12} color={ownPhoto ? C.green : "#FFF"} /> {ownPhoto ? "Taken ✓" : "Camera"}
                    </button>
                    <button onClick={() => setOwnPhoto(true)} style={{ height: 38, background: "#FFF", border: `1px solid ${C.burg}`, borderRadius: 8, fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.burg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <UploadCloud size={12} /> Gallery
                    </button>
                  </div>
                </div>
              </div>

              {ownWeight && ownPhoto && loomNum && (
                <div style={{ textAlign: "center", marginBottom: 10 }}>
                  <div style={{ fontFamily: F.u, fontSize: 10, color: C.muted, marginBottom: 2 }}>Saree ID</div>
                  <div style={{ fontFamily: F.m, fontSize: 16, fontWeight: 600, color: C.burg }}>{ownSareeId}</div>
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ flex: 1, height: 42, background: "#FFF", border: `1px solid ${C.gold}`, borderRadius: 999, fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.gold, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Printer size={12} /> Print Tag
                </button>
                <button style={{ flex: 1, height: 42, background: "#FFF", border: `1px solid ${C.burg}`, borderRadius: 999, fontFamily: F.u, fontSize: 11, fontWeight: 600, color: C.burg, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <Plus size={12} /> Next Saree
                </button>
              </div>
            </div>

            <WeaverSigBlock
              weaverName="Loom Operator"
              sigMethod={ownSigMethod} setSigMethod={setOwnSigMethod}
              signed={ownSigned} setSigned={setOwnSigned}
              remoteSent={ownRemoteSent} setRemoteSent={setOwnRemoteSent}
              remoteConfirmed={ownRemoteConfirmed} setRemoteConfirmed={setOwnRemoteConfirmed}
            />

            {(() => {
              const sigOk = (ownSigMethod === "here" && ownSigned) || (ownSigMethod === "remote" && ownRemoteConfirmed);
              return (
                <div style={{ padding: "14px 16px 0" }}>
                  {!sigOk && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "8px 12px", background: "rgba(220,53,69,0.08)", border: "1px solid rgba(220,53,69,0.20)", borderRadius: 8 }}>
                      <AlertTriangle size={13} color={C.crim} />
                      <span style={{ fontFamily: F.u, fontSize: 12, color: C.crim }}>Operator signature required to complete batch</span>
                    </div>
                  )}
                  <button
                    style={{ ...btnPrimary, height: 50, gap: 7, background: sigOk ? C.green : "#E0D5CC", color: sigOk ? "#FFF" : C.muted, cursor: sigOk ? "pointer" : "not-allowed" }}>
                    <CheckCircle2 size={16} /> Mark Batch Complete
                  </button>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </>
  );
}

// ─── Main Weavers Hub ─────────────────────────────────────────────────────────
interface WorkerWeaversProps {
  subPage?: WeaversPage;
  onSubPageChange?: (page: WeaversPage) => void;
}

export function WorkerWeavers({ subPage, onSubPageChange }: WorkerWeaversProps) {
  const [localPage, setLocalPage] = useState<WeaversPage>("menu");
  const page = subPage ?? localPage;
  const setPage = onSubPageChange ?? setLocalPage;

  if (page === "design") return <DesignPlanningPage onBack={() => setPage("menu")} />;
  if (page === "receive") return <ReceiveSareesPage onBack={() => setPage("menu")} />;

  const menuItems = [
    { key: "design" as WeaversPage, Icon: Palette, title: "Design Planning", sub: "Upload color slips, link to design codes", badge: null },
    { key: "receive" as WeaversPage, Icon: CheckCircle2, title: "Receive Sarees", sub: "Record completed sarees from weavers", badge: "8 waiting" },
  ];

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Context */}
      <div style={{ margin: "12px 16px 4px", background: "rgba(107,26,42,0.04)", border: `1px solid rgba(107,26,42,0.10)`, borderRadius: 10, padding: "10px 14px" }}>
        <p style={{ fontFamily: F.u, fontSize: 13, color: C.muted, lineHeight: 1.5, margin: 0 }}>
          Manage weaver operations — design uploads, material issue, and saree receiving.
        </p>
      </div>

      {menuItems.map((item) => (
        <button key={item.key} onClick={() => setPage(item.key)}
          style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 16px", padding: "16px 14px", background: "#FFF", border: `1px solid rgba(107,26,42,0.10)`, borderRadius: 14, boxShadow: "0 2px 10px rgba(107,26,42,0.05)", cursor: "pointer", width: "calc(100% - 32px)", textAlign: "left" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <item.Icon size={22} color="#FFF" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ fontFamily: F.u, fontSize: 15, fontWeight: 600, color: C.text }}>{item.title}</span>
              {item.badge && <span style={{ fontFamily: F.u, fontSize: 10, color: "#FFF", background: C.burg, padding: "2px 7px", borderRadius: 999 }}>{item.badge}</span>}
            </div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{item.sub}</div>
          </div>
          <ChevronRight size={18} color={C.muted} />
        </button>
      ))}
    </div>
  );
}
