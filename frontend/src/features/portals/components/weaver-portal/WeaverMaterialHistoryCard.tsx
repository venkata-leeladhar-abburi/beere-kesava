import React, { useState, useRef } from "react";
import type { MaterialIssueRecord } from "../../../materials/contexts/MaterialIssueContext";
import { useMaterialIssue } from "../../../materials/contexts/MaterialIssueContext";
import { motion } from "motion/react";
import { Check, Clock, Pencil, Send } from "lucide-react";

const C = {
  burg: "#6B1A2A", dark: "#3D0E1A", gold: "#C4923A", green: "#1E6640",
  crim: "#C0392B", text: "#1A0A0F", muted: "#69635E",
  bdr: "rgba(139,26,46,0.12)", cream: "#F0E8D0", inp: "#FFF8E7", white: "#FFFFFF",
};
const F = {
  d: "'Plus Jakarta Sans', sans-serif",
  u: "'Inter', sans-serif",
  m: "'JetBrains Mono', monospace",
};

export function SignatureCanvas({ onSigned }: { onSigned?: (hasData: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); setDrawing(true); lastPos.current = getPos(e);
  };
  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const pos = getPos(e);
    ctx.strokeStyle = C.burg; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(lastPos.current!.x, lastPos.current!.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();
    lastPos.current = pos; setHasSig(true); onSigned?.(true);
  };
  const endDraw = () => { setDrawing(false); lastPos.current = null; };
  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSig(false); onSigned?.(false);
  };

  return (
    <div style={{ margin: "0 20px" }}>
      <div style={{ position: "relative", border: `1px solid rgba(139,26,42,0.25)`, borderRadius: 14, overflow: "hidden", background: "#FFF" }}>
        <canvas
          ref={canvasRef} width={350} height={160}
          style={{ display: "block", width: "100%", height: 160, touchAction: "none", cursor: "crosshair" }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        />
        {!hasSig && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", gap: 8 }}>
            <Pencil size={28} color={C.muted} style={{ opacity: 0.5 }} />
            <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>Sign here with your finger</span>
          </div>
        )}
        {hasSig && (
          <button onClick={clear} style={{ position: "absolute", bottom: 8, right: 12, background: "none", border: "none", fontFamily: F.u, fontSize: 12, color: C.gold, cursor: "pointer" }}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export function MaterialHistoryCard({ r, isTablet }: { r: MaterialIssueRecord; isTablet: boolean }) {
  const { updateSignatureStatus } = useMaterialIssue();
  const [sigMethod, setSigMethod] = useState<"none" | "here" | "remote">("none");
  const [hasSig, setHasSig] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const isPending = r.status === "pending-signature";
  const canConfirm = (sigMethod === "here" && hasSig) || (sigMethod === "remote" && requestSent);
  const handleConfirm = () => {
    if (!canConfirm) return;
    updateSignatureStatus(r.id, sigMethod === "remote" ? "remote" : "here");
  };

  return (
    <div style={{ background: "#FFF", border: `1px solid ${isPending ? C.gold : C.bdr}`, borderRadius: 18, padding: "22px 26px", boxShadow: "0 3px 16px rgba(44,24,16,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap" as const, gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
          <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 14, color: C.burg, background: "rgba(107,26,42,0.08)", borderRadius: 8, padding: "4px 10px" }}>{r.id}</span>
          {r.batchId && (
            <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.gold, background: "rgba(196,146,58,0.12)", borderRadius: 8, padding: "4px 10px" }}>{r.batchId}</span>
          )}
          <span style={{ fontFamily: F.u, fontSize: 13, color: C.muted }}>{new Date(r.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
        </div>
        {r.status === "signed" ? (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.green }}>
            <Check size={14} color={C.green} /> Signed
          </span>
        ) : isPending ? (
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.gold }}>
            <Clock size={14} color={C.gold} /> Pending
          </span>
        ) : (
          <span style={{ fontFamily: F.u, fontSize: 13, fontWeight: 600, color: C.muted }}>Cancelled</span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : `repeat(${Math.min(r.materials.length, 3)}, 1fr)`, gap: 10, marginBottom: 14 }}>
        {r.materials.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#FAFAF8", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 14px" }}>
            <div>
              <div style={{ fontFamily: F.u, fontWeight: 700, fontSize: 13, color: C.text }}>{m.materialType}{m.materialType === "Warp" && m.warpSubtype ? ` — ${m.warpSubtype}` : ""}</div>
              <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>{m.materialType === "Jari" ? `${m.jariType} · ${m.jariGrade} · ${m.jariColor}` : (m.description || "")}</div>
            </div>
            <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
              <div style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.burg }}>{m.quantity} {m.unit}</div>
              <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, background: C.cream, borderRadius: 6, padding: "1px 6px", marginTop: 3, display: "inline-block" }}>{m.grnBatchId}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Issued by {r.issuedBy}{r.signatureTimestamp ? ` · Signed on ${new Date(r.signatureTimestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}` : ""}</div>

      {isPending && (
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px dashed ${C.bdr}` }}>
          <div style={{ fontFamily: F.m, fontSize: 12, color: C.muted, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 10 }}>Collect Your Signature</div>
          <div style={{ display: "flex", flexDirection: isTablet ? "column" as const : "row" as const, gap: 10, marginBottom: sigMethod !== "none" ? 12 : 0 }}>
            <button onClick={() => setSigMethod(sigMethod === "here" ? "none" : "here")} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: "#F8F4F0", border: `1.5px solid ${sigMethod === "here" ? C.burg : C.bdr}`, borderRadius: 12, padding: "12px 16px", cursor: "pointer", textAlign: "left" as const }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: sigMethod === "here" ? C.burg : "rgba(107,26,42,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Pencil size={15} color={sigMethod === "here" ? "#FFF" : C.burg} />
              </div>
              <div>
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text }}>Sign here on this screen</div>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Draw your signature now</div>
              </div>
            </button>
            <button onClick={() => setSigMethod(sigMethod === "remote" ? "none" : "remote")} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: "#F8F4F0", border: `1.5px solid ${sigMethod === "remote" ? C.burg : C.bdr}`, borderRadius: 12, padding: "12px 16px", cursor: "pointer", textAlign: "left" as const }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: sigMethod === "remote" ? C.burg : "rgba(107,26,42,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Send size={15} color={sigMethod === "remote" ? "#FFF" : C.burg} />
              </div>
              <div>
                <div style={{ fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.text }}>Send to my phone</div>
                <div style={{ fontFamily: F.u, fontSize: 12, color: C.muted }}>Sign remotely on your own device</div>
              </div>
            </button>
          </div>
          {sigMethod === "here" && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ border: `1.5px solid rgba(107,26,42,0.22)`, borderRadius: 14, overflow: "hidden", background: "#FFF" }}>
                <SignatureCanvas onSigned={setHasSig} />
              </div>
            </div>
          )}
          {sigMethod === "remote" && !requestSent && (
            <button onClick={() => setRequestSent(true)} style={{ width: "100%", height: 44, border: `1.5px solid ${C.gold}`, background: "transparent", borderRadius: 999, fontFamily: F.u, fontWeight: 600, fontSize: 13, color: C.gold, cursor: "pointer", marginBottom: 12 }}>
              Send Signature Request to My Phone
            </button>
          )}
          {sigMethod === "remote" && requestSent && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(30,102,64,0.08)", border: `1px solid ${C.green}`, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
              <Check size={14} color={C.green} />
              <span style={{ fontFamily: F.u, fontSize: 12, color: C.green, fontWeight: 600 }}>Request sent to your phone!</span>
            </div>
          )}
          {sigMethod !== "none" && (
            <button
              onClick={handleConfirm} disabled={!canConfirm}
              style={{ width: "100%", height: 46, background: canConfirm ? C.green : "#C8C0B8", border: "none", borderRadius: 999, fontFamily: F.u, fontWeight: 700, fontSize: 14, color: "#FFF", cursor: canConfirm ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Check size={16} /> Confirm Material Receipt
            </button>
          )}
        </div>
      )}
    </div>
  );
}
