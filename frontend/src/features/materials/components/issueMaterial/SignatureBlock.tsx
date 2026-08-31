import React from "react";
import { CheckCircle2, Clock, PenLine, Send } from "lucide-react";
import { F, T } from "./theme";
import { SignatureCanvas, SignatureCanvasHandle } from "./SignatureCanvas";
import { Button } from "../../../../shared/ui/primitives";

// ── Signature capture block (mirrors WorkerWeavers WeaverSigBlock, T/F tokens) ─
export function SignatureBlock({ weaverName, sigMethod, setSigMethod, setSigned, remoteSent, setRemoteSent, canvasRef }: {
  weaverName: string;
  sigMethod: "none" | "here" | "remote"; setSigMethod: (m: "none" | "here" | "remote") => void;
  signed: boolean; setSigned: (v: boolean) => void;
  remoteSent: boolean; setRemoteSent: (v: boolean) => void;
  canvasRef: React.RefObject<SignatureCanvasHandle | null>;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12, marginBottom: 4 }}>
        <Button
          variant="tertiary"
          onClick={() => setSigMethod("here")}
          className={`h-auto flex-col whitespace-normal rounded-[14px] px-4 py-[18px] text-center relative border ${
            sigMethod === "here" ? "border-2 border-[#6E0F2D] bg-[rgba(110,15,45,0.05)]" : "border-[var(--border-default)] bg-white"
          }`}
        >
          {sigMethod === "here" && <div style={{ position: "absolute" as const, top: 8, right: 8, width: 16, height: 16, background: T.antiqueGold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={10} color="#FFF" /></div>}
          <div style={{ width: 44, height: 44, borderRadius: 12, background: sigMethod === "here" ? "rgba(110,15,45,0.10)" : "rgba(110,15,45,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <PenLine size={20} color={sigMethod === "here" ? T.royalBurgundy : T.taupe} />
          </div>
          <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>Sign Here on This Screen</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>Weaver signs on this device</div>
        </Button>
        <Button
          variant="tertiary"
          onClick={() => setSigMethod("remote")}
          className={`h-auto flex-col whitespace-normal rounded-[14px] px-4 py-[18px] text-center relative border ${
            sigMethod === "remote" ? "border-2 border-[#6E0F2D] bg-[rgba(110,15,45,0.05)]" : "border-[var(--border-default)] bg-white"
          }`}
        >
          {sigMethod === "remote" && <div style={{ position: "absolute" as const, top: 8, right: 8, width: 16, height: 16, background: T.antiqueGold, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={10} color="#FFF" /></div>}
          <div style={{ width: 44, height: 44, borderRadius: 12, background: sigMethod === "remote" ? "rgba(110,15,45,0.10)" : "rgba(110,15,45,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <Send size={20} color={sigMethod === "remote" ? T.royalBurgundy : T.taupe} />
          </div>
          <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>Send to Weaver's Portal</div>
          <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginTop: 3 }}>Weaver signs remotely</div>
        </Button>
      </div>

      {sigMethod === "here" && (
        <div style={{ marginTop: 14 }}>
          <SignatureCanvas ref={canvasRef} weaverName={weaverName} onChange={setSigned} />
        </div>
      )}

      {sigMethod === "remote" && (
        <div style={{ marginTop: 14, background: "#FFF", border: `1px solid ${T.borderDef}`, borderRadius: 14, padding: 18 }}>
          {remoteSent ? (
            <div style={{ background: "rgba(196,146,58,0.12)", border: `1px solid ${T.antiqueGold}`, borderRadius: 12, padding: 18, textAlign: "center" as const }}>
              <Clock size={24} color={T.antiqueGold} style={{ margin: "0 auto 8px" }} />
              <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown, marginBottom: 3 }}>Ready to confirm</div>
              <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe }}>
                {weaverName} will see this issuance on their dashboard's Confirm Materials page and can sign it there. It'll show as "Pending" here until they do.
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: F.ui, fontSize: 12, color: T.taupe, marginBottom: 3 }}>Sending to</div>
                <div style={{ fontFamily: F.ui, fontWeight: 700, fontSize: 14, color: T.luxuryBrown }}>{weaverName}'s portal</div>
              </div>
              <Button variant="primary" size="lg" onClick={() => setRemoteSent(true)} iconLeft={Send} className="w-full">
                Send Signature Request
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
