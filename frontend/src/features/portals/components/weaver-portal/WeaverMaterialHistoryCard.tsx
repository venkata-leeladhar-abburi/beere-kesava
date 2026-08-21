import React, { useState, useRef, forwardRef, useImperativeHandle } from "react";
import type { MaterialIssueRecord } from "@/features/materials";
import { useMaterialIssue } from "@/features/materials";
import { Check, Clock, Pencil } from "lucide-react";
import { Button } from "../../../../shared/ui/primitives";

const C = {
  burg: "#6E0F2D", dark: "#3D0E1A", gold: "#C89B47", green: "#1E6640",
  crim: "#C0392B", text: "#3B2314", muted: "#69635E",
  bdr: "rgba(110,15,45,0.10)", cream: "#F7F2EA", inp: "#FFFDF9", white: "#FFFFFF",
};
const F = {
  d: "'Plus Jakarta Sans', sans-serif",
  u: "'Inter', sans-serif",
  m: "'JetBrains Mono', monospace",
};

export interface SignatureCanvasHandle {
  /** Exports the drawn strokes as a PNG blob, or null if nothing was drawn. */
  toBlob: () => Promise<Blob | null>;
}

export const SignatureCanvas = forwardRef<SignatureCanvasHandle, { onSigned?: (hasData: boolean) => void }>(
  function SignatureCanvas({ onSigned }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useImperativeHandle(ref, () => ({
    toBlob: () =>
      new Promise((resolve) => {
        const canvas = canvasRef.current;
        if (!canvas || !hasSig) { resolve(null); return; }
        canvas.toBlob((blob) => resolve(blob), "image/png");
      }),
  }));

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
        {/* eslint-disable jsx-a11y/no-interactive-element-to-noninteractive-role -- signature pad requires pointer event handling on canvas element */}
        <canvas
          ref={canvasRef} width={350} height={160}
          role="img" aria-label="Signature pad — draw your signature with mouse or finger"
          style={{ display: "block", width: "100%", height: 160, touchAction: "none", cursor: "crosshair" }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        />
        {/* eslint-enable jsx-a11y/no-interactive-element-to-noninteractive-role */}
        {!hasSig && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none", gap: 8 }}>
            <Pencil size={28} color={C.muted} style={{ opacity: 0.5 }} />
            <span style={{ fontFamily: F.u, fontSize: 14, color: C.muted }}>Sign here with your finger</span>
          </div>
        )}
        {hasSig && (
          <Button onClick={clear} variant="link" className="absolute bottom-2 right-3 text-xs text-[#C89B47]">
            Clear
          </Button>
        )}
      </div>
    </div>
  );
});

export function MaterialHistoryCard({ r, isTablet }: { r: MaterialIssueRecord; isTablet: boolean }) {
  const { updateSignatureStatus } = useMaterialIssue();
  const [hasSig, setHasSig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<SignatureCanvasHandle | null>(null);

  const isPending = r.status === "pending-signature";
  const handleConfirm = async () => {
    if (!hasSig || submitting) return;
    const blob = await canvasRef.current?.toBlob();
    if (!blob) return;
    setSubmitting(true);
    try {
      await updateSignatureStatus(r.id, blob);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "#FFF", border: `1px solid ${isPending ? C.gold : C.bdr}`, borderRadius: 18, padding: "22px 26px", boxShadow: "0 3px 16px rgba(44,24,16,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap" as const, gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" as const }}>
          <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 14, color: C.burg, background: "rgba(110,15,45,0.08)", borderRadius: 8, padding: "4px 10px" }}>{r.id}</span>
          {r.batchId && (
            <span style={{ fontFamily: F.m, fontWeight: 700, fontSize: 13, color: C.gold, background: "rgba(200,155,71,0.12)", borderRadius: 8, padding: "4px 10px" }}>{r.batchId}</span>
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
          // Material line items carry no unique id — grnBatchId + materialType + index
          // distinguishes rows within this record (multiple lines can share a GRN batch).
          // eslint-disable-next-line react/no-array-index-key
          <div key={`${m.grnBatchId}-${m.materialType}-${i}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "#FAFAF8", border: `1px solid ${C.bdr}`, borderRadius: 10, padding: "10px 14px" }}>
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
          <div style={{ marginBottom: 12 }}>
            <div style={{ border: `1.5px solid rgba(110,15,45,0.22)`, borderRadius: 14, overflow: "hidden", background: "#FFF" }}>
              <SignatureCanvas ref={canvasRef} onSigned={setHasSig} />
            </div>
          </div>
          <Button
            onClick={() => void handleConfirm()} disabled={!hasSig || submitting}
            fullWidth
            className={
              "h-[46px] border-none rounded-full font-bold text-sm text-white " +
              (hasSig && !submitting ? "bg-[#1E6640] hover:bg-[#1E6640]" : "bg-[#C8C0B8]")
            }
          >
            <Check size={16} /> {submitting ? "Confirming…" : "Confirm Material Receipt"}
          </Button>
        </div>
      )}
    </div>
  );
}
