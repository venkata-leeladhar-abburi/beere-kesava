import React, { useState } from "react";
import {
  ChevronRight, CheckCircle2, Search, Layers, Scissors,
  Building2, Users, PenLine, Send, Sparkles, Clock,
} from "lucide-react";
import { C, F, card, inputStyle, btnPrimary, btnGhost } from "../tokens";
import { FieldLabel, SectionLabel, PageHeader, type IssueSource } from "./shared";
import { WEAVERS } from "./weaversData";

// ─── Issue Material Page ─────────────────────────────────────────────────────
// Note: this component is not currently wired into WorkerWeavers' composition
// root (no caller passes `page === "issue"`); it is kept as-is from the
// pre-split file. Renamed to WorkerIssueMaterialPage to avoid confusion with
// the unrelated IssueMaterialPage in src/features/materials/components.
export function WorkerIssueMaterialPage({ onBack }: { onBack: () => void }) {
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
  const [warpUnit, setWarpUnit] = useState<"kg" | "g">("kg");
  const [reshamQty, setReshamQty] = useState("");
  const [reshamUnit, setReshamUnit] = useState<"kg" | "g">("kg");
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
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{opt.sub}</div>
            </button>
          ))}
        </div>

        {/* Source sub-fields */}
        {source === "own" && (
          <div style={{ margin: "10px 16px 0" }}>
            <FieldLabel>Loom Number</FieldLabel>
            <input type="number" value={loomNum} onChange={e => setLoomNum(e.target.value)} placeholder="e.g. 3"
              style={{ ...inputStyle, fontFamily: F.m, fontSize: 14, height: 46 }} />
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
                        <span style={{ fontFamily: F.d, fontSize: 12, fontWeight: 700, color: "#FFF" }}>{w.avatar}</span>
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text }}>{w.name}</div>
                        <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{w.code} · {w.looms} Looms</div>
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
                  <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{selectedWeaver.code} · {selectedWeaver.looms} looms</div>
                </div>
                <div style={{ display: "inline-flex", background: "rgba(107,26,42,0.10)", padding: "4px 9px", borderRadius: 6 }}>
                  <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg }}>{selectedWeaver.name.split(" ")[0].toUpperCase()}-L{selectedWeaver.looms}-001</span>
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

        {/* Warp + Resham side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "0 16px 10px" }}>
          {/* Warp — kg / g toggle + quantity */}
          <div style={{ ...card, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
              <Layers size={13} color={C.burg} />
              <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text }}>Warp</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
                {(["kg", "g"] as const).map(u => (
                  <button key={u} onClick={() => setWarpUnit(u)}
                    style={{ flex: 1, padding: "5px 2px", borderRadius: 6, border: `1px solid ${warpUnit === u ? C.burg : C.bdr}`, background: warpUnit === u ? C.burg : "#FFF", color: warpUnit === u ? "#FFF" : C.text, fontFamily: F.u, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {u}
                  </button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <input type="number" value={warpQty} onChange={e => setWarpQty(e.target.value)} placeholder="0"
                  style={{ ...inputStyle, fontFamily: F.m, fontSize: 14, paddingRight: 34, height: 40 }} />
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.burg }}>{warpUnit}</span>
              </div>
              {warpQty && (
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.burg, fontWeight: 600 }}>
                  = {warpUnit === "kg" ? `${(parseFloat(warpQty) * 1000).toFixed(0)} g` : `${(parseFloat(warpQty) / 1000).toFixed(3)} kg`}
                </div>
              )}
            </div>
          </div>

          {/* Resham — kg / g toggle + quantity */}
          <div style={{ ...card, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
              <Scissors size={13} color={C.burg} />
              <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text }}>Resham</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
                {(["kg", "g"] as const).map(u => (
                  <button key={u} onClick={() => setReshamUnit(u)}
                    style={{ flex: 1, padding: "5px 2px", borderRadius: 6, border: `1px solid ${reshamUnit === u ? C.burg : C.bdr}`, background: reshamUnit === u ? C.burg : "#FFF", color: reshamUnit === u ? "#FFF" : C.text, fontFamily: F.u, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {u}
                  </button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <input type="number" value={reshamQty} onChange={e => setReshamQty(e.target.value)} placeholder="0"
                  style={{ ...inputStyle, fontFamily: F.m, fontSize: 14, paddingRight: 34, height: 40 }} />
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: F.u, fontSize: 12, fontWeight: 700, color: "#7A5E1C" }}>{reshamUnit}</span>
              </div>
              {reshamQty && (
                <div style={{ fontFamily: F.u, fontSize: 12, color: "#7A5E1C", fontWeight: 600 }}>
                  = {reshamUnit === "kg" ? `${(parseFloat(reshamQty) * 1000).toFixed(0)} g` : `${(parseFloat(reshamQty) / 1000).toFixed(3)} kg`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Jari — full width with unit toggle + Reels/Buns quantity */}
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
                    style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: `1px solid ${jariType === (i === 0 ? "Polyester" : "Silk Fast") ? C.burg : C.bdr}`, background: jariType === (i === 0 ? "Polyester" : "Silk Fast") ? C.burg : "#FFF", color: jariType === (i === 0 ? "Polyester" : "Silk Fast") ? "#FFF" : C.text, fontFamily: F.u, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text, marginBottom: 5 }}>Grade</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["1G", "2G", "3G", "4G"].map(g => (
                  <button key={g} onClick={() => setJariGrade(g)}
                    style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${jariGrade === g ? C.burg : C.bdr}`, background: jariGrade === g ? C.burg : "#FFF", color: jariGrade === g ? "#FFF" : C.text, fontFamily: F.u, fontSize: 12, cursor: "pointer" }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Unit selector + Quantity */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text, marginBottom: 5 }}>Unit</div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["Reels", "Buns"] as const).map(u => (
                  <button key={u} onClick={() => setJariUnit(u)}
                    style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: `1px solid ${jariUnit === u ? C.burg : C.bdr}`, background: jariUnit === u ? C.burg : "#FFF", color: jariUnit === u ? "#FFF" : C.text, fontFamily: F.u, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text, marginBottom: 5 }}>Qty ({jariUnit})</div>
              <div style={{ position: "relative" }}>
                <input type="number" value={jariQty} onChange={e => setJariQty(e.target.value)} placeholder="0"
                  style={{ ...inputStyle, fontFamily: F.m, fontSize: 14, paddingRight: 42, height: 44 }} />
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.gold }}>{jariUnit}</span>
              </div>
              {jariQty && (
                <div style={{ marginTop: 4, fontFamily: F.u, fontSize: 12, color: C.gold }}>
                  = {jariUnit === "Reels" ? `${Math.round(parseFloat(jariQty) / 4)} Buns` : `${Math.round(parseFloat(jariQty) * 4)} Reels`}
                  <span style={{ color: C.muted }}> (1 Bun = 4 Reels)</span>
                </div>
              )}
            </div>
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
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>On this phone</div>
          </button>

          <button onClick={() => { setSigMethod(sigMethod === "remote" ? "none" : "remote"); setSigned(false); setRemoteSent(false); setRemoteConfirmed(false); }}
            style={{ padding: "14px 12px", background: sigMethod === "remote" ? "rgba(107,26,42,0.05)" : "#FFF", border: `${sigMethod === "remote" ? 2 : 1}px solid ${sigMethod === "remote" ? C.burg : C.bdr}`, borderRadius: 12, cursor: "pointer", textAlign: "center", position: "relative" }}>
            {sigMethod === "remote" && <div style={{ position: "absolute", top: 6, right: 6, width: 14, height: 14, background: C.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={9} color="#FFF" /></div>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: sigMethod === "remote" ? "rgba(107,26,42,0.10)" : "rgba(107,26,42,0.05)", margin: "0 auto 8px" }}>
              <Send size={20} color={sigMethod === "remote" ? C.burg : C.muted} />
            </div>
            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>Send Request</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Weaver's phone</div>
          </button>
        </div>

        {/* Sign on this phone */}
        {sigMethod === "here" && (
          <div style={{ margin: "10px 16px 0" }}>
            <div style={{ background: "#FFF", border: `1px solid ${signed ? "rgba(30,102,64,0.30)" : "rgba(139,26,46,0.25)"}`, borderRadius: 12, height: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", cursor: "crosshair" }}
              onClick={() => setSigned(true)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setSigned(true))?.(); } }}>
              {!signed ? (
                <>
                  <PenLine size={26} color={C.muted} style={{ marginBottom: 8 }} />
                  <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>Weaver signs here</span>
                  <span style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginTop: 4 }}>Tap to sign</span>
                </>
              ) : (
                <div style={{ padding: 14, textAlign: "center" }}>
                  <div style={{ fontFamily: "'Dancing Script', cursive", fontSize: 24, color: C.dark }}>
                    {selectedWeaver ? selectedWeaver.name : "Weaver"}
                  </div>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.green, marginTop: 5, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                    <CheckCircle2 size={11} /> Signature captured
                  </div>
                </div>
              )}
              {signed && (
                <button onClick={e => { e.stopPropagation(); setSigned(false); }} style={{ position: "absolute", bottom: 7, right: 10, background: "none", border: "none", fontFamily: F.u, fontSize: 12, color: C.gold, cursor: "pointer" }}>
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
                <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>Signed: 11:45 AM · 11 Jun 2026</div>
              </div>
            ) : remoteSent ? (
              <div style={{ background: "rgba(196,146,58,0.10)", border: `1px solid ${C.gold}`, borderRadius: 10, padding: 14, textAlign: "center" }}>
                <Clock size={22} color={C.gold} style={{ margin: "0 auto 6px" }} />
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text, marginBottom: 4 }}>Waiting for Signature…</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <button style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 12, color: C.gold, cursor: "pointer" }}>Resend</button>
                  <button onClick={() => setRemoteConfirmed(true)} style={{ background: "none", border: "none", fontFamily: F.u, fontSize: 12, color: C.muted, cursor: "pointer", textDecoration: "underline" }}>Demo: Signed →</button>
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
