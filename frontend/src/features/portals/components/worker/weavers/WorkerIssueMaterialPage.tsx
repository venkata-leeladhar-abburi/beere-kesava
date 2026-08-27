/* eslint-disable no-restricted-syntax -- material unit/quantity parsing (kg, g, reels, buns), not currency */
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2, Search, Layers, Scissors,
  Building2, Users, PenLine, Send, Sparkles, Clock,
} from "lucide-react";
import { C, F, card } from "../tokens";
import { FieldLabel, SectionLabel, PageHeader, type IssueSource } from "./shared";
import { weaversApi } from "../../../../../shared/api/weavers";
import { Button, Input, NumberInput, Select, SelectItem } from "../../../../../shared/ui/primitives";

export function WorkerIssueMaterialPage({ onBack }: { onBack: () => void }) {
  const { data: weaversRes, isLoading: weaversLoading } = useQuery({
    queryKey: ["worker-issue-weavers"],
    queryFn: () => weaversApi.list(),
  });
  const WEAVERS = React.useMemo(() => {
    if (!weaversRes?.items) return [];
    return weaversRes.items.map(w => ({
      name: w.name,
      // `id` is the UUID; `code` is the human-facing weaver id ("Ramarao-001").
      id: w.id,
      code: w.code,
      looms: w.looms,
      avatar: w.initials || `${w.firstName.charAt(0)}${w.lastName.charAt(0)}`,
    }));
  }, [weaversRes]);

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
  const [designCode, setDesignCode] = useState("");

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
          <Button variant="secondary" onClick={onBack} className="w-auto rounded-full px-7 border-[rgba(110,15,45,0.30)] text-[#6E0F2D]">Back to Weavers</Button>
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
        <div className="grid-cols-1 md:grid-cols-2" style={{ display: "grid", gap: 10, margin: "0 16px" }}>
          {[
            { key: "own" as IssueSource, Icon: Building2, title: "Own Factory", sub: "Our looms", color: C.burg },
            { key: "outsourced" as IssueSource, Icon: Users, title: "Outsourced", sub: "External weaver", color: C.green },
          ].map(opt => (
            <Button key={String(opt.key)} variant="tertiary" onClick={() => setSource(opt.key)}
              className={`h-auto flex-col items-center whitespace-normal rounded-xl px-3 py-3.5 text-center relative ${source === opt.key ? "border-2 border-[#6E0F2D] bg-[rgba(110,15,45,0.05)]" : "border border-[rgba(110,15,45,0.12)] bg-white"}`}>
              {source === opt.key && <div style={{ position: "absolute", top: 7, right: 7, width: 16, height: 16, background: C.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={10} color="#FFF" /></div>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 12, background: source === opt.key ? "rgba(110,15,45,0.10)" : "rgba(110,15,45,0.05)", margin: "0 auto 8px" }}>
                <opt.Icon size={22} color={source === opt.key ? C.burg : C.muted} />
              </div>
              <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{opt.title}</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{opt.sub}</div>
            </Button>
          ))}
        </div>

        {/* Source sub-fields */}
        {source === "own" && (
          <div style={{ margin: "10px 16px 0" }}>
            <FieldLabel>Loom Number</FieldLabel>
            <Input type="number" value={loomNum} onChange={e => setLoomNum(e.target.value)} placeholder="e.g. 3"
              size="lg" className="font-mono" />
            {loomNum && (
              <div style={{ marginTop: 8, display: "inline-flex", background: "rgba(110,15,45,0.10)", padding: "5px 10px", borderRadius: 7 }}>
                <span style={{ fontFamily: F.m, fontSize: 13, fontWeight: 600, color: C.burg }}>BKB-L{loomNum}-001</span>
              </div>
            )}
          </div>
        )}

        {source === "outsourced" && (
          <div style={{ margin: "10px 16px 0" }}>
            <FieldLabel>Select Weaver</FieldLabel>
            <div style={{ position: "relative" }}>
              <Input value={weaverSearch} onChange={e => { setWeaverSearch(e.target.value); setShowWeaverList(true); }}
                onFocus={() => setShowWeaverList(true)} placeholder="Search weaver..."
                iconLeft={Search} size="lg" />
              {showWeaverList && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(110,15,45,0.12)", zIndex: 50, marginTop: 4 }}>
                  {weaversLoading && (
                    <div style={{ padding: "12px 16px", fontFamily: F.u, fontSize: 13, color: C.muted, textAlign: "center" }}>Loading weavers…</div>
                  )}
                  {!weaversLoading && WEAVERS.filter(w => w.name.toLowerCase().includes(weaverSearch.toLowerCase())).map(w => (
                    <Button key={w.id} variant="tertiary" fullWidth
                      onClick={() => { setSelectedWeaver(w); setWeaverSearch(w.name); setShowWeaverList(false); }}
                      className="justify-start gap-2.5 rounded-none border-0 border-b px-3.5 py-2.5 border-[rgba(110,15,45,0.12)]">
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: C.burg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: F.d, fontSize: 12, fontWeight: 700, color: "#FFF" }}>{w.avatar}</span>
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text }}>{w.name}</div>
                        <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted }}>{w.code} · {w.looms} Looms</div>
                      </div>
                    </Button>
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
                <div style={{ display: "inline-flex", background: "rgba(110,15,45,0.10)", padding: "4px 9px", borderRadius: 6 }}>
                  <span style={{ fontFamily: F.m, fontSize: 12, fontWeight: 600, color: C.burg }}>{selectedWeaver.name.split(" ")[0].toUpperCase()}-L{selectedWeaver.looms}-001</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Design */}
        <SectionLabel step={2} title="Link Design Code" />
        <div style={{ margin: "0 16px" }}>
          <Select value={designCode} onValueChange={setDesignCode} size="lg" placeholder="Search design codes...">
            <SelectItem value="BKB-045">BKB-045 · Cream Zari Border Saree</SelectItem>
            <SelectItem value="BKB-046">BKB-046 · Royal Blue Kanjeevaram</SelectItem>
            <SelectItem value="BKB-047">BKB-047 · Red Temple Border</SelectItem>
          </Select>
        </div>

        {/* Step 3 — Materials */}
        <SectionLabel step={3} title="Materials Being Given" />

        {/* Warp + Resham side by side */}
        <div className="grid-cols-1 md:grid-cols-2" style={{ display: "grid", gap: 10, margin: "0 16px 10px" }}>
          {/* Warp — kg / g toggle + quantity */}
          <div style={{ ...card, padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
              <Layers size={13} color={C.burg} />
              <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.text }}>Warp</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
                {(["kg", "g"] as const).map(u => (
                  <Button key={u} variant={warpUnit === u ? "primary" : "secondary"} size="sm" fullWidth onClick={() => setWarpUnit(u)}
                    className={warpUnit === u ? "rounded-md bg-[#6E0F2D] hover:bg-[#6E0F2D]" : "rounded-md"}>
                    {u}
                  </Button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <NumberInput value={warpQty === "" ? "" : Number(warpQty)} onValueChange={v => setWarpQty(v === "" ? "" : String(v))} step={0.01} placeholder="0"
                  className="font-mono pr-9" />
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
                  <Button key={u} variant={reshamUnit === u ? "primary" : "secondary"} size="sm" fullWidth onClick={() => setReshamUnit(u)}
                    className={reshamUnit === u ? "rounded-md bg-[#6E0F2D] hover:bg-[#6E0F2D]" : "rounded-md"}>
                    {u}
                  </Button>
                ))}
              </div>
              <div style={{ position: "relative" }}>
                <NumberInput value={reshamQty === "" ? "" : Number(reshamQty)} onValueChange={v => setReshamQty(v === "" ? "" : String(v))} step={0.01} placeholder="0"
                  className="font-mono pr-9" />
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

          <div className="grid-cols-1 md:grid-cols-2" style={{ display: "grid", gap: 10, marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text, marginBottom: 5 }}>Type</div>
              <div style={{ display: "flex", gap: 6 }}>
                {["Poly", "Silk"].map((t, i) => (
                  <Button key={t} variant={jariType === (i === 0 ? "Polyester" : "Silk Fast") ? "primary" : "secondary"} size="sm" fullWidth
                    onClick={() => setJariType(i === 0 ? "Polyester" : "Silk Fast")}
                    className={jariType === (i === 0 ? "Polyester" : "Silk Fast") ? "rounded-lg bg-[#6E0F2D] hover:bg-[#6E0F2D]" : "rounded-lg"}>
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text, marginBottom: 5 }}>Grade</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {["1G", "2G", "3G", "4G"].map(g => (
                  <Button key={g} variant={jariGrade === g ? "primary" : "secondary"} size="sm" onClick={() => setJariGrade(g)}
                    className={jariGrade === g ? "rounded-md bg-[#6E0F2D] hover:bg-[#6E0F2D]" : "rounded-md"}>
                    {g}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Unit selector + Quantity */}
          <div className="grid-cols-1 md:grid-cols-2" style={{ display: "grid", gap: 10 }}>
            <div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text, marginBottom: 5 }}>Unit</div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["Reels", "Buns"] as const).map(u => (
                  <Button key={u} variant={jariUnit === u ? "primary" : "secondary"} size="sm" fullWidth onClick={() => setJariUnit(u)}
                    className={jariUnit === u ? "rounded-lg bg-[#6E0F2D] hover:bg-[#6E0F2D]" : "rounded-lg"}>
                    {u}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 500, color: C.text, marginBottom: 5 }}>Qty ({jariUnit})</div>
              <div style={{ position: "relative" }}>
                <NumberInput value={jariQty === "" ? "" : Number(jariQty)} onValueChange={v => setJariQty(v === "" ? "" : String(v))} step={0.01} placeholder="0"
                  size="lg" className="font-mono pr-11" />
                <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontFamily: F.u, fontSize: 12, fontWeight: 700, color: C.gold }}>{jariUnit}</span>
              </div>
              {jariQty && (
                <div style={{ marginTop: 4, fontFamily: F.u, fontSize: 12, color: C.gold }}>
                  = {jariUnit === "Reels" ? `${Math.round(parseFloat(jariQty) * 4)} Buns` : `${Math.round(parseFloat(jariQty) / 4)} Reels`}
                  <span style={{ color: C.muted }}> (1 Reel = 4 Buns)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 4 — Signature */}
        <SectionLabel step={4} title="Collect Weaver Signature" />
        <div style={{ margin: "0 16px 10px", background: "rgba(110,15,45,0.04)", borderRadius: 8, padding: "8px 12px" }}>
          <p style={{ fontFamily: F.u, fontSize: 12, color: C.muted, lineHeight: 1.5, margin: 0 }}>
            Weaver must sign to confirm receipt. Choose method:
          </p>
        </div>

        <div className="grid-cols-1 md:grid-cols-2" style={{ display: "grid", gap: 10, margin: "0 16px" }}>
          <Button variant="tertiary" onClick={() => { setSigMethod(sigMethod === "here" ? "none" : "here"); setSigned(false); setRemoteSent(false); setRemoteConfirmed(false); }}
            className={`h-auto flex-col items-center whitespace-normal rounded-xl px-3 py-3.5 text-center relative ${sigMethod === "here" ? "border-2 border-[#6E0F2D] bg-[rgba(110,15,45,0.05)]" : "border border-[rgba(110,15,45,0.12)] bg-white"}`}>
            {sigMethod === "here" && <div style={{ position: "absolute", top: 6, right: 6, width: 14, height: 14, background: C.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={9} color="#FFF" /></div>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: sigMethod === "here" ? "rgba(110,15,45,0.10)" : "rgba(110,15,45,0.05)", margin: "0 auto 8px" }}>
              <PenLine size={20} color={sigMethod === "here" ? C.burg : C.muted} />
            </div>
            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>Sign Here</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>On this phone</div>
          </Button>

          <Button variant="tertiary" onClick={() => { setSigMethod(sigMethod === "remote" ? "none" : "remote"); setSigned(false); setRemoteSent(false); setRemoteConfirmed(false); }}
            className={`h-auto flex-col items-center whitespace-normal rounded-xl px-3 py-3.5 text-center relative ${sigMethod === "remote" ? "border-2 border-[#6E0F2D] bg-[rgba(110,15,45,0.05)]" : "border border-[rgba(110,15,45,0.12)] bg-white"}`}>
            {sigMethod === "remote" && <div style={{ position: "absolute", top: 6, right: 6, width: 14, height: 14, background: C.gold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={9} color="#FFF" /></div>}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, background: sigMethod === "remote" ? "rgba(110,15,45,0.10)" : "rgba(110,15,45,0.05)", margin: "0 auto 8px" }}>
              <Send size={20} color={sigMethod === "remote" ? C.burg : C.muted} />
            </div>
            <div style={{ fontFamily: F.u, fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>Send Request</div>
            <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Weaver's phone</div>
          </Button>
        </div>

        {/* Sign on this phone */}
        {sigMethod === "here" && (
          <div style={{ margin: "10px 16px 0" }}>
            <div style={{ background: "#FFF", border: `1px solid ${signed ? "rgba(30,102,64,0.30)" : "rgba(110,15,45,0.25)"}`, borderRadius: 12, height: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", cursor: "crosshair" }}
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
                <Button variant="link" onClick={e => { e.stopPropagation(); setSigned(false); }} className="absolute bottom-[7px] right-2.5 p-0 text-xs text-[#C4923A]">
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Send to weaver's phone */}
        {sigMethod === "remote" && (
          <div style={{ margin: "10px 16px 0", background: "#FFF", border: `1px solid rgba(110,15,45,0.15)`, borderRadius: 12, padding: 14 }}>
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
                  <Button variant="link" className="p-0 text-xs text-[#C4923A]">Resend</Button>
                  <Button variant="link" onClick={() => setRemoteConfirmed(true)} className="p-0 text-xs text-[#69635E] underline">Demo: Signed →</Button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted, marginBottom: 3 }}>Sending to: {selectedWeaver ? selectedWeaver.name : "Weaver"}</div>
                  <div style={{ fontFamily: F.m, fontWeight: 600, fontSize: 13, color: C.text }}>+91 98765 43210</div>
                </div>
                <Button variant="primary" fullWidth iconLeft={Send} onClick={() => setRemoteSent(true)} className="h-11 rounded-full bg-[#6E0F2D] hover:bg-[#6E0F2D] text-[13px]">
                  Send Signature Request
                </Button>
              </>
            )}
          </div>
        )}

        {/* Confirm */}
        <div style={{ padding: "14px 16px 0" }}>
          {(() => {
            const canConfirm = (sigMethod === "here" && signed) || (sigMethod === "remote" && remoteConfirmed);
            return (
              <Button
                variant="primary"
                fullWidth
                iconLeft={CheckCircle2}
                disabled={!canConfirm}
                onClick={() => canConfirm && setDone(true)}
                className={`h-[52px] rounded-full ${canConfirm ? "bg-[#1E6640] hover:bg-[#1E6640]" : ""}`}>
                Confirm — Open Batch
              </Button>
            );
          })()}
        </div>
      </div>
    </>
  );
}
