import React from "react";
import { Check, Info, Send } from "lucide-react";
import { C, F, BG_IMAGE } from "../theme";
import { DesktopHero } from "./DesktopHero";
import { Button, Input, Textarea } from "../../../../../shared/ui/primitives";

function DSectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 5, height: 28, background: C.burg, borderRadius: 3 }} />
        <span style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.text }}>{label}</span>
      </div>
    </div>
  );
}

type MaterialKey = "warp" | "resham" | "jari";

export function WarpSection({
  bp, isTablet, warpBatch, setWarpBatch, materials, setMaterials, amounts, setAmounts,
  reason, setReason, warpSubmitted, setWarpSubmitted,
}: {
  bp: "tablet" | "desktop"; isTablet: boolean;
  warpBatch: "086" | "089"; setWarpBatch: (b: "086" | "089") => void;
  materials: Record<MaterialKey, boolean>; setMaterials: React.Dispatch<React.SetStateAction<Record<MaterialKey, boolean>>>;
  amounts: Record<MaterialKey, string>; setAmounts: React.Dispatch<React.SetStateAction<Record<MaterialKey, string>>>;
  reason: string; setReason: (v: string) => void;
  warpSubmitted: boolean; setWarpSubmitted: (v: boolean) => void;
}) {
  return (
    <>
      <DesktopHero
        bp={bp}
        breadcrumb="SINCE 1999 · WEAVER PORTAL · WARP REQUEST"
        titleMain="Warp Request"
        titleSub="& Additional Materials"
        description="Request additional raw materials for your active batches. Warp requests are unlocked after submitting 50% of your batch."
        pills={[
          { text: "BATCH-086 · 60% Complete · Unlocked", color: C.gold },
          { text: "BATCH-089 · 50% Complete · Unlocked", color: C.gold },
          { text: "2 of 3 Requests Approved" },
        ]}
        stats={[
          { label: "BATCH-086 Progress", val: "3/5", sub: "60% complete — warp unlocked" },
          { label: "BATCH-089 Progress", val: "4/8", sub: "50% complete — warp unlocked", highlight: true },
          { label: "Total Requests Raised", val: "3", sub: "This month" },
          { label: "Approval Rate", val: "67%", sub: "2 approved, 1 rejected" },
        ]}
        bgUrl={BG_IMAGE}
      />
      <div style={{ padding: isTablet ? "24px 28px 40px" : "40px 48px 56px" }}>
        {/* Batch selector */}
        <div style={{ display: "flex", gap: 14, marginBottom: 36 }}>
          {(["086", "089"] as const).map(b => (
            <Button
              key={b}
              onClick={() => setWarpBatch(b)}
              className={
                "rounded-full px-8 py-3 h-auto border-2 border-[#6B1A2A] font-mono text-sm font-bold transition-all " +
                (warpBatch === b ? "bg-[#6B1A2A] text-white" : "bg-transparent text-[#6B1A2A]")
              }
            >
              BATCH-{b}
            </Button>
          ))}
        </div>

        {warpSubmitted ? (
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" as const, padding: "60px 48px", background: "#FFF", borderRadius: 24, border: `1px solid ${C.bdr}`, boxShadow: "0 4px 32px rgba(44,24,16,0.10)" }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "rgba(30,102,64,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
              <Check size={52} color={C.green} />
            </div>
            <div style={{ fontFamily: F.d, fontWeight: 700, fontSize: 38, color: C.text, marginBottom: 16 }}>Warp Request Sent!</div>
            <div style={{ fontFamily: F.u, fontSize: 16, color: C.muted, lineHeight: 1.7, marginBottom: 36 }}>Your request has been sent to worker staff, admin, and superadmin. You will be notified when a decision is made.</div>
            <Button onClick={() => { setWarpSubmitted(false); setMaterials({ warp: false, resham: false, jari: false }); setAmounts({ warp: "", resham: "", jari: "" }); setReason(""); }} fullWidth className="block h-[60px] bg-[#6B1A2A] border-none rounded-full font-bold text-lg text-white">
              ← Back to Warp Requests
            </Button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "1fr 380px", gap: 36, alignItems: "start" }}>
            {/* Left: Form */}
            <div>
              {/* Unlock status */}
              <div style={{ background: "rgba(30,102,64,0.08)", border: `2px solid ${C.green}`, borderRadius: 18, padding: "22px 28px", marginBottom: 32, display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={28} color="#FFF" />
                </div>
                <div>
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 20, color: C.green }}>Warp Request Unlocked for BATCH-{warpBatch}</div>
                  <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, marginTop: 4 }}>
                    You have submitted {warpBatch === "086" ? "3 of 5 (60%)" : "4 of 8 (50%)"} sarees — warp request is now available.
                  </div>
                </div>
              </div>

              <DSectionHeader label="Request Additional Materials" />
              <div style={{ background: "#FFF", borderRadius: 20, border: `1px solid ${C.bdr}`, padding: "32px", boxShadow: "0 4px 20px rgba(44,24,16,0.08)", marginBottom: 24 }}>
                <div style={{ display: "inline-block", background: "rgba(107,26,42,0.08)", color: C.burg, borderRadius: 999, padding: "8px 20px", fontFamily: F.m, fontSize: 16, marginBottom: 28 }}>BATCH-{warpBatch}</div>

                <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 18, color: C.text, marginBottom: 20 }}>What material do you need?</div>
                <div style={{ marginBottom: 28 }}>
                  {(["warp", "resham", "jari"] as const).map((mat) => (
                    <label key={mat} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 0", cursor: "pointer", borderBottom: mat !== "jari" ? `1px solid ${C.bdr}` : "none" }}>
                      <div onClick={() => setMaterials(m => ({ ...m, [mat]: !m[mat] }))} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); (() => setMaterials(m => ({ ...m, [mat]: !m[mat] })))?.(); } }} style={{ width: 28, height: 28, borderRadius: 8, border: `2px solid ${materials[mat] ? C.burg : C.bdr}`, background: materials[mat] ? C.burg : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                        {materials[mat] && <Check size={16} color="#FFF" />}
                      </div>
                      <span style={{ fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text }}>
                        {mat === "warp" ? "More Warp" : mat === "resham" ? "More Resham" : "More Jari"}
                      </span>
                    </label>
                  ))}
                </div>

                {(["warp", "resham", "jari"] as const).filter(m => materials[m]).map(mat => (
                  <div key={mat} style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text, marginBottom: 10 }}>
                      {mat === "warp" ? "Warp amount (kg):" : mat === "resham" ? "Resham amount and color:" : "Jari amount (reels):"}
                    </label>
                    <Input value={amounts[mat]} onChange={e => setAmounts(a => ({ ...a, [mat]: e.target.value }))} placeholder={mat === "warp" ? "e.g. 3 kg" : mat === "resham" ? "e.g. 500g Red" : "e.g. 4 reels"}
                      size="lg" className="font-mono" containerClassName="rounded-xl h-14" />
                  </div>
                ))}

                <div>
                  <label style={{ display: "block", fontFamily: F.u, fontWeight: 600, fontSize: 16, color: C.text, marginBottom: 10 }}>Why do you need more material?</label>
                  <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Example: Extra sarees needed for a large order" rows={3}
                    className="rounded-[14px] min-h-[110px] resize-none text-base" />
                </div>
              </div>

              <Button onClick={() => (materials.warp || materials.resham || materials.jari) ? setWarpSubmitted(true) : undefined}
                fullWidth
                className="h-[60px] bg-[#6B1A2A] border-none rounded-full font-bold text-lg text-white gap-3 shadow-[0_4px_20px_rgba(107,26,42,0.35)]">
                <Send size={22} /> Send Warp Request
              </Button>
            </div>

            {/* Right: Rules + History */}
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 22 }}>
              <div style={{ background: "#FFF8E8", border: `1px solid rgba(196,146,58,0.28)`, borderRadius: 18, padding: "24px 26px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <Info size={22} color={C.gold} />
                  <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 18, color: C.text }}>System Rule</div>
                </div>
                <div style={{ fontFamily: F.u, fontSize: 14, color: C.muted, lineHeight: 1.75 }}>You can raise a warp request only after submitting 50% of your batch. This ensures enough progress before more materials are allocated.</div>
              </div>

              <div style={{ background: "#FFF", border: `1px solid ${C.bdr}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 20px rgba(44,24,16,0.08)" }}>
                <div style={{ padding: "20px 26px", borderBottom: `1px solid ${C.bdr}`, background: "#FAFAF8" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 5, height: 22, background: C.burg, borderRadius: 3 }} />
                    <span style={{ fontFamily: F.u, fontSize: 16, fontWeight: 700, color: C.text }}>Previous Requests</span>
                  </div>
                </div>
                {[
                  { date: "10 Jun 2026", mat: "3 kg Warp", status: "Approved", ok: true },
                  { date: "05 Jun 2026", mat: "Resham Red 500g", status: "Rejected", ok: false },
                  { date: "01 Jun 2026", mat: "2 kg Warp", status: "Approved", ok: true },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 26px", borderBottom: i < 2 ? `1px solid rgba(107,26,42,0.06)` : "none" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.ok ? C.green : C.crim, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.m, fontSize: 13, color: C.muted, marginBottom: 3 }}>{r.date}</div>
                      <div style={{ fontFamily: F.u, fontSize: 16, fontWeight: 500, color: C.text }}>{r.mat}</div>
                    </div>
                    <span style={{ fontFamily: F.u, fontSize: 14, fontWeight: 700, color: r.ok ? C.green : C.crim }}>{r.ok ? "✓ Approved" : "✗ Rejected"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
